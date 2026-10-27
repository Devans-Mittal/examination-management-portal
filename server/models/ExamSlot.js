import mongoose from "mongoose";

const examSlotSchema = new mongoose.Schema(
    {
        examination: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Examination",
            required: true,
            index: true
        },

        examiner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        startTime: {
            type: Date,
            required: true
        },

        endTime: {
            type: Date,
            required: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },

        isActive: {
            type: Boolean,
            default: true
        },
        bookedStudents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    { timestamps: true }
);

examSlotSchema.index(
    { examination: 1, examiner: 1, startTime: 1, endTime: 1 },
    { unique: true }
);

export default mongoose.model("ExamSlot", examSlotSchema);