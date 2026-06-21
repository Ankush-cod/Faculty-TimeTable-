# Timetable Generation Algorithm

This document explains the logic behind the automated timetable generation in the Faculty Timetable Management System.

## Overview

The system uses a **Priority-Based Allocation Algorithm** inspired by seat allocation systems like JoSAA. It aims to balance faculty preferences, administrative constraints, and academic requirements.

## 1. Key Inputs

- **Faculty Data**: Designation, experience, branch, and teaching preferences.
- **Subject Data**: Name, code, branch, semester, lectures per week, and whether it's a lab.
- **Preferences**:
  - Preferred subjects with priority (1-10).
  - Available days and time periods (Morning/Afternoon).
  - Maximum lectures per week.
  - "Not Available" slots.
- **Constraints**:
  - No faculty clashes (one faculty cannot be in two places at once).
  - No room/lab clashes.
  - Section-wise distribution (max 1 lecture of a subject per day).

## 2. Priority Calculation

Every faculty member is assigned a **Priority Score**:
`Score = (DesignationRank * 1000) + (Experience * 10) + (SubjectPreferenceWeight * 100)`

- **Designation Rank**: Professor (3), Associate Professor (2), Assistant Professor (1).
- **Subject Preference Weight**: If a faculty has a subject at Priority 1, they get 10 points. Priority 2 gets 9, and so on. (Calculated as `11 - priority`).

Higher priority faculty are processed first in the allocation loop.

## 3. Allocation Process

The generation happens in **Rounds**:

### Round 1: Primary Allocation
1. **Sort Faculty**: All approved faculty are sorted by their Priority Score (highest first).
2. **Subject Loop**: For each section/branch/semester configuration:
   - Identify subjects required for that semester.
   - For each subject:
     - Find the "Best Fit" faculty (highest priority among those who listed this subject in preferences).
     - **Iteration**: For each lecture required per week (e.g., 3 lectures):
       - Search for an available slot matching faculty's preferred day and time.
       - Verify no clashes (Faculty, Classroom, Room).
       - Ensure "Not Available" slots are respected.
       - Allocate and mark as occupied.

### Round 2+: Upgrades/Clash Resolution
- If a faculty member is marked for "Upgrade", their current slots are cleared, and the algorithm attempts to re-allocate them to better-matching slots in subsequent rounds.

## 4. Constraint Handling

- **Lab Slots**: Automatically allocated as **consecutive 2-hour blocks**.
- **Daily Limit**: The algorithm prevents the same subject from being taught twice to the same section on the same day (unless it's a lab).
- **Workload Balance**: Respects `maxLecturesPerWeek` for every faculty.

## 5. Conflict Resolution Strategy

1. **Faculty Clash**: A global map of `FacultyID-Day-Slot` is maintained.
2. **Room Clash**: A global map of `RoomID-Day-Slot` is maintained.
3. **Waitlist**: If a lecture cannot be placed due to conflicts, it is added to a "Warnings" log for the admin to resolve manually.
