import mongoose from "mongoose";

const examinationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Examination title is required"],
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 2000,
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        examinationType: {
            type: String,
            enum: ["viva", "practical", "project", "theory"],
            required: true,
        },

        examiners: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        bookingStart: {
            type: Date,
            required: true,
        },

        bookingEnd: {
            type: Date,
            required: true,
        },

        examinationStart: {
            type: Date,
            required: true,
        },

        examinationEnd: {
            type: Date,
            required: true,
        },

        durationMinutes: {
            type: Number,
            required: true,
            min: 5,
            max: 480,
        },

        status: {
            type: String,
            enum: ["draft", "published", "completed", "cancelled"],
            default: "draft",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Examination = mongoose.model(
    "Examination",
    examinationSchema
);

export default Examination;