import express from "express";
import {
    createTimetable, getTimetables, getTimetableById, updateTimetable, deleteTimetable,
    addTimeSlot, getTimeSlots, updateTimeSlot, deleteTimeSlot,
    getFacultyTimetable, generateTimetableAuto, approveTimetable, runAllocationRound,
    autoGenerateByBranchSemester, generateAllClassesTimetable, getClassTimetable
} from "../controllers/timetable.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJwt, createTimetable);
router.get("/", verifyJwt, getTimetables);
router.post("/generate-all", verifyJwt, generateAllClassesTimetable);
router.get("/class/:classId", verifyJwt, getClassTimetable);
router.get("/faculty/my-timetable", verifyJwt, getFacultyTimetable);
router.get("/:timetableId", verifyJwt, getTimetableById);
router.put("/:timetableId", verifyJwt, updateTimetable);
router.delete("/:timetableId", verifyJwt, deleteTimetable);
router.post("/:timetableId/generate", verifyJwt, generateTimetableAuto);
router.post("/:timetableId/auto-generate", verifyJwt, autoGenerateByBranchSemester);
router.put("/:timetableId/approve", verifyJwt, approveTimetable);
router.post("/:timetableId/run-round", verifyJwt, runAllocationRound);
router.post("/:timetableId/time-slots", verifyJwt, addTimeSlot);
router.get("/:timetableId/time-slots", verifyJwt, getTimeSlots);
router.put("/time-slots/:slotId", verifyJwt, updateTimeSlot);
router.delete("/time-slots/:slotId", verifyJwt, deleteTimeSlot);

export default router;
