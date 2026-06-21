import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    room: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const Class = mongoose.model("Class", classSchema);
