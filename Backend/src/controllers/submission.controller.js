import { db } from "../libs/db.js";

export const getAllSubmissions = async (req, res) => {
    try {
        const submissions = await db.submission.findMany({
            where: {
                userId: req.user.id
            }
        });

        res.status(200).json({
            success: true,
            message: "Submissions fetched successfully",
            submissions
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: error.message || "Error while fetching submissions"});
    }
};

export const getSubmissionForProblem = async (req, res) => {
    try {
        const {problemId} = req.params;
        const submissions = await db.submission.findMany({
            where: {
                problemId,
                userId
            }
        });

        res.status(200).json({
            success: true,
            message: "Submissions fetched successfully",
            submissions
        });
    } catch (error) {
        console.error("Error fetching submission: ", error);
        return res.status(500).json({error: error.message || "Error while fetching submission for problem"});
    }
};

export const getAllSubmissionsForProblem = async (req, res) => {
    try {
        const {problemId} = req.params;
        const submissionsCount = await db.submission.count({
            where: {
                problemId,
            }
        });

        res.status(200).json({
            success: true,
            message: "Submission count fetched successfully",
            submissionsCount
        });
    } catch (error) {
        console.error("Error while fetching submission count: ", error);
        return res.status(500).json({error: error.message || "Error while fetching submission count"});
    }
};