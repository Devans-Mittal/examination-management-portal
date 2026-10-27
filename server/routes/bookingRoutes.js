import express from "express";
import {
    getAvailableExaminations,
    createBooking,
    getMyBookings,
    cancelBooking
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/available-examinations", getAvailableExaminations);
router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.patch("/:id/cancel", cancelBooking);

export default router;