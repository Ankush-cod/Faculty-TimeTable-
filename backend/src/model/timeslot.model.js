import mongoose from "mongoose";
const timeSlotSchema = new mongoose.Schema({
    timetableId: { type: mongoose.Schema.Types.ObjectId, ref: "Timetable", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    classroom: { type: String, required: true }, 
    subject: { type: String, required: true },
    day: { 
        type: String, 
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
        required: true 
    },
    startSlot: { type: Number, required: true }, 
    endSlot: { type: Number, required: true }, 
    duration: { type: Number, default: 1 }, 
    capacity: { type: Number }, 
    notes: { type: String },
    isConfirmed: { type: Boolean, default: false },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    confirmedAt: { type: Date }
}, { timestamps: true });
timeSlotSchema.index({ timetableId: 1, facultyId: 1 });
timeSlotSchema.index({ timetableId: 1, day: 1, startSlot: 1 });
export const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);
