import express from "express";
import {
    registerAdmin, logoutAdmin, getAdminProfile, changeAdminPassword,
    getPendingRequests, getDashboard, approveFaculty, rejectFaculty,
    editFacultyData, getFacultyDetails, deleteFaculty, getAllFaculty,
    uploadSubjectsExcel, toggleSubjectApproval
} from "../controllers/admin.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/logout", verifyJwt, logoutAdmin);
router.get("/profile", verifyJwt, getAdminProfile);
router.put("/change-password", verifyJwt, changeAdminPassword);
router.get("/dashboard", verifyJwt, getDashboard);
router.get("/pending-requests", verifyJwt, getPendingRequests);
router.get("/all-faculty", verifyJwt, getAllFaculty);
router.get("/faculty/:facultyId", verifyJwt, getFacultyDetails);
router.put("/approve-faculty", verifyJwt, approveFaculty);
router.put("/reject-faculty", verifyJwt, rejectFaculty);
router.put("/edit-faculty/:facultyId", verifyJwt, editFacultyData);
router.delete("/delete-faculty/:facultyId", verifyJwt, deleteFaculty);
router.post("/subjects/upload", verifyJwt, upload.single("file"), uploadSubjectsExcel);
router.put("/subjects/:subjectId/toggle-approval", verifyJwt, toggleSubjectApproval);

export default router;
