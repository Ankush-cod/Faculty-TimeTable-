import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import timetableRoutes from "./routes/timetable.route.js";
import subjectRoutes from "./routes/subject.route.js";
import classRoutes from "./routes/class.route.js";
dotenv.config();
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/timetables", timetableRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/classes", classRoutes);
app.use((req, res) => {
  res.status(404).json({ status: 404, message: "Route not found" });
});
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    status: statusCode,
    message: err.message || "Something went wrong",
  });
});
export default app;
