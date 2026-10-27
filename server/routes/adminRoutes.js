import express from "express";

import {
    getPendingExaminers,
    approveExaminer,
    rejectExaminer,
    getApprovedExaminers
} from "../controllers/adminController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes below require an authenticated administrator.
router.use(protect, authorize("admin"));

router.get("/examiners/pending", getPendingExaminers);

router.patch("/examiners/:id/approve", approveExaminer);

router.patch("/examiners/:id/reject", rejectExaminer);

router.get("/examiners/approved", getApprovedExaminers);
export default router;