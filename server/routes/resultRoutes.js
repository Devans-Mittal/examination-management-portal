import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    getPendingResults,
    publishResult,
    getMyResults
} from "../controllers/resultController.js";

const router = express.Router();

// Student result viewing
router.get("/my-results", protect, authorize("student"), getMyResults);

// Admin result management
router.get(
    "/pending",
    protect,
    authorize("admin"),
    getPendingResults
);

router.patch(
    "/:id/publish",
    protect,
    authorize("admin"),
    publishResult
);

export default router;