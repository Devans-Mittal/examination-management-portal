import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
    {
        examination: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Examination",
            required: true,
            index: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        examiner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        marksObtained: {
            type: Number,
            required: true,
            min: 0
        },

        maxMarks: {
            type: Number,
            required: true,
            min: 1,
            default: 100
        },

        feedback: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        status: {
            type: String,
            enum: ["submitted", "published"],
            default: "submitted"
        },

        evaluatedAt: {
            type: Date,
            default: Date.now
        },

        publishedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// One evaluation per student for each examination.
evaluationSchema.index(
    { examination: 1, student: 1 },
    { unique: true }
);

export default mongoose.model("Evaluation", evaluationSchema);