import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { Subject } from "../model/subject.model.js";

// GET /subjects?branch=CSE&semester=3&approved=true
const getAllSubjects = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.semester) {
        const sem = parseInt(req.query.semester, 10);
        if (isNaN(sem) || sem < 1 || sem > 8) {
            throw new ApiError(400, "Semester must be a number between 1 and 8");
        }
        filter.semester = sem;
    }
    if (req.query.approved === "true") filter.isApproved = true;
    if (req.query.approved === "false") filter.isApproved = false;
    
    const subjects = await Subject.find(filter).sort({ branch: 1, semester: 1, name: 1 });
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
});

const createSubject = asyncHandler(async (req, res) => {
    const { name, code, semester, branch, isLab, lecturesPerWeek } = req.body;
    if (!name || !code || !semester || !branch) {
        throw new ApiError(400, "Name, code, semester, and branch are required");
    }
    const semNum = parseInt(semester, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
        throw new ApiError(400, "Semester must be a valid number between 1 and 8");
    }
    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) throw new ApiError(409, "Subject with this code already exists");
    
    const subject = await Subject.create({
        name,
        code,
        semester: semNum,
        branch,
        isLab: isLab || false,
        lecturesPerWeek: lecturesPerWeek || (isLab ? 2 : 3),
        isApproved: false
    });
    res.status(201).json({ success: true, message: "Subject created (pending approval)", data: subject });
});

const updateSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, code, semester, branch, isLab, lecturesPerWeek } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (semester !== undefined) {
        const semNum = parseInt(semester, 10);
        if (isNaN(semNum) || semNum < 1 || semNum > 8) {
            throw new ApiError(400, "Semester must be a valid number between 1 and 8");
        }
        updateData.semester = semNum;
    }
    if (branch) updateData.branch = branch;
    if (typeof isLab === "boolean") updateData.isLab = isLab;
    if (lecturesPerWeek !== undefined) updateData.lecturesPerWeek = parseInt(lecturesPerWeek, 10) || 3;
    
    const subject = await Subject.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!subject) throw new ApiError(404, "Subject not found");
    res.status(200).json({ success: true, message: "Subject updated", data: subject });
});

const deleteSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) throw new ApiError(404, "Subject not found");
    res.status(200).json({ success: true, message: "Subject deleted" });
});

export { createSubject, getAllSubjects, updateSubject, deleteSubject };
