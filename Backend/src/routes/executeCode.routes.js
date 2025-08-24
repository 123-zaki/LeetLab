import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { executeCode } from "../controllers/executeCode.controller.js";

const router = express.Router();

router.post("/", authMiddleware, executeCode);

export default router;