import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { Timetable } from "../model/timetable.model.js";
import { TimeSlot } from "../model/timeslot.model.js";
import { Faculty } from "../model/faculty.model.js";
import { Subject } from "../model/subject.model.js";
import { Class } from "../model/class.model.js";

// ── Create Timetable ──
const createTimetable = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can create timetables");
    const semNum = parseInt(semester, 10);
    if (isNaN(semNum)) {
        throw new ApiError(400, "Semester must be a valid number");
    }
    const timetable = await Timetable.create({
        name, 
        semester: semNum.toString(), // Timetable model expects string for semester but we validate it's a number
        academicYear, 
        description, 
        startDate, 
        endDate, 
        notes,
        createdBy: req.user._id, 
        status: "draft"
    });
    res.status(201).json({ success: true, message: "Timetable created successfully", data: timetable });
});

// ── Get All Timetables ──
const getTimetables = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can view timetables");
    const { status, semester } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (semester) filter.semester = semester;
    const timetables = await Timetable.find(filter)
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: timetables.length, data: timetables });
});

// ── Get Timetable by ID ──
const getTimetableById = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can view timetable details");
    const { timetableId } = req.params;
    const timetable = await Timetable.findById(timetableId).populate("createdBy", "fullName email");
    if (!timetable) throw new ApiError(404, "Timetable not found");
    const timeSlots = await TimeSlot.find({ timetableId })
        .populate("facultyId", "fullName email designation branch")
        .sort({ day: 1, startSlot: 1 });
    res.status(200).json({
        success: true,
        data: { timetable, timeSlots, totalSlots: timeSlots.length, confirmedSlots: timeSlots.filter(s => s.isConfirmed).length }
    });
});

// ── Update Timetable ──
const updateTimetable = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can update timetables");
    const { timetableId } = req.params;
    const { name, semester, academicYear, description, status, startDate, endDate, notes } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (semester) updateData.semester = semester;
    if (academicYear) updateData.academicYear = academicYear;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (notes) updateData.notes = notes;
    const timetable = await Timetable.findByIdAndUpdate(timetableId, updateData, { new: true });
    if (!timetable) throw new ApiError(404, "Timetable not found");
    res.status(200).json({ success: true, message: "Timetable updated successfully", data: timetable });
});

// ── Delete Timetable ──
const deleteTimetable = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can delete timetables");
    const { timetableId } = req.params;
    await TimeSlot.deleteMany({ timetableId });
    const timetable = await Timetable.findByIdAndDelete(timetableId);
    if (!timetable) throw new ApiError(404, "Timetable not found");
    res.status(200).json({ success: true, message: "Timetable and all associated slots deleted successfully" });
});

// ── Approve Timetable (make visible to faculty) ──
const approveTimetable = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can approve timetables");
    const { timetableId } = req.params;
    const timetable = await Timetable.findByIdAndUpdate(
        timetableId,
        { isAdminApproved: true, status: "published" },
        { new: true }
    );
    if (!timetable) throw new ApiError(404, "Timetable not found");
    res.status(200).json({ success: true, message: "Timetable approved and published to faculty", data: timetable });
});

// ── Add Time Slot ──
const addTimeSlot = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can add time slots");
    const { timetableId, facultyId, classroom, subject, day, startSlot, endSlot, capacity, notes } = req.body;
    if (!timetableId || !facultyId || !classroom || !subject || !day || !startSlot || !endSlot) {
        throw new ApiError(400, "All required fields must be provided");
    }
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) throw new ApiError(404, "Timetable not found");
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) throw new ApiError(404, "Faculty not found");
    if (faculty.status !== "approved") throw new ApiError(400, "Faculty must be approved first");

    const startSlotNum = parseInt(startSlot, 10);
    const endSlotNum = parseInt(endSlot, 10);
    const capacityNum = parseInt(capacity, 10) || 0;

    if (isNaN(startSlotNum) || isNaN(endSlotNum)) {
        throw new ApiError(400, "Slot indices must be valid numbers");
    }

    // Check conflicts
    const conflict = await TimeSlot.findOne({
        timetableId, facultyId, day,
        $or: [
            { startSlot: { $lt: endSlotNum, $gte: startSlotNum } },
            { endSlot: { $gt: startSlotNum, $lte: endSlotNum } }
        ]
    });
    if (conflict) throw new ApiError(400, "Faculty already has a class in this time slot");
    const classroomConflict = await TimeSlot.findOne({
        timetableId, classroom, day,
        $or: [
            { startSlot: { $lt: endSlotNum, $gte: startSlotNum } },
            { endSlot: { $gt: startSlotNum, $lte: endSlotNum } }
        ]
    });
    if (classroomConflict) throw new ApiError(400, "Classroom already booked for this time slot");

    const timeSlot = await TimeSlot.create({
        timetableId, facultyId, classroom, subject, day,
        startSlot: startSlotNum, endSlot: endSlotNum, duration: endSlotNum - startSlotNum, capacity: capacityNum, notes
    });
    await Timetable.findByIdAndUpdate(timetableId, { $inc: { totalSlots: 1 } });
    res.status(201).json({ success: true, message: "Time slot added", data: timeSlot });
});

// ── Get Time Slots ──
const getTimeSlots = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can view time slots");
    const { timetableId } = req.params;
    const { day, facultyId } = req.query;
    const filter = { timetableId };
    if (day) filter.day = day;
    if (facultyId) filter.facultyId = facultyId;
    const timeSlots = await TimeSlot.find(filter)
        .populate("facultyId", "fullName email designation branch")
        .sort({ day: 1, startSlot: 1 });
    res.status(200).json({ success: true, count: timeSlots.length, data: timeSlots });
});

// ── Update Time Slot ──
const updateTimeSlot = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can update time slots");
    const { slotId } = req.params;
    const { classroom, subject, day, startSlot, endSlot, capacity, notes, isConfirmed } = req.body;
    const updateData = {};
    if (classroom) updateData.classroom = classroom;
    if (subject) updateData.subject = subject;
    if (day) updateData.day = day;
    if (startSlot) updateData.startSlot = startSlot;
    if (endSlot) updateData.endSlot = endSlot;
    if (capacity) updateData.capacity = capacity;
    if (notes) updateData.notes = notes;
    if (typeof isConfirmed === "boolean") {
        updateData.isConfirmed = isConfirmed;
        if (isConfirmed) { updateData.confirmedBy = req.user._id; updateData.confirmedAt = new Date(); }
    }
    const updated = await TimeSlot.findByIdAndUpdate(slotId, updateData, { new: true })
        .populate("facultyId", "fullName email");
    if (!updated) throw new ApiError(404, "Time slot not found");
    res.status(200).json({ success: true, message: "Time slot updated", data: updated });
});

// ── Delete Time Slot ──
const deleteTimeSlot = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can delete time slots");
    const { slotId } = req.params;
    const timeSlot = await TimeSlot.findByIdAndDelete(slotId);
    if (!timeSlot) throw new ApiError(404, "Time slot not found");
    await Timetable.findByIdAndUpdate(timeSlot.timetableId, {
        $inc: { totalSlots: -1, filledSlots: timeSlot.isConfirmed ? -1 : 0 }
    });
    res.status(200).json({ success: true, message: "Time slot deleted" });
});

// ── Faculty Timetable (only admin-approved) ──
const getFacultyTimetable = asyncHandler(async (req, res) => {
    if (req.role !== "Faculty") throw new ApiError(403, "Only faculty can view their timetable");
    
    // Only show slots from admin-approved timetables
    const approvedTimetables = await Timetable.find({ isAdminApproved: true }).select("_id");
    const approvedIds = approvedTimetables.map(t => t._id);
    
    const timeSlots = await TimeSlot.find({ 
        facultyId: req.user._id,
        timetableId: { $in: approvedIds }
    })
    .populate("timetableId", "name semester academicYear status")
    .sort({ day: 1, startSlot: 1 });
    
    res.status(200).json({ success: true, count: timeSlots.length, data: timeSlots });
});

// ════════════════════════════════════════════════════════════
//  JoSAA-LIKE PRIORITY-BASED TIMETABLE ALLOCATION ALGORITHM
// ════════════════════════════════════════════════════════════

/**
 * Priority Calculation:
 *   Designation rank: Professor=3, AssocProf=2, AsstProf=1
 *   Score = (designation_rank * 1000) + (experience * 10)
 *   Higher score = higher priority in allocation
 *
 * Algorithm:
 *   1. Sort faculty by priority score (DESC)
 *   2. For each faculty (highest priority first):
 *      a. Get their preferredSubjects sorted by priority (1→5)
 *      b. For each preferred subject (in priority order):
 *         - Find available slots matching faculty preferences
 *         - Check for conflicts
 *         - Allocate if possible
 *      c. Mark faculty as "allocated" or log failure
 *   3. Record allocation log for the round
 */

const DESIGNATION_RANK = {
    "Professor": 3,
    "Associate Professor": 2,
    "Assistant Professor": 1
};

function getFacultyPriorityScore(faculty) {
    const designationScore = (DESIGNATION_RANK[faculty.designation] || 1) * 1000;
    const experienceScore = (faculty.experience || 0) * 10;
    return designationScore + experienceScore;
}

const generateTimetableAuto = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can generate timetables");

    const { timetableId } = req.params;
    const { sections, slotsPerDay = 7, autoMode = false } = req.body;
    const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
        throw new ApiError(400, "Sections configuration is required");
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) throw new ApiError(404, "Timetable not found");

    // Get semester from timetable to auto-select subjects
    const semesterNum = parseInt(timetable.semester);

    // Fetch all approved faculty sorted by JoSAA priority
    const allFaculty = await Faculty.find({ 
        status: "approved",
        allocationStatus: { $nin: ["frozen", "withdrawn"] }
    }).select("-password -refreshToken");

    if (allFaculty.length === 0) {
        throw new ApiError(400, "No eligible approved faculty available for scheduling");
    }

    // Sort faculty by priority score (highest first)
    allFaculty.sort((a, b) => getFacultyPriorityScore(b) - getFacultyPriorityScore(a));

    // Auto-fetch approved subjects for this semester if not manually specified in sections
    const semesterSubjects = await Subject.find({ 
        semester: semesterNum, 
        isApproved: true 
    });

    // Build occupation maps from existing slots
    const existingSlots = await TimeSlot.find({ timetableId });
    const occupiedFaculty = new Set();
    const occupiedClassroom = new Set();
    const facultyWorkload = {};

    existingSlots.forEach(slot => {
        for (let s = slot.startSlot; s < slot.endSlot; s++) {
            occupiedFaculty.add(`${slot.facultyId}-${slot.day}-${s}`);
            occupiedClassroom.add(`${slot.classroom}-${slot.day}-${s}`);
        }
        const fId = slot.facultyId.toString();
        facultyWorkload[fId] = (facultyWorkload[fId] || 0) + (slot.endSlot - slot.startSlot);
    });

    const createdSlots = [];
    const warnings = [];
    const allocationLog = [];
    const roundNumber = (timetable.allocationRound || 0) + 1;

    // Helper: check time period preference
    const timePeriodMatches = (slot, preferredPeriod) => {
        if (!preferredPeriod || preferredPeriod === "both") return true;
        if (preferredPeriod === "morning") return slot <= 4;
        if (preferredPeriod === "afternoon") return slot >= 5;
        return true;
    };

    // ── SECTION-BASED ALLOCATION ──
    for (const section of sections) {
        const { sectionName, classroom, floor, subjects: sectionSubjects } = section;
        if (!sectionName || !classroom) {
            warnings.push(`Section "${sectionName || 'Unknown'}" missing required fields, skipped.`);
            continue;
        }

        // Use auto-selected subjects from semester if not provided
        const subjectsToSchedule = (sectionSubjects && sectionSubjects.length > 0)
            ? sectionSubjects
            : semesterSubjects.map(s => ({
                subjectName: s.name,
                lecturesPerWeek: 3,
                isLab: false
            }));

        const sectionDailyCounts = {};

        for (const subjectConfig of subjectsToSchedule) {
            const { subjectName, lecturesPerWeek = 3, isLab = false } = subjectConfig;
            if (!subjectName || lecturesPerWeek <= 0) continue;

            // ── JoSAA Priority: Find best faculty for this subject ──
            // Faculty who have this subject in their preferences get priority
            const scoredFaculty = allFaculty.map(f => {
                const prefMatch = f.preferences?.preferredSubjects?.find(
                    ps => ps.subjectName?.toLowerCase().trim() === subjectName.toLowerCase().trim()
                );
                const priorityScore = getFacultyPriorityScore(f);
                const subjectPriority = prefMatch ? (6 - prefMatch.priority) : 0; // Invert: P1 subject = 5 points, P5 = 1
                return {
                    faculty: f,
                    totalScore: priorityScore + (subjectPriority * 100), // Subject pref heavily weighted
                    hasSubjectPref: !!prefMatch,
                    subjectPriority: prefMatch?.priority || 99
                };
            }).filter(sf => sf.hasSubjectPref) // Only faculty who listed this subject
              .sort((a, b) => b.totalScore - a.totalScore); // Highest score first

            if (scoredFaculty.length === 0) {
                warnings.push(`No faculty has "${subjectName}" in their preferences for section "${sectionName}".`);
                allocationLog.push({ facultyName: "N/A", subject: subjectName, status: `No faculty preference match` });
                continue;
            }

            let lecturesAssigned = 0;

            for (let attempt = 0; attempt < lecturesPerWeek && lecturesAssigned < lecturesPerWeek; attempt++) {
                let placed = false;

                for (const { faculty, subjectPriority } of scoredFaculty) {
                    const fId = faculty._id.toString();
                    const currentLoad = facultyWorkload[fId] || 0;
                    const maxLoad = faculty.preferences?.maxLecturesPerWeek || faculty.maxLecturesPerWeek || 15;
                    if (currentLoad >= maxLoad) continue;

                    const availDays = faculty.preferences?.availableDays || workingDays;
                    const timePref = faculty.preferences?.preferredTimePeriod || "both";

                    for (const day of workingDays) {
                        if (!availDays.includes(day)) continue;

                        // Prevent same subject multiple times same day per section
                        const dailyKey = `${sectionName}-${subjectName}-${day}`;
                        const currentDaily = sectionDailyCounts[dailyKey] || 0;
                        if (currentDaily >= 1) continue; // Max 1 per subject per section per day

                        const allSlots = Array.from({ length: slotsPerDay }, (_, i) => i + 1);
                        const preferredSlots = allSlots.filter(s => timePeriodMatches(s, timePref));
                        const otherSlots = allSlots.filter(s => !timePeriodMatches(s, timePref));
                        const orderedSlots = [...preferredSlots, ...otherSlots];

                        for (const slotStart of orderedSlots) {
                            const slotEnd = isLab ? slotStart + 2 : slotStart + 1;
                            if (slotEnd > slotsPerDay + 1) continue;

                            // Check faculty conflict
                            let hasConflict = false;
                            for (let s = slotStart; s < slotEnd; s++) {
                                if (occupiedFaculty.has(`${fId}-${day}-${s}`)) { hasConflict = true; break; }
                                if (occupiedClassroom.has(`${classroom}-${day}-${s}`)) { hasConflict = true; break; }
                            }
                            if (hasConflict) continue;

                            // Check consecutive lecture preference
                            const consecutivePref = faculty.preferences?.consecutiveLecturesPreference;
                            if (consecutivePref === "prefer-breaks" && slotStart > 1) {
                                if (occupiedFaculty.has(`${fId}-${day}-${slotStart - 1}`)) continue;
                            }

                            // ── ALLOCATE ──
                            const timeSlot = await TimeSlot.create({
                                timetableId, facultyId: faculty._id, classroom, subject: subjectName,
                                day, startSlot: slotStart, endSlot: slotEnd,
                                duration: isLab ? 2 : 1,
                                notes: `Round ${roundNumber} | Priority: P${subjectPriority} | ${faculty.designation}`
                            });

                            for (let s = slotStart; s < slotEnd; s++) {
                                occupiedFaculty.add(`${fId}-${day}-${s}`);
                                occupiedClassroom.add(`${classroom}-${day}-${s}`);
                            }
                            facultyWorkload[fId] = currentLoad + (slotEnd - slotStart);
                            sectionDailyCounts[dailyKey] = currentDaily + 1;

                            createdSlots.push(timeSlot);
                            lecturesAssigned++;
                            placed = true;

                            allocationLog.push({
                                facultyName: faculty.fullName,
                                subject: subjectName,
                                status: `Allocated ${day} Slot ${slotStart}-${slotEnd} (P${subjectPriority})`
                            });
                            break;
                        }
                        if (placed) break;
                    }
                    if (placed) break;
                }

                if (!placed) {
                    warnings.push(`Could not place lecture ${lecturesAssigned + 1} of "${subjectName}" for "${sectionName}".`);
                    break;
                }
            }

            if (lecturesAssigned < lecturesPerWeek) {
                warnings.push(`Only ${lecturesAssigned}/${lecturesPerWeek} lectures for "${subjectName}" in "${sectionName}".`);
            }
        }
    }

    // Update faculty allocation statuses
    const allocatedFacultyIds = [...new Set(createdSlots.map(s => s.facultyId.toString()))];
    await Faculty.updateMany(
        { _id: { $in: allocatedFacultyIds }, allocationStatus: "unallocated" },
        { allocationStatus: "allocated" }
    );

    // Save allocation log
    await Timetable.findByIdAndUpdate(timetableId, {
        $inc: { totalSlots: createdSlots.length },
        allocationRound: roundNumber,
        $push: {
            allocationLogs: {
                round: roundNumber,
                timestamp: new Date(),
                summary: `Round ${roundNumber}: ${createdSlots.length} slots created, ${warnings.length} warnings`,
                details: allocationLog
            }
        }
    });

    const populatedSlots = await TimeSlot.find({
        _id: { $in: createdSlots.map(s => s._id) }
    }).populate("facultyId", "fullName email designation experience");

    res.status(201).json({
        success: true,
        message: `Round ${roundNumber} complete! ${createdSlots.length} slots allocated using JoSAA priority.`,
        data: {
            round: roundNumber,
            createdSlots: populatedSlots,
            totalCreated: createdSlots.length,
            allocationLog,
            warnings,
            facultyPriorityOrder: allFaculty.map(f => ({
                name: f.fullName,
                designation: f.designation,
                experience: f.experience,
                score: getFacultyPriorityScore(f)
            }))
        }
    });
});

// ── Run Another Round (for upgrade faculty) ──
const runAllocationRound = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can run allocation rounds");
    
    // Reset "upgraded" faculty to "unallocated" so they get re-allocated
    const upgradedFaculty = await Faculty.find({ allocationStatus: "upgraded" });
    
    if (upgradedFaculty.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No faculty pending upgrade. All allocations are final.",
            data: { upgradedCount: 0 }
        });
    }

    // Clear existing slots for upgraded faculty in this timetable
    const { timetableId } = req.params;
    for (const faculty of upgradedFaculty) {
        await TimeSlot.deleteMany({ timetableId, facultyId: faculty._id });
        faculty.allocationStatus = "unallocated";
        await faculty.save();
    }

    // Now re-run the main generate function by forwarding
    // The generate function already skips frozen/withdrawn faculty
    req.body.isReRun = true;
    return generateTimetableAuto(req, res);
});

// ── Auto Generate by Branch + Semester ──
const autoGenerateByBranchSemester = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can generate timetables");
    const { timetableId } = req.params;
    const { branch, semester, classroom, slotsPerDay = 7 } = req.body;

    if (!branch || !semester) throw new ApiError(400, "Branch and semester are required");
    if (!classroom) throw new ApiError(400, "Classroom is required");

    const semNum = parseInt(semester, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) throw new ApiError(400, "Valid semester (1-8) required");

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) throw new ApiError(404, "Timetable not found");

    // Auto-fetch subjects for this branch + semester
    const subjects = await Subject.find({ branch, semester: semNum, isApproved: true });
    if (subjects.length === 0) throw new ApiError(400, `No approved subjects found for ${branch} Semester ${semNum}`);

    const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Build sections config from fetched subjects
    const sectionsConfig = [{
        sectionName: `${branch}-Sem${semNum}`,
        classroom,
        subjects: subjects.map(s => ({
            subjectName: s.name,
            lecturesPerWeek: s.lecturesPerWeek || (s.isLab ? 2 : 3),
            isLab: s.isLab || false
        }))
    }];

    // Reuse existing generate logic
    req.body.sections = sectionsConfig;
    req.body.slotsPerDay = slotsPerDay;
    return generateTimetableAuto(req, res);
});

// ── Generate All Classes Timetable ──
const generateAllClassesTimetable = asyncHandler(async (req, res) => {
    if (req.role !== "Admin") throw new ApiError(403, "Only admin can generate timetables");
    
    // Create a new global timetable or find active one. We'll create a new one for this generation.
    const timetable = await Timetable.create({
        name: `Global Timetable ${new Date().toISOString().split('T')[0]}`,
        semester: "All",
        academicYear: new Date().getFullYear().toString(),
        status: "draft",
        createdBy: req.user._id
    });
    
    const classes = await Class.find();
    if (classes.length === 0) throw new ApiError(400, "No classes found. Upload classes first.");
    
    const allFaculty = await Faculty.find({ status: "approved" });
    if (allFaculty.length === 0) throw new ApiError(400, "No approved faculty found.");
    
    const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlotsMorning = [1, 2, 3, 4]; // 9-10, 10-11, 11-12, 12-1
    const timeSlotsAfternoon = [5, 6]; // 2:30-3:30, 3:30-4:30
    const allSlotIndices = [...timeSlotsMorning, ...timeSlotsAfternoon];
    
    const allocationLogs = [];
    const createdSlots = [];
    
    const occupiedFaculty = new Set();
    const occupiedRoom = new Set();
    
    for (const cls of classes) {
        const subjects = await Subject.find({ branch: cls.branch, semester: cls.semester, isApproved: true });
        if (subjects.length === 0) {
            allocationLogs.push(`Skipped ${cls.className}: No subjects found for ${cls.branch} Sem ${cls.semester}`);
            continue;
        }
        
        for (const day of workingDays) {
            for (const slotIdx of allSlotIndices) {
                // Pick a random subject (greedy, simple approach)
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                
                // Find an available faculty
                let assignedFaculty = null;
                for (const faculty of allFaculty) {
                    if (!occupiedFaculty.has(`${faculty._id}-${day}-${slotIdx}`)) {
                        assignedFaculty = faculty;
                        break;
                    }
                }
                
                if (assignedFaculty) {
                    // Check room
                    if (!occupiedRoom.has(`${cls.room}-${day}-${slotIdx}`)) {
                        const timeSlot = await TimeSlot.create({
                            timetableId: timetable._id,
                            classId: cls._id,
                            facultyId: assignedFaculty._id,
                            classroom: cls.room,
                            subject: subject.name,
                            day,
                            startSlot: slotIdx,
                            endSlot: slotIdx + 1
                        });
                        createdSlots.push(timeSlot);
                        occupiedFaculty.add(`${assignedFaculty._id}-${day}-${slotIdx}`);
                        occupiedRoom.add(`${cls.room}-${day}-${slotIdx}`);
                        
                        let timeString = "";
                        if (slotIdx === 1) timeString = "9:00 AM";
                        else if (slotIdx === 2) timeString = "10:00 AM";
                        else if (slotIdx === 3) timeString = "11:00 AM";
                        else if (slotIdx === 4) timeString = "12:00 PM";
                        else if (slotIdx === 5) timeString = "2:30 PM";
                        else if (slotIdx === 6) timeString = "3:30 PM";
                        
                        allocationLogs.push(`Assigned ${subject.name} to ${cls.className} ${day} ${timeString}`);
                    }
                }
            }
        }
    }
    
    await Timetable.findByIdAndUpdate(timetable._id, { totalSlots: createdSlots.length });
    
    res.status(201).json({
        success: true,
        message: "Timetable generated for all classes",
        data: {
            createdSlotsCount: createdSlots.length,
            logs: allocationLogs
        }
    });
});

// ── Get Class Timetable ──
const getClassTimetable = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const timeSlots = await TimeSlot.find({ classId })
        .populate("facultyId", "fullName designation")
        .populate("classId", "className year branch semester room")
        .sort({ day: 1, startSlot: 1 });
        
    res.status(200).json({ success: true, count: timeSlots.length, data: timeSlots });
});

export {
    createTimetable, getTimetables, getTimetableById, updateTimetable, deleteTimetable,
    addTimeSlot, getTimeSlots, updateTimeSlot, deleteTimeSlot,
    getFacultyTimetable, generateTimetableAuto, approveTimetable, runAllocationRound,
    autoGenerateByBranchSemester, generateAllClassesTimetable, getClassTimetable
};