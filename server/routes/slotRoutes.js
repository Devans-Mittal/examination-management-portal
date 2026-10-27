import express from "express";
import {
    getAssignedExaminations,
    createSlot,
    getMySlots
} from "../controllers/slotController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("examiner"));

router.get("/assigned-examinations", getAssignedExaminations);
router.post("/", createSlot);
router.get("/my-slots", getMySlots);

export default router;