import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        courseCode: {
            type: String,
            required: [true, "Course code is required"],
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: 20,
        },

        title: {
            type: String,
            required: [true, "Course title is required"],
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },

        department: {
            type: String,
            required: [true, "Department is required"],
            trim: true,
            maxlength: 100,
        },

        credits: {
            type: Number,
            required: true,
            min: 1,
            max: 30,
        },

        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;