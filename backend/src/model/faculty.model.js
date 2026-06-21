import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const facultySchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    designation: { 
        type: String, 
        enum: ["Professor", "Assistant Professor", "Associate Professor"],
        default: "Assistant Professor" 
    },
    experience: { type: Number, default: 0, min: 0 },
    image: { type: String }, 
    role: { type: String, enum: ["Faculty"], default: "Faculty" },
    refreshToken: { type: String },
    branch: { 
        type: String, 
        required: true,
        enum: ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Other']
    },
    preferences: {
        availableDays: {
            type: [String],
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        },
        preferredTimeSlots: {
            type: [String],
            default: ["9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "2:00 - 3:00", "3:00 - 4:00"]
        },
        maxLecturesPerWeek: {
            type: Number,
            min: 5,
            max: 25,
            default: 15
        },
        consecutiveLecturesPreference: {
            type: String,
            enum: ["prefer-consecutive", "no-preference", "prefer-breaks"],
            default: "no-preference"
        },
        preferredTimePeriod: {
            type: String,
            enum: ["morning", "afternoon", "both"],
            default: "both"
        },
        lunchBreakPreference: {
            type: String,
            enum: ["before-12", "12-1", "1-2"],
            default: "12-1"
        },
        roomTypePreferences: {
            type: [String],
            default: ["Lecture Hall (50+)", "Classroom (20-50)", "Lab", "Seminar Room (10-20)"]
        },
        floorPreference: {
            type: String,
            enum: ["ground-floor", "1st-floor", "2nd-floor", "any-floor"],
            default: "any-floor"
        },
        specialRequirements: {
            type: String,
            default: ""
        },
        constraints: {
            type: String,
            default: ""
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        preferredSubjects: [
            {
                subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
                subjectName: { type: String },
                priority: { type: Number, min: 1, max: 5 }
            }
        ]
    },
    maxLecturesPerWeek: { type: Number, default: 10 },
    status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending" 
    },
    adminRemarks: { type: String },
    isApproved: { type: Boolean, default: false },
    allocationStatus: {
        type: String,
        enum: ["unallocated", "allocated", "frozen", "upgraded", "withdrawn"],
        default: "unallocated"
    }
}, { timestamps: true });

facultySchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

facultySchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

facultySchema.methods.generateAccessToken = function () {
    return jwt.sign({ _id: this._id, email: this.email, fullName: this.fullName, role: this.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
};

facultySchema.methods.generateRefreshToken = function () {
    return jwt.sign({ _id: this._id, role: this.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
};

export const Faculty = mongoose.model("Faculty", facultySchema);