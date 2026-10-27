import mongoose from "mongoose";
import ExamSlot from "../models/ExamSlot.js";
import Examination from "../models/Examination.js";

export const getAssignedExaminations = async (req, res) => {
    try {
        const examinations = await Examination.find({
            examiners: req.user._id,
            status: "published"
        })
            .populate("course", "courseCode title")
            .sort({ examinationStart: 1 });

        return res.status(200).json({
            success: true,
            count: examinations.length,
            data: examinations
        });
    } catch (error) {
        console.error("Get assigned examinations error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch assigned examinations."
        });
    }
};

export const createSlot = async (req, res) => {
    try {
        const {
            examination,
            startTime,
            endTime,
            capacity = 1
        } = req.body;

        if (!examination || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Examination, start time, and end time are required."
            });
        }

        if (!mongoose.isValidObjectId(examination)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination ID."
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            start >= end
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide valid slot times; end time must be after start time."
            });
        }

        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be an integer between 1 and 100."
            });
        }

        const exam = await Examination.findById(examination);

        if (!exam || exam.status !== "published") {
            return res.status(404).json({
                success: false,
                message: "Published examination not found."
            });
        }

        const isAssigned = exam.examiners.some(
            (examinerId) => examinerId.toString() === req.user._id.toString()
        );

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this examination."
            });
        }

        if (
            start < exam.examinationStart ||
            end > exam.examinationEnd
        ) {
            return res.status(400).json({
                success: false,
                message: "Slot must fall within the examination schedule."
            });
        }

        if (end.getTime() - start.getTime() !== exam.durationMinutes * 60 * 1000) {
            return res.status(400).json({
                success: false,
                message: `Slot duration must be exactly ${exam.durationMinutes} minutes.`
            });
        }

        const overlappingSlot = await ExamSlot.findOne({
            examiner: req.user._id,
            isActive: true,
            startTime: { $lt: end },
            endTime: { $gt: start }
        });

        if (overlappingSlot) {
            return res.status(409).json({
                success: false,
                message: "You already have a slot that overlaps this time."
            });
        }

        const slot = await ExamSlot.create({
            examination: exam._id,
            examiner: req.user._id,
            startTime: start,
            endTime: end,
            capacity,
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: "Examination slot created successfully.",
            data: slot
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This slot already exists."
            });
        }

        console.error("Create slot error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create examination slot."
        });
    }
};

export const getMySlots = async (req, res) => {
    try {
        const slots = await ExamSlot.find({
            examiner: req.user._id
        })
            .populate({
                path: "examination",
                select: "title examinationType examinationStart examinationEnd status",
                populate: {
                    path: "course",
                    select: "courseCode title"
                }
            })
            .sort({ startTime: 1 });

        return res.status(200).json({
            success: true,
            count: slots.length,
            data: slots
        });
    } catch (error) {
        console.error("Get slots error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your slots."
        });
    }
};