import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getAllSubmissions, getAllSubmissionsForProblem, getSubmissionForProblem } from "../controllers/submission.controller.js";

const router = express.Router();

router.get("/get-all-submissions", authMiddleware, getAllSubmissions);

router.get("/get-submission/:problemId", authMiddleware, getSubmissionForProblem);

router.get("/get-submission-count/:problemId", authMiddleware, getAllSubmissionsForProblem);

export default router;