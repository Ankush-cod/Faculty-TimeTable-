import { Class } from "../model/class.model.js";
import xlsx from "xlsx";
import fs from "fs";

export const uploadClassesExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 400, message: "No file uploaded" });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ status: 400, message: "Excel file is empty" });
        }

        const classesToInsert = data.map(row => ({
            className: row.className,
            year: Number(row.year),
            branch: row.branch,
            semester: Number(row.semester),
            room: row.room
        })).filter(c => c.className && !isNaN(c.year) && c.branch && !isNaN(c.semester) && c.room);

        if (classesToInsert.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ status: 400, message: "No valid class data found in Excel" });
        }

        await Class.insertMany(classesToInsert);
        fs.unlinkSync(req.file.path);

        return res.status(201).json({
            status: 201,
            message: `${classesToInsert.length} classes uploaded successfully`,
            data: classesToInsert
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Upload classes error:", error);
        return res.status(500).json({ status: 500, message: error.message || "Failed to upload classes" });
    }
};

export const getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find().sort({ year: 1, semester: 1, branch: 1, className: 1 });
        return res.status(200).json({ status: 200, data: classes });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message || "Failed to fetch classes" });
    }
};
