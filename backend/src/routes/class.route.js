import express from "express";
import { uploadClassesExcel, getAllClasses } from "../controllers/class.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadClassesExcel);
router.get("/", getAllClasses);

export default router;
