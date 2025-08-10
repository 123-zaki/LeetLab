import bcrypt from "bcryptjs";
import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const register = async (req, res) => {
    const {name, email, password} = req.body;

    try {
        const existingUser = await db.user.findUnique({
            where: {
                email
            }
        });

        if(existingUser) {
            return  res.status(400).json({
                error: "user already exist",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: UserRole.USER
            }
        });

        const token = jwt.sign({id: newUser.id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('jwt', token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== 'development',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                image: newUser.image
            }
        });
    } catch (error) {
        console.error("Error creating user", error);
        res.status(500).json({
            error: "Error creating user"
        });
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await db.user.findUnique({
            where: {
                email
            }
        });

        if(!user) {
            return  res.status(401).json({
                error: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return  res.status(401).json({
                error: "Invalid credentials",
            });
        }

        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie("jwt", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
            maxAge: 7 * 24 * 60 * 60 * 1000    // 7 days
        });

        res.status(200).json({
            success: true,
            message: "User Logged in successfully",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                image: user.image
            }
        });
    } catch (error) {
        console.error("Error Logging user", error);
        res.status(500).json({
            error: "Error Logging user"
        });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development"
        });
    
        res.status(200).json({
            success: true,
            message: "User Logged out successfully"
        });
    } catch (error) {
        console.error("Error logging out user", error);
        res.status(500).json({
            message: "Error logging out user"
        })
    }
}

export const check = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "User authenticated successfully",
            user: req.user,
        });
    } catch (error) {
        res.status(500).json({
            error: "Error checking user"
        });
    }
}