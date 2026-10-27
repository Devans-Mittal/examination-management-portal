import express from "express";
import {
    getStudentsForEvaluation,
    submitEvaluation,
    getMyEvaluations
} from "../controllers/evaluationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("examiner"));

router.get("/students", getStudentsForEvaluation);
router.post("/", submitEvaluation);
router.get("/my-evaluations", getMyEvaluations);

export default router;