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
    try {
        const { slot: slotId } = req.body;

        if (!slotId || !mongoose.isValidObjectId(slotId)) {
            return res.status(400).json({
                success: false,
                message: "A valid slot ID is required."
            });
        }

        const slot = await ExamSlot.findOne({
            _id: slotId,
            isActive: true
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: "Available slot not found."
            });
        }

        const exam = await Examination.findOne({
            _id: slot.examination,
            status: "published",
            bookingStart: { $lte: new Date() },
            bookingEnd: { $gt: new Date() }
        });

        if (!exam) {
            return res.status(400).json({
                success: false,
                message: "Booking is not currently open for this examination."
            });
        }

        if (slot.startTime <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "This slot has already started."
            });
        }

        const existingBooking = await Booking.findOne({
            student: req.user._id,
            slot: slot._id,
            status: "booked"
        });

        if (existingBooking) {
            return res.status(409).json({
                success: false,
                message: "You have already booked this slot."
            });
        }

        // A student can only have one active booking per examination.
        const existingExamBooking = await Booking.findOne({
            student: req.user._id,
            examination: exam._id,
            status: "booked"
        });

        if (existingExamBooking) {
            return res.status(409).json({
                success: false,
                message: "You already have a booking for this examination."
            });
        }

        // Atomically claim a seat so concurrent requests cannot exceed capacity.
        const claimedSlot = await ExamSlot.findOneAndUpdate(
            {
                _id: slot._id,
                isActive: true,
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
                $addToSet: { bookedStudents: req.user._id }
            },
            { new: true }
        );

        // Older slot documents may not have a bookedStudents array.
        // If no seat was claimed, report that the slot is full.
        if (!claimedSlot) {
            return res.status(409).json({
                success: false,
                message: "This slot is full or no longer available."
            });
        }

        const booking = await Booking.create({
            student: req.user._id,
            slot: slot._id,
            examination: exam._id,
            status: "booked"
        });

        return res.status(201).json({
            success: true,
            message: "Examination slot booked successfully.",
            data: booking
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A duplicate booking is not allowed."
            });
        }

        console.error("Create booking error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create booking."
        });
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
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID."
            });
        }

        const booking = await Booking.findOne({
            _id: id,
            student: req.user._id,
            status: "booked"
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Active booking not found."
            });
        }

        const slot = await ExamSlot.findById(booking.slot);

        if (!slot || slot.startTime <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "This booking can no longer be cancelled."
            });
        }

        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        await booking.save();

        await ExamSlot.updateOne(
            { _id: slot._id },
            { $pull: { bookedStudents: req.user._id } }
        );

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully.",
            data: booking
        });
    } catch (error) {
        console.error("Cancel booking error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel booking."
        });
    }
};