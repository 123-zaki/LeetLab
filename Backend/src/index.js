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


import authRoutes from "./routes/auth.routes.js";
app.use("/api/v1/auth", authRoutes);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});