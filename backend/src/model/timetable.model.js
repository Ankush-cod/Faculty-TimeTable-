import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    name: { type: String, required: true },
    semester: { type: String, required: true }, 
    academicYear: { type: String, required: true }, 
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    status: { 
        type: String, 
        enum: ["draft", "published", "active", "archived"], 
        default: "draft" 
    },
    isAdminApproved: { type: Boolean, default: false },
    totalSlots: { type: Number, default: 0 },
    filledSlots: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String },
    allocationRound: { type: Number, default: 0 },
    allocationLogs: [{ 
        round: Number, 
        timestamp: { type: Date, default: Date.now },
        summary: String,
        details: [{ facultyName: String, subject: String, status: String }]
    }]
}, { timestamps: true });

export const Timetable = mongoose.model("Timetable", timetableSchema);
