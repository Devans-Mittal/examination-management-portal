import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        slot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExamSlot",
            required: true,
            index: true
        },

        examination: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Examination",
            required: true
        },

        status: {
            type: String,
            enum: ["booked", "cancelled", "completed"],
            default: "booked"
        },

        bookedAt: {
            type: Date,
            default: Date.now
        },

        cancelledAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Prevent a student from having duplicate booking records
// for the same slot, even if an earlier booking was cancelled.
bookingSchema.index(
    { student: 1, slot: 1 },
    { unique: true }
);

export default mongoose.model("Booking", bookingSchema);