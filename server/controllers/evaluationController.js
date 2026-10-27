import mongoose from "mongoose";
import Evaluation from "../models/Evaluation.js";
import Examination from "../models/Examination.js";
import Booking from "../models/Booking.js";
import ExamSlot from "../models/ExamSlot.js";

// View students booked for examinations assigned to the examiner
export const getStudentsForEvaluation = async (req, res) => {
    try {
        const examinations = await Examination.find({
            examiners: req.user._id
        }).select("_id title examinationType status");

        const examinationIds = examinations.map((exam) => exam._id);

        // Find only slots assigned to the currently logged-in examiner.
        const examinerSlots = await ExamSlot.find({
            examination: { $in: examinationIds },
            examiner: req.user._id
        }).select("_id");

        const slotIds = examinerSlots.map((slot) => slot._id);

        const bookings = await Booking.find({
            examination: { $in: examinationIds },
            slot: { $in: slotIds },
            status: "booked"
        })
            .populate("student", "fullName email department")
            .populate({
                path: "slot",
                select: "startTime endTime examiner"
            })
            .populate("examination", "title examinationType status")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error("Get evaluation students error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch students for evaluation."
        });
    }
};

// Submit an evaluation
export const submitEvaluation = async (req, res) => {
    try {
        const { examination, student, marksObtained, maxMarks = 100, feedback = "" } =
            req.body;

        if (!examination || !student || marksObtained === undefined) {
            return res.status(400).json({
                success: false,
                message: "Examination, student, and marks obtained are required."
            });
        }

        if (
            !mongoose.isValidObjectId(examination) ||
            !mongoose.isValidObjectId(student)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination or student ID."
            });
        }

        if (
            typeof marksObtained !== "number" ||
            typeof maxMarks !== "number" ||
            !Number.isFinite(marksObtained) ||
            !Number.isFinite(maxMarks) ||
            maxMarks <= 0 ||
            marksObtained < 0 ||
            marksObtained > maxMarks
        ) {
            return res.status(400).json({
                success: false,
                message: "Marks must be numeric, non-negative, and cannot exceed maximum marks."
            });
        }

        const exam = await Examination.findOne({
            _id: examination,
            examiners: req.user._id
        });

        if (!exam) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this examination."
            });
        }

        if (exam.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "The examination must be marked completed before evaluation."
            });
        }

        const booking = await Booking.findOne({
            examination: exam._id,
            student,
            status: { $in: ["booked", "completed"] }
        }).populate("slot", "examiner");

        if (!booking) {
            return res.status(400).json({
                success: false,
                message: "This student does not have an eligible booking for the examination."
            });
        }

        if (!booking.slot) {
            return res.status(400).json({
                success: false,
                message: "The booking does not have a valid examination slot."
            });
        }

        if (booking.slot.examiner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to evaluate this student's booking."
            });
        }

        const evaluation = await Evaluation.create({
            examination: exam._id,
            student,
            examiner: req.user._id,
            marksObtained,
            maxMarks,
            feedback,
            status: "submitted"
        });

        return res.status(201).json({
            success: true,
            message: "Evaluation submitted successfully.",
            data: evaluation
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An evaluation already exists for this student and examination."
            });
        }

        console.error("Submit evaluation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to submit evaluation."
        });
    }
};

// View evaluations submitted by the logged-in examiner
export const getMyEvaluations = async (req, res) => {
    try {
        const evaluations = await Evaluation.find({
            examiner: req.user._id
        })
            .populate("student", "fullName email department")
            .populate("examination", "title examinationType status")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: evaluations.length,
            data: evaluations
        });
    } catch (error) {
        console.error("Get evaluations error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch evaluations."
        });
    }
};