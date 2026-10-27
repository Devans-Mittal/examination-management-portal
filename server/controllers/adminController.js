import User from "../models/User.js";

// GET ALL PENDING EXAMINERS
export const getPendingExaminers = async (req, res) => {
    try {
        const examiners = await User.find({
            role: "examiner",
            approvalStatus: "pending",
        })
            .select("fullName email department createdAt")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: examiners.length,
            examiners,
        });
    } catch (error) {
        console.error("Fetch pending examiners:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch pending examiners.",
        });
    }
};

// APPROVE EXAMINER
export const approveExaminer = async (req, res) => {
    try {
        const examiner = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: "examiner",
                approvalStatus: "pending",
            },
            {
                $set: { approvalStatus: "approved" },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("fullName email department approvalStatus");

        if (!examiner) {
            return res.status(404).json({
                success: false,
                message: "Pending examiner not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Examiner approved successfully.",
            examiner,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid examiner ID.",
            });
        }

        console.error("Approve examiner:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to approve examiner.",
        });
    }
};

// REJECT EXAMINER
export const rejectExaminer = async (req, res) => {
    try {
        const examiner = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: "examiner",
                approvalStatus: "pending",
            },
            {
                $set: { approvalStatus: "rejected" },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("fullName email department approvalStatus");

        if (!examiner) {
            return res.status(404).json({
                success: false,
                message: "Pending examiner not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Examiner registration rejected.",
            examiner,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid examiner ID.",
            });
        }

        console.error("Reject examiner:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to reject examiner.",
        });
    }
};

// GET ALL APPROVED AND ACTIVE EXAMINERS
export const getApprovedExaminers = async (req, res) => {
    try {
        const examiners = await User.find({
            role: "examiner",
            approvalStatus: "approved",
            isActive: true,
        })
            .select("fullName email department")
            .sort({ fullName: 1 });

        return res.status(200).json({
            success: true,
            count: examiners.length,
            examiners,
        });
    } catch (error) {
        console.error("Fetch approved examiners:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch approved examiners.",
        });
    }
};