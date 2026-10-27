import Course from "../models/Course.js";

export const createCourse = async (req, res) => {
    try {
        const {
            courseCode,
            title,
            description,
            department,
            credits,
            semester,
        } = req.body;

        if (
            !courseCode?.trim() ||
            !title?.trim() ||
            !department?.trim() ||
            credits === undefined ||
            semester === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Course code, title, department, credits, and semester are required.",
            });
        }

        const normalizedCode = courseCode.trim().toUpperCase();

        const existingCourse = await Course.findOne({
            courseCode: normalizedCode,
        });

        if (existingCourse) {
            return res.status(409).json({
                success: false,
                message: "A course with this code already exists.",
            });
        }

        const course = await Course.create({
            courseCode: normalizedCode,
            title: title.trim(),
            description: description?.trim() || "",
            department: department.trim(),
            credits,
            semester,
            createdBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Course created successfully.",
            course,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A course with this code already exists.",
            });
        }

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create course error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create course.",
        });
    }
};

export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate("createdBy", "fullName email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: courses.length,
            courses,
        });
    } catch (error) {
        console.error("Get courses error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch courses.",
        });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const allowedFields = [
            "title",
            "description",
            "department",
            "credits",
            "semester",
            "isActive",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        for (const field of ["title", "department", "description"]) {
            if (typeof updates[field] === "string") {
                updates[field] = updates[field].trim();
            }
        }

        if (
            ("title" in updates && !updates.title) ||
            ("department" in updates && !updates.department)
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and department cannot be empty.",
            });
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course updated successfully.",
            course,
        });
    } catch (error) {
        if (error.name === "CastError" || error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Update course error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update course.",
        });
    }
};

export const deactivateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive: false } },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course deactivated successfully.",
            course,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID.",
            });
        }

        console.error("Deactivate course error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to deactivate course.",
        });
    }
};

export const reactivateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive: true } },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course reactivated successfully.",
            course,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID.",
            });
        }

        console.error("Reactivate course error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reactivate course.",
        });
    }
};