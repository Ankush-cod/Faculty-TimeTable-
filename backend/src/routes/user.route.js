import express from "express";
import {
    registerUser, loginUser, logoutUser, refreshToken,
    getProfile, changePassword, updateUserImage,
    updateFacultyPreferences, setAllocationChoice, forgotPassword
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import multer from "multer";

const upload = multer({ dest: "public/temps/" });
const router = express.Router();

router.post("/register", upload.single("image"), registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/logout", verifyJwt, logoutUser);
router.get("/profile", verifyJwt, getProfile);
router.put("/change-password", verifyJwt, changePassword);
router.put("/update-image", verifyJwt, upload.single("image"), updateUserImage);
router.put("/faculty/preferences", verifyJwt, updateFacultyPreferences);
router.put("/faculty/allocation-choice", verifyJwt, setAllocationChoice);

export default router;