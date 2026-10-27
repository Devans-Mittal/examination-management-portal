import express from "express";

import {
    createCourse,
    getCourses,
    updateCourse,
    deactivateCourse,
} from "../controllers/courseController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.route("/")
    .get(getCourses)
    .post(createCourse);

router.patch("/:id", updateCourse);

router.patch("/:id/deactivate", deactivateCourse);

export default router;