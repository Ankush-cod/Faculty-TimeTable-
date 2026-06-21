import { Router } from "express";
import { createSubject, getAllSubjects, updateSubject, deleteSubject } from "../controllers/subject.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllSubjects);

// Admin only routes
router.use(verifyJwt);
router.route("/").post(createSubject);
router.route("/:id").patch(updateSubject).delete(deleteSubject);

export default router;
