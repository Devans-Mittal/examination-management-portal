import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import examinationRoutes from "./routes/examinationRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
const app = express();

app.use(
    cors({
        origin: "http://localhost:5173" || process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Examination Management Portal API is running.",
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Application server is running.",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/examinations", examinationRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/results", resultRoutes);
export default app;