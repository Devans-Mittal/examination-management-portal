import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import ExamSlot from "../models/ExamSlot.js";
import Examination from "../models/Examination.js";

// View published examinations and their active slots
export const getAvailableExaminations = async (req, res) => {
    try {
        const examinations = await Examination.find({
            status: "published",
            bookingStart: { $lte: new Date() },
            bookingEnd: { $gt: new Date() }
        })
            .populate("course", "courseCode title")
            .populate("examiners", "fullName");

        const results = await Promise.all(
            examinations.map(async (exam) => {
                const slots = await ExamSlot.find({
                    examination: exam._id,
                    isActive: true,
                    startTime: { $gt: new Date() }
                }).sort({ startTime: 1 });

                const slotsWithAvailability = await Promise.all(
                    slots.map(async (slot) => {
                        const bookedCount = await Booking.countDocuments({
                            slot: slot._id,
                            status: "booked"
                        });

                        return {
                            ...slot.toObject(),
                            bookedCount,
                            availableSeats: Math.max(0, slot.capacity - bookedCount)
                        };
                    })
                );

                return {
                    ...exam.toObject(),
                    slots: slotsWithAvailability
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error("Get available examinations error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch available examinations."
        });
    }
};

// Book an available slot
export const createBooking = async (req, res) => {
    const { slot: slotId } = req.body;

    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
        return res.status(400).json({
            success: false,
            message: "A valid slot ID is required."
        });
    }

    const session = await mongoose.startSession();
    let createdBooking;

    try {
        await session.withTransaction(async () => {
            const now = new Date();

            // 1. Find the requested active slot.
            const slot = await ExamSlot.findOne({
                _id: slotId,
                isActive: true
            }).session(session);

            if (!slot) {
                const error = new Error("Slot not found or inactive.");
                error.statusCode = 404;
                throw error;
            }

            // 2. Validate the examination and booking window.
            const examination = await Examination.findById(
                slot.examination
            ).session(session);

            if (
                !examination ||
                examination.status !== "published" ||
                now < examination.bookingStart ||
                now >= examination.bookingEnd
            ) {
                const error = new Error(
                    "This examination is not currently available for booking."
                );
                error.statusCode = 400;
                throw error;
            }

            if (slot.startTime <= now) {
                const error = new Error(
                    "This examination slot has already started or passed."
                );
                error.statusCode = 400;
                throw error;
            }

            // 3. Prevent duplicate bookings for the same slot.
            const existingSlotBooking = await Booking.findOne({
                student: req.user._id,
                slot: slot._id
            }).session(session);

            if (existingSlotBooking) {
                const error = new Error(
                    "You have already booked this slot. Cancelled bookings cannot be reused."
                );
                error.statusCode = 409;
                throw error;
            }

            // 4. Prevent multiple active bookings for the same examination.
            const existingExamBooking = await Booking.findOne({
                student: req.user._id,
                examination: examination._id,
                status: "booked"
            }).session(session);

            if (existingExamBooking) {
                const error = new Error(
                    "You already have a booking for this examination."
                );
                error.statusCode = 409;
                throw error;
            }

            // 5. Atomically claim a seat, but only if capacity remains.
            const claimedSlot = await ExamSlot.findOneAndUpdate(
                {
                    _id: slot._id,
                    isActive: true,
                    bookedStudents: { $ne: req.user._id },
                    $expr: {
                        $lt: [
                            {
                                $size: {
                                    $ifNull: ["$bookedStudents", []]
                                }
                            },
                            "$capacity"
                        ]
                    }
                },
                {
                    $addToSet: {
                        bookedStudents: req.user._id
                    }
                },
                {
                    new: true,
                    session
                }
            );

            if (!claimedSlot) {
                const error = new Error(
                    "This slot is full or you have already reserved it."
                );
                error.statusCode = 409;
                throw error;
            }

            // 6. Create the booking in the same transaction.
            const bookings = await Booking.create(
                [
                    {
                        student: req.user._id,
                        slot: slot._id,
                        examination: examination._id,
                        status: "booked"
                    }
                ],
                { session }
            );

            createdBooking = bookings[0];
        });

        return res.status(201).json({
            success: true,
            message: "Examination slot booked successfully.",
            data: createdBooking
        });

    } catch (error) {
        console.error("Create booking:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already booked this slot."
            });
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Unable to create booking."
        });

    } finally {
        await session.endSession();
    }
};
// View the logged-in student's bookings
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            student: req.user._id
        })
            .populate({
                path: "slot",
                select: "startTime endTime capacity"
            })
            .populate({
                path: "examination",
                select: "title examinationType examinationStart status",
                populate: {
                    path: "course",
                    select: "courseCode title"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error("Get bookings error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your bookings."
        });
    }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking ID."
        });
    }

    const session = await mongoose.startSession();
    let cancelledBooking;

    try {
        await session.withTransaction(async () => {
            // 1. Find a booking belonging to the logged-in student.
            const booking = await Booking.findOne({
                _id: id,
                student: req.user._id,
                status: "booked"
            }).session(session);

            if (!booking) {
                const error = new Error(
                    "Active booking not found."
                );
                error.statusCode = 404;
                throw error;
            }

            // 2. Confirm the slot exists and has not started.
            const slot = await ExamSlot.findById(
                booking.slot
            ).session(session);

            if (!slot) {
                const error = new Error(
                    "The examination slot could not be found."
                );
                error.statusCode = 404;
                throw error;
            }

            if (slot.startTime <= new Date()) {
                const error = new Error(
                    "This booking can no longer be cancelled because the slot has started or passed."
                );
                error.statusCode = 400;
                throw error;
            }

            // 3. Mark the booking as cancelled.
            booking.status = "cancelled";
            booking.cancelledAt = new Date();

            await booking.save({ session });

            // 4. Release the reserved seat in the same transaction.
            await ExamSlot.updateOne(
                { _id: slot._id },
                {
                    $pull: {
                        bookedStudents: req.user._id
                    }
                },
                { session }
            );

            cancelledBooking = booking;
        });

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully.",
            data: cancelledBooking
        });

    } catch (error) {
        console.error("Cancel booking:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Unable to cancel booking."
        });

    } finally {
        await session.endSession();
    }
};