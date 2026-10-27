import mongoose from "mongoose";
import Evaluation from "../models/Evaluation.js";

// Admin: view evaluations awaiting publication
export const getPendingResults = async (req, res) => {
    try {
        const evaluations = await Evaluation.find({
            status: "submitted"
        })
            .populate("student", "fullName email department")
            .populate("examiner", "fullName email")
            .populate("examination", "title examinationType")
            .sort({ evaluatedAt: 1 });

        return res.status(200).json({
            success: true,
            count: evaluations.length,
            data: evaluations
        });
    } catch (error) {
        console.error("Get pending results error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending results."
        });
    }
};

// Admin: publish a submitted evaluation
export const publishResult = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid evaluation ID."
            });
        }

        const evaluation = await Evaluation.findById(id);

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Evaluation not found."
            });
        }

        if (evaluation.status === "published") {
            return res.status(409).json({
                success: false,
                message: "This result has already been published."
            });
        }

        if (evaluation.status !== "submitted") {
            return res.status(400).json({
                success: false,
                message: "Only submitted evaluations can be published."
            });
        }

        evaluation.status = "published";
        evaluation.publishedAt = new Date();

        await evaluation.save();

        return res.status(200).json({
            success: true,
            message: "Result published successfully.",
            data: evaluation
        });
    } catch (error) {
        console.error("Publish result error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to publish result."
        });
    }
};

// Student: view only their published results
export const getMyResults = async (req, res) => {
    try {
        const results = await Evaluation.find({
            student: req.user._id,
            status: "published"
        })
            .populate("examination", "title examinationType examinationStart")
            .populate("examiner", "fullName")
            .sort({ publishedAt: -1 });

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error("Get student results error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch results."
        });
    }
};