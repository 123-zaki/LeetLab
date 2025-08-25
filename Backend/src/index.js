import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();


const app = express();

app.use(express.json());

app.use(urlencoded({extended: true}));

app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Hello Guys, Welcome to leetlab 🔥");
});

// auth routes
import authRoutes from "./routes/auth.routes.js";
app.use("/api/v1/auth", authRoutes);

// problem routes
import problemRoutes from "./routes/problem.routes.js";
app.use("/api/v1/problems", problemRoutes);

// execute code routes
import executeCodeRouter from "./routes/executeCode.routes.js";
app.use("/api/v1/execute-code", executeCodeRouter);

// submission routes
import submissionRouter from "../src/routes/submission.routes.js";
app.use("/api/v1/submissions", submissionRouter);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});