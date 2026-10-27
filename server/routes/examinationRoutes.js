import express from "express";

import {
    createExamination,
    getExaminations,
    getExaminationById,
    updateExamination,
    publishExamination,
    cancelExamination,
    completeExamination,
} from "../controllers/examinationController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All examination management endpoints require an Admin.
router.use(protect, authorize("admin"));

router.route("/")
    .get(getExaminations)
    .post(createExamination);

router.get("/:id", getExaminationById);

router.patch("/:id", updateExamination);

router.patch("/:id/publish", publishExamination);

router.patch("/:id/cancel", cancelExamination);

router.patch("/:id/complete", completeExamination);

export default router;