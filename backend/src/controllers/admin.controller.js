import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { Faculty } from "../model/faculty.model.js";
import { Admin } from "../model/admin.model.js";
import { Subject } from "../model/subject.model.js";
import bcrypt from "bcrypt";
import xlsx from "xlsx";

// ── Register Admin ──
const registerAdmin = asyncHandler(async (req, res) => {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
        throw new ApiError(400, "Email, password, and fullName are required");
    }
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        throw new ApiError(409, "Admin with this email already exists");
    }
    const admin = await Admin.create({ email, password, fullName, role: "Admin" });
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    await admin.save();
    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshToken");
    res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        data: { user: createdAdmin, accessToken, refreshToken }
    });
});

// ── Dashboard Stats ──
const getDashboard = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can access dashboard");
    const pendingCount = await Faculty.countDocuments({ status: "pending" });
    const approvedCount = await Faculty.countDocuments({ status: "approved" });
    const rejectedCount = await Faculty.countDocuments({ status: "rejected" });
    res.status(200).json({
        success: true,
        data: {
            totalFaculty: approvedCount,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount
        }
    });
});

// ── Pending Requests (separate section) ──
const getPendingRequests = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can view pending requests");
    const pendingFaculty = await Faculty.find({ status: "pending" })
        .select("-password -refreshToken")
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: pendingFaculty.length, data: pendingFaculty });
});

// ── Approved Faculty Only (Faculty List section) ──
const getAllFaculty = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can view all faculty");
    const { status } = req.query;
    const filter = {};
    if (status) {
        filter.status = status;
    } else {
        // Default: show only approved faculty in the Faculty List
        filter.status = "approved";
    }
    const faculty = await Faculty.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: faculty.length, data: faculty });
});

// ── Approve Faculty ──
const approveFaculty = asyncHandler(async (req, res) => {
    const { facultyId } = req.body;
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can approve faculty");
    if (!facultyId) throw new ApiError(400, "Faculty ID is required");
    const faculty = await Faculty.findByIdAndUpdate(
        facultyId,
        { status: "approved", isApproved: true, adminRemarks: "" },
        { new: true }
    ).select("-password -refreshToken");
    if (!faculty) throw new ApiError(404, "Faculty not found");
    res.status(200).json({ success: true, message: "Faculty approved successfully", data: faculty });
});

// ── Reject Faculty ──
const rejectFaculty = asyncHandler(async (req, res) => {
    const { facultyId, remarks } = req.body;
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can reject faculty");
    if (!facultyId) throw new ApiError(400, "Faculty ID is required");
    const faculty = await Faculty.findByIdAndUpdate(
        facultyId,
        { status: "rejected", isApproved: false, adminRemarks: remarks || "" },
        { new: true }
    ).select("-password -refreshToken");
    if (!faculty) throw new ApiError(404, "Faculty not found");
    res.status(200).json({ success: true, message: "Faculty rejected successfully", data: faculty });
});

// ── Edit Faculty Data ──
const editFacultyData = asyncHandler(async (req, res) => {
    const { facultyId } = req.params;
    const { branch, maxLecturesPerWeek, preferences, experience, designation } = req.body;
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can edit faculty data");
    if (!facultyId) throw new ApiError(400, "Faculty ID is required");
    const updateData = {};
    if (branch) updateData.branch = branch;
    if (maxLecturesPerWeek) updateData.maxLecturesPerWeek = parseInt(maxLecturesPerWeek, 10) || 15;
    if (preferences) updateData.preferences = preferences;
    if (experience !== undefined) updateData.experience = parseInt(experience, 10) || 0;
    if (designation) updateData.designation = designation;
    const faculty = await Faculty.findByIdAndUpdate(facultyId, updateData, { new: true })
        .select("-password -refreshToken");
    if (!faculty) throw new ApiError(404, "Faculty not found");
    res.status(200).json({ success: true, message: "Faculty data updated successfully", data: faculty });
});

// ── Get Faculty Details ──
const getFacultyDetails = asyncHandler(async (req, res) => {
    const { facultyId } = req.params;
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can view faculty details");
    const faculty = await Faculty.findById(facultyId).select("-password -refreshToken");
    if (!faculty) throw new ApiError(404, "Faculty not found");
    res.status(200).json({ success: true, data: faculty });
});

// ── Delete Faculty ──
const deleteFaculty = asyncHandler(async (req, res) => {
    const { facultyId } = req.params;
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can delete faculty");
    const faculty = await Faculty.findByIdAndDelete(facultyId);
    if (!faculty) throw new ApiError(404, "Faculty not found");
    res.status(200).json({ success: true, message: "Faculty deleted successfully" });
});

// ── Upload Subjects Excel (with branch selection) ──
const uploadSubjectsExcel = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can upload subjects");
    if (!req.file) throw new ApiError(400, "Please upload an Excel or CSV file");
    
    const branch = req.body.branch;
    if (!branch) throw new ApiError(400, "Branch selection is required for upload");

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) throw new ApiError(400, "The uploaded file is empty");

    const subjectsToInsert = data.map(item => {
        const rawSemester = item["Semester"] || item["semester"];
        const semesterNum = parseInt(rawSemester, 10);
        
        // Determine if it's a lab
        const rawIsLab = item["Is Lab"] || item["isLab"] || item["IsLab"] || "";
        const isLab = rawIsLab === true || rawIsLab === "true" || rawIsLab === "yes" || rawIsLab === "Yes" || rawIsLab === 1;
        
        const rawLectures = item["Lectures Per Week"] || item["lecturesPerWeek"] || "";
        const lecturesPerWeek = parseInt(rawLectures, 10) || (isLab ? 2 : 3);

        return {
            name: item["Subject Name"] || item["name"] || item["Name"],
            code: (item["Subject Code"] || item["code"] || item["Code"])?.toString().toUpperCase(),
            semester: isNaN(semesterNum) ? null : semesterNum,
            branch: branch,
            isLab: isLab,
            lecturesPerWeek: lecturesPerWeek,
            isApproved: false
        };
    }).filter(s => s.name && s.code && s.semester !== null && s.semester >= 1 && s.semester <= 8);

    if (subjectsToInsert.length === 0) {
        throw new ApiError(400, "No valid subject data found. Required columns: Subject Name, Subject Code, Semester (1-8). Check that semester values are valid numbers.");
    }

    let insertedCount = 0;
    let skippedCount = 0;
    for (const sub of subjectsToInsert) {
        try {
            await Subject.create(sub);
            insertedCount++;
        } catch (err) {
            skippedCount++; // duplicate code or validation error
        }
    }

    res.status(200).json({
        success: true,
        message: `Uploaded ${insertedCount} subjects (${skippedCount} skipped as duplicates). Subjects are pending approval.`,
        count: insertedCount
    });
});

// ── Toggle Subject Approval ──
const toggleSubjectApproval = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can manage subject approval");
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId);
    if (!subject) throw new ApiError(404, "Subject not found");
    subject.isApproved = !subject.isApproved;
    await subject.save();
    res.status(200).json({
        success: true,
        message: `Subject ${subject.isApproved ? "approved" : "unapproved"} successfully`,
        data: subject
    });
});

// ── Admin Logout ──
const logoutAdmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(req.user._id, { refreshToken: "" }, { new: true });
    res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({
        success: true,
        message: "Admin logout successful"
    });
});

// ── Admin Profile ──
const getAdminProfile = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can access this endpoint");
    const admin = await Admin.findById(req.user._id).select("-password -refreshToken");
    if (!admin) throw new ApiError(404, "Admin not found");
    res.status(200).json({ success: true, data: admin });
});

// ── Admin Change Password ──
const changeAdminPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) throw new ApiError(400, "All fields are required");
    if (newPassword !== confirmPassword) throw new ApiError(400, "Passwords do not match");
    if (newPassword.length < 6) throw new ApiError(400, "New password must be at least 6 characters long");
    const admin = await Admin.findById(req.user._id);
    if (!admin) throw new ApiError(404, "Admin not found");
    const isPasswordValid = await admin.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) throw new ApiError(401, "Old password is incorrect");
    admin.password = newPassword;
    await admin.save();
    res.status(200).json({ success: true, message: "Password changed successfully" });
});

export {
    registerAdmin,
    logoutAdmin,
    getAdminProfile,
    changeAdminPassword,
    getPendingRequests,
    getDashboard,
    approveFaculty,
    rejectFaculty,
    editFacultyData,
    getFacultyDetails,
    deleteFaculty,
    getAllFaculty,
    uploadSubjectsExcel,
    toggleSubjectApproval
};
