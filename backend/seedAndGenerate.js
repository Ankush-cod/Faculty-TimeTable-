import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Faculty } from './src/model/faculty.model.js';
import { Timetable } from './src/model/timetable.model.js';
import { TimeSlot } from './src/model/timeslot.model.js';
import { Admin } from './src/model/admin.model.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const admin = await Admin.findOne({ role: "Admin" });
        if (!admin) {
            console.error("No Admin found in database. Please register an admin first.");
            process.exit(1);
        }

        console.log("Cleaning up old dummy faculties...");
        await Faculty.deleteMany({ email: { $regex: /^dummy_fac/ } });

        const subjects = ["Mathematics", "Physics", "Computer Science", "English", "Chemistry"];
        const dummyFaculties = [];
        
        for (let i = 1; i <= 15; i++) {
            const subject = subjects[i % subjects.length];
            dummyFaculties.push({
                fullName: `Dr. Dummy ${i}`,
                email: `dummy_fac${i}@example.com`,
                password: "password123",
                department: "Core Engineering",
                designation: "Assistant Professor",
                status: "approved",
                isApproved: true,
                maxLecturesPerWeek: 10,
                subjects: [subject],
                preferences: {
                    maxLecturesPerWeek: 10,
                    preferredTimePeriod: "both",
                    consecutiveLecturesPreference: "no-preference",
                    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    floorPreference: "any-floor"
                }
            });
        }

        console.log("Inserting 15 new faculties...");
        await Faculty.insertMany(dummyFaculties);

        console.log("Creating Timetable for 'Section A'...");
        const timetable = await Timetable.create({
            name: "Dummy Week Generation Test",
            semester: "Semester 1",
            academicYear: "2024",
            status: "draft",
            createdBy: admin._id
        });

        // Clear existing timeslots for this timetable (none exist, but just in case)
        await TimeSlot.deleteMany({ timetableId: timetable._id });

        const token = admin.generateAccessToken();

        const payload = {
            slotsPerDay: 8,
            sections: [
                {
                    sectionName: "Section A",
                    classroom: "Room 101",
                    floor: "any-floor",
                    subjects: [
                        { subjectName: "Mathematics", lecturesPerWeek: 5 },
                        { subjectName: "Physics", lecturesPerWeek: 4 },
                        { subjectName: "Computer Science", lecturesPerWeek: 5 },
                        { subjectName: "English", lecturesPerWeek: 3 },
                        { subjectName: "Chemistry", lecturesPerWeek: 3 }
                    ]
                }
            ]
        };

        console.log("Triggering Auto-Generate Endpoint...");
        const res = await fetch(`http://localhost:5000/api/v1/timetables/${timetable._id}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("Failed to generate:", data);
        } else {
            console.log("Success! Auto-generated timetable slots:", data.data.totalCreated);
            if (data.data.warnings && data.data.warnings.length > 0) {
                console.log("Warnings:", data.data.warnings);
            } else {
                console.log("Generated perfectly without any warnings!");
            }
            
            // Fetch created slots to print out the schedule
            const slots = await TimeSlot.find({ timetableId: timetable._id }).populate("facultyId").sort({ day: 1, startSlot: 1 });
            console.log("\n--- Generated Weekly Schedule for Section A ---");
            let currentDay = "";
            slots.forEach(slot => {
                if (currentDay !== slot.day) {
                    currentDay = slot.day;
                    console.log(`\n** ${currentDay} **`);
                }
                console.log(`Slot ${slot.startSlot}-${slot.endSlot}: ${slot.subject} (Prof. ${slot.facultyId.fullName})`);
            });
            console.log("-----------------------------------------------");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
};

run();
