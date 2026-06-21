import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { Faculty } from "../model/faculty.model.js";
import { Admin } from "../model/admin.model.js";
import jwt from "jsonwebtoken";

// ── Registration ──
// Faculty data is saved but NO tokens are issued. Faculty must wait for admin approval.
const registerUser = asyncHandler(async (req, res) => {
    const { email, password, fullName, name, branch, designation, experience } = req.body;
    const userName = fullName || name;
    if (!email || !password || !userName || !branch) {
        throw new ApiError(400, "Email, password, full name, and branch are required");
    }
    const existingUser = await Faculty.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }
    let imageUrl = "";
    if (req.file) {
        imageUrl = req.file.path; 
    }
    await Faculty.create({
        email,
        password,
        fullName: userName,
        designation: designation || "Assistant Professor",
        experience: experience ? parseInt(experience) : 0,
        branch,
        image: imageUrl
    });

    res.status(201).json({
        success: true,
        message: "Registration submitted successfully! Please wait for admin approval before logging in."
    });
});

// ── Login ──
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    let user = await Admin.findOne({ email });
    let role = "Admin";
    if (!user) {
        user = await Faculty.findOne({ email });
        role = "Faculty";
    }
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    if (role === "Faculty" && !user.isApproved) {
        throw new ApiError(403, `Your account is ${user.status}. Please wait for admin approval.`);
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    const loggedInUser = await (role === "Admin" ? Admin : Faculty)
        .findById(user._id)
        .select("-password -refreshToken");
    
    const userWithRole = {
        ...loggedInUser.toObject(),
        role: role
    };
    
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            user: userWithRole,
            accessToken: accessToken,
            refreshToken
        }
    });
});

// ── Image Upload ──
const updateUserImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Image file is required");
    }
    const imageUrl = req.file.path;
    let user;
    if (req.role === "Admin") {
        user = await Admin.findByIdAndUpdate(
            req.user._id,
            { image: imageUrl },
            { new: true }
        ).select("-password -refreshToken");
    } else {
        user = await Faculty.findByIdAndUpdate(
            req.user._id,
            { image: imageUrl },
            { new: true }
        ).select("-password -refreshToken");
    }
    res.status(200).json({
        success: true,
        message: "Image updated successfully",
        data: user
    });
});

// ── Faculty Preferences (includes preferredSubjects) ──
const updateFacultyPreferences = asyncHandler(async (req, res) => {
    const { preferences } = req.body;
    if (req.role !== "Faculty") {
        throw new ApiError(403, "Only faculty can update preferences");
    }
    if (!preferences) {
        throw new ApiError(400, "Preferences data is required");
    }
    const {
        availableDays,
        preferredTimeSlots,
        maxLecturesPerWeek,
        consecutiveLecturesPreference,
        preferredTimePeriod,
        lunchBreakPreference,
        roomTypePreferences,
        floorPreference,
        specialRequirements,
        constraints,
        preferredSubjects,
        lastUpdated
    } = preferences;
    if (!availableDays || !Array.isArray(availableDays) || availableDays.length === 0) {
        throw new ApiError(400, "At least one available day must be selected");
    }
    if (!preferredTimeSlots || !Array.isArray(preferredTimeSlots) || preferredTimeSlots.length === 0) {
        throw new ApiError(400, "At least one preferred time slot must be selected");
    }
    if (maxLecturesPerWeek && (maxLecturesPerWeek < 5 || maxLecturesPerWeek > 25)) {
        throw new ApiError(400, "Max lectures per week must be between 5 and 25");
    }
    const updateData = {
        preferences: {
            availableDays,
            preferredTimeSlots,
            maxLecturesPerWeek: maxLecturesPerWeek || 15,
            consecutiveLecturesPreference: consecutiveLecturesPreference || "no-preference",
            preferredTimePeriod: preferredTimePeriod || "both",
            lunchBreakPreference: lunchBreakPreference || "12-1",
            roomTypePreferences: roomTypePreferences || [],
            floorPreference: floorPreference || "any-floor",
            specialRequirements: specialRequirements || "",
            constraints: constraints || "",
            preferredSubjects: preferredSubjects || [],
            lastUpdated: lastUpdated || new Date().toISOString()
        }
    };
    const faculty = await Faculty.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
    ).select("-password -refreshToken");
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }
    res.status(200).json({
        success: true,
        message: "Preferences updated successfully",
        data: {
            _id: faculty._id,
            email: faculty.email,
            fullName: faculty.fullName,
            preferences: faculty.preferences,
            updatedAt: new Date().toISOString()
        }
    });
});

// ── Allocation Choice (Freeze / Upgrade / Withdraw) ──
const setAllocationChoice = asyncHandler(async (req, res) => {
    if (req.role !== "Faculty") {
        throw new ApiError(403, "Only faculty can set allocation choice");
    }
    const { choice } = req.body;
    const validChoices = ["frozen", "upgraded", "withdrawn"];
    if (!choice || !validChoices.includes(choice)) {
        throw new ApiError(400, `Choice must be one of: ${validChoices.join(", ")}`);
    }
    const faculty = await Faculty.findById(req.user._id);
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }
    if (faculty.allocationStatus === "unallocated") {
        throw new ApiError(400, "You have not been allocated any subjects yet");
    }
    if (faculty.allocationStatus === "frozen" || faculty.allocationStatus === "withdrawn") {
        throw new ApiError(400, `You have already chosen to ${faculty.allocationStatus}. Cannot change.`);
    }
    faculty.allocationStatus = choice;
    await faculty.save();
    res.status(200).json({
        success: true,
        message: `Allocation choice set to "${choice}" successfully`,
        data: { allocationStatus: faculty.allocationStatus }
    });
});

// ── Logout ──
const logoutUser = asyncHandler(async (req, res) => {
    if (req.role === "Faculty") {
        await Faculty.findByIdAndUpdate(
            req.user._id,
            { refreshToken: "" },
            { new: true }
        );
    } else if (req.role === "Admin") {
        await Admin.findByIdAndUpdate(
            req.user._id,
            { refreshToken: "" },
            { new: true }
        );
    }
    res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(200)
        .json({
            success: true,
            message: "Logout successful"
        });
});

// ── Refresh Token ──
const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
        throw new ApiError(401, "Refresh token is required");
    }
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        let user = await Admin.findById(decoded._id);
        let role = "admin";
        if (!user) {
            user = await Faculty.findById(decoded._id);
            role = "faculty";
        }
        if (!user || user.refreshToken !== token) {
            throw new ApiError(401, "Invalid or expired refresh token");
        }
        const newAccessToken = user.generateAccessToken();
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken: newAccessToken,
                role
            }
        });
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// ── Profile ──
const getProfile = asyncHandler(async (req, res) => {
    if (req.role !== "Faculty") {
        throw new ApiError(403, "Only faculty can access this endpoint");
    }
    const faculty = await Faculty.findById(req.user._id).select("-password -refreshToken");
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }
    res.status(200).json({
        success: true,
        data: faculty
    });
});

// ── Change Password ──
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required");
    }
    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
    }
    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters long");
    }
    let user;
    if (req.role === "Faculty") {
        user = await Faculty.findById(req.user._id);
    } else if (req.role === "Admin") {
        user = await Admin.findById(req.user._id);
    }
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(401, "Old password is incorrect");
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: "Password changed successfully"
    });
});

// ── Forgot Password ──
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    let user = await Admin.findOne({ email });
    if (!user) {
        user = await Faculty.findOne({ email });
    }
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const resetToken = jwt.sign(
        { _id: user._id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );
    res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
        data: {
            email: user.email,
            resetToken
        }
    });
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    getProfile,
    changePassword,
    updateUserImage,
    updateFacultyPreferences,
    setAllocationChoice,
    forgotPassword
};