import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { db } from "../libs/db.js";

dotenv.config();


export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt;
    
        if(!token ) {
            return res.status(401).json({
                message: "Unauthorized - No token provided",
            });
        }
    
        let decoded;
    
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return  res.status(500).json({message: "Unauthorized - Invalid token"});
        }

        const user = await db.user.findUnique({
            where: {
                id: decoded.id,
            },
            select: {
                id: true,
                // image: true,
                email: true,
                name: true,
                role: true,
            }
        });

        if(!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("Error authenticating user: ", error);
        res.status(500).json({message: "Error authenticating user"});
    }
}