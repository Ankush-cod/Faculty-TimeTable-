import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    branch: {
        type: String,
        required: true,
        enum: ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Other']
    },
    isLab: {
        type: Boolean,
        default: false
    },
    lecturesPerWeek: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
    },
    isApproved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Subject = mongoose.model("Subject", subjectSchema);
