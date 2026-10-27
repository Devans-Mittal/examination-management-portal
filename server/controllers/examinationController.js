import mongoose from "mongoose";
import Examination from "../models/Examination.js";
import Course from "../models/Course.js";
import User from "../models/User.js";

const validTypes = ["viva", "practical", "project", "theory"];

const validateDates = ({
    bookingStart,
    bookingEnd,
    examinationStart,
    examinationEnd,
}) => {
    const dates = [
        bookingStart,
        bookingEnd,
        examinationStart,
        examinationEnd,
    ].map((date) => new Date(date));

    if (dates.some((date) => Number.isNaN(date.getTime()))) {
        return "All examination dates must be valid.";
    }

    const [bs, be, es, ee] = dates;

    if (bs >= be) {
        return "Booking start must be before booking end.";
    }

    if (be > es) {
        return "Booking must close before the examination begins.";
    }

    if (es >= ee) {
        return "Examination start must be before examination end.";
    }

    return null;
};

const validateExaminers = async (examinerIds) => {
    if (!Array.isArray(examinerIds)) {
        return "Examiners must be provided as an array.";
    }

    if (
        examinerIds.some(
            (id) => !mongoose.isValidObjectId(id)
        )
    ) {
        return "One or more examiner IDs are invalid.";
    }

    const uniqueIds = [...new Set(examinerIds.map(String))];

    if (uniqueIds.length !== examinerIds.length) {
        return "Duplicate examiners are not allowed.";
    }

    if (uniqueIds.length === 0) {
        return null;
    }

    const examiners = await User.find({
        _id: { $in: uniqueIds },
        role: "examiner",
        approvalStatus: "approved",
        isActive: true,
    }).select("_id");

    if (examiners.length !== uniqueIds.length) {
        return "All assigned examiners must be approved and active.";
    }

    return null;
};

// CREATE EXAMINATION
export const createExamination = async (req, res) => {
    try {
        const {
            title,
            description,
            course,
            examinationType,
            examiners = [],
            bookingStart,
            bookingEnd,
            examinationStart,
            examinationEnd,
            durationMinutes,
        } = req.body;

        if (
            !title?.trim() ||
            !course ||
            !examinationType ||
            !bookingStart ||
            !bookingEnd ||
            !examinationStart ||
            !examinationEnd ||
            durationMinutes === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required examination fields.",
            });
        }

        if (!mongoose.isValidObjectId(course)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID.",
            });
        }

        if (!validTypes.includes(examinationType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination type.",
            });
        }

        if (
            !Number.isInteger(durationMinutes) ||
            durationMinutes < 5 ||
            durationMinutes > 480
        ) {
            return res.status(400).json({
                success: false,
                message: "Duration must be between 5 and 480 minutes.",
            });
        }

        const dateError = validateDates({
            bookingStart,
            bookingEnd,
            examinationStart,
            examinationEnd,
        });

        if (dateError) {
            return res.status(400).json({
                success: false,
                message: dateError,
            });
        }

        const existingCourse = await Course.findOne({
            _id: course,
            isActive: true,
        });

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "Active course not found.",
            });
        }

        const examinerError = await validateExaminers(examiners);

        if (examinerError) {
            return res.status(400).json({
                success: false,
                message: examinerError,
            });
        }

        const examination = await Examination.create({
            title: title.trim(),
            description: description?.trim() || "",
            course,
            examinationType,
            examiners,
            bookingStart: new Date(bookingStart),
            bookingEnd: new Date(bookingEnd),
            examinationStart: new Date(examinationStart),
            examinationEnd: new Date(examinationEnd),
            durationMinutes,
            status: "draft",
            createdBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Examination created successfully as a draft.",
            examination,
        });
    } catch (error) {
        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create examination error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create examination.",
        });
    }
};

// GET EXAMINATIONS
export const getExaminations = async (req, res) => {
    try {
        const examinations = await Examination.find()
            .populate("course", "courseCode title department semester")
            .populate("examiners", "fullName email department")
            .populate("createdBy", "fullName email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: examinations.length,
            examinations,
        });
    } catch (error) {
        console.error("Get examinations error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch examinations.",
        });
    }
};

// GET ONE EXAMINATION
export const getExaminationById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination ID.",
            });
        }

        const examination = await Examination.findById(req.params.id)
            .populate("course", "courseCode title department semester")
            .populate("examiners", "fullName email department");

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: "Examination not found.",
            });
        }

        return res.status(200).json({
            success: true,
            examination,
        });
    } catch (error) {
        console.error("Get examination error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch examination.",
        });
    }
};

// UPDATE EXAMINATION
export const updateExamination = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination ID.",
            });
        }

        const examination = await Examination.findById(req.params.id);

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: "Examination not found.",
            });
        }

        if (
            ["completed", "cancelled"].includes(examination.status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Completed or cancelled examinations cannot be edited.",
            });
        }

        const allowedFields = [
            "title",
            "description",
            "course",
            "examinationType",
            "examiners",
            "bookingStart",
            "bookingEnd",
            "examinationStart",
            "examinationEnd",
            "durationMinutes",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const merged = {
            title: updates.title ?? examination.title,
            description: updates.description ?? examination.description,
            course: updates.course ?? examination.course,
            examinationType:
                updates.examinationType ?? examination.examinationType,
            examiners: updates.examiners ?? examination.examiners,
            bookingStart: updates.bookingStart ?? examination.bookingStart,
            bookingEnd: updates.bookingEnd ?? examination.bookingEnd,
            examinationStart:
                updates.examinationStart ?? examination.examinationStart,
            examinationEnd:
                updates.examinationEnd ?? examination.examinationEnd,
            durationMinutes:
                updates.durationMinutes ?? examination.durationMinutes,
        };

        if (
            typeof merged.title !== "string" ||
            !merged.title.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Examination title cannot be empty.",
            });
        }

        if (!validTypes.includes(merged.examinationType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination type.",
            });
        }

        if (
            !Number.isInteger(merged.durationMinutes) ||
            merged.durationMinutes < 5 ||
            merged.durationMinutes > 480
        ) {
            return res.status(400).json({
                success: false,
                message: "Duration must be between 5 and 480 minutes.",
            });
        }

        const dateError = validateDates(merged);

        if (dateError) {
            return res.status(400).json({
                success: false,
                message: dateError,
            });
        }

        if (!mongoose.isValidObjectId(merged.course)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID.",
            });
        }

        const activeCourse = await Course.findOne({
            _id: merged.course,
            isActive: true,
        });

        if (!activeCourse) {
            return res.status(400).json({
                success: false,
                message: "Selected course is not active.",
            });
        }

        const examinerError = await validateExaminers(merged.examiners);

        if (examinerError) {
            return res.status(400).json({
                success: false,
                message: examinerError,
            });
        }

        // Published examinations cannot be rescheduled through this
        // basic endpoint. A separate workflow must handle existing bookings.
        const scheduleFields = [
            "course",
            "examiners",
            "bookingStart",
            "bookingEnd",
            "examinationStart",
            "examinationEnd",
            "durationMinutes",
        ];

        if (
            examination.status === "published" &&
            scheduleFields.some((field) => updates[field] !== undefined)
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Unpublish the examination before changing its schedule. Existing bookings must be handled separately.",
            });
        }

        if (updates.title !== undefined) {
            examination.title = merged.title.trim();
        }

        if (updates.description !== undefined) {
            examination.description = merged.description.trim();
        }

        for (const field of [
            "course",
            "examinationType",
            "examiners",
            "bookingStart",
            "bookingEnd",
            "examinationStart",
            "examinationEnd",
            "durationMinutes",
        ]) {
            if (updates[field] !== undefined) {
                examination[field] = merged[field];
            }
        }

        await examination.save();

        return res.status(200).json({
            success: true,
            message: "Examination updated successfully.",
            examination,
        });
    } catch (error) {
        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Update examination error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update examination.",
        });
    }
};

// PUBLISH EXAMINATION
export const publishExamination = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination ID.",
            });
        }

        const examination = await Examination.findById(req.params.id);

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: "Examination not found.",
            });
        }

        if (examination.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Only draft examinations can be published.",
            });
        }

        if (examination.examiners.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Assign at least one examiner before publishing.",
            });
        }

        const now = new Date();

        if (examination.bookingStart <= now) {
            return res.status(400).json({
                success: false,
                message:
                    "The booking start must be in the future when publishing.",
            });
        }

        if (examination.examinationStart <= now) {
            return res.status(400).json({
                success: false,
                message:
                    "The examination start must be in the future when publishing.",
            });
        }

        // Revalidate examiner eligibility in case an account was
        // deactivated after the examination was created.
        const examinerError = await validateExaminers(
            examination.examiners.map(String)
        );

        if (examinerError) {
            return res.status(400).json({
                success: false,
                message: examinerError,
            });
        }

        examination.status = "published";

        await examination.save();

        return res.status(200).json({
            success: true,
            message: "Examination published successfully.",
            examination,
        });
    } catch (error) {
        console.error("Publish examination error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to publish examination.",
        });
    }
};

// CANCEL EXAMINATION
export const cancelExamination = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination ID.",
            });
        }

        const examination = await Examination.findById(req.params.id);

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: "Examination not found.",
            });
        }

        if (examination.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Completed examinations cannot be cancelled.",
            });
        }

        if (examination.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Examination is already cancelled.",
            });
        }

        examination.status = "cancelled";

        await examination.save();

        return res.status(200).json({
            success: true,
            message: "Examination cancelled successfully.",
            examination,
        });
    } catch (error) {
        console.error("Cancel examination error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel examination.",
        });
    }
};

export const completeExamination = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination ID."
            });
        }

        const examination = await Examination.findById(id);

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: "Examination not found."
            });
        }

        if (examination.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "Only published examinations can be completed."
            });
        }

        if (new Date() < examination.examinationEnd) {
            return res.status(400).json({
                success: false,
                message: "The examination cannot be completed before its scheduled end time."
            });
        }

        examination.status = "completed";
        await examination.save();

        return res.status(200).json({
            success: true,
            message: "Examination marked as completed.",
            data: examination
        });
    } catch (error) {
        console.error("Complete examination error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to complete examination."
        });
    }
};