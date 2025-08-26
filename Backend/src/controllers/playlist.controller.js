import { db } from "../libs/db.js";

export const getAllListDetails = async(req, res) => {
    try {
        const userId = req.user.id;
        const playlists = await db.playlist.findMany({
            where: {
                userId
            },
            include: {
                problems: {
                    include: {
                        problem: true,
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Playlists Details fetched successfully",
            playlists
        });
    } catch (error) {
        console.error("Error while fetching playlists details: ", error.message);
    }
};

export const getPlaylistDetails = async (req, res) => {
    try {
        const {playlistId} = req.params;
        const userId = req.user.id;

        const playlist = await db.playlist.findUnique({
            where: {
                playlistId,
                userId
            },
            include: {
                problems: {
                    include: {
                        problem: true,
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Playlist fetched successfully",
            playlist
        });
    } catch (error) {
        console.error("Error while fetching playlist: ", error);
        return res.status(500).json({error: "Failed to fetch playlist"});
    }
};

export const createPlaylist = async (req, res) => {
    try {
        const {name, description} = req.body;
        const userId = req.user.id;

        const existingPlaylist = await db.playlist.findUnique({
            where: {
                name_userId: {
                    name,
                    userId: req.user.id,
                }
            }
        });

        if(existingPlaylist) {
            return res.status(409).json({error: "Playlist with this name already exists"});
        }

        const newPlaylist = await db.playlist.create({
            data: {
                name,
                description,
                userId: req.user.id,
            }
        });

        res.status(200).json({
            success: true,
            message: "Playlist created successfully",
            newPlaylist
        });

    } catch (error) {
        console.error("Error while creating playlist: ", error);
        return res.status(500).json({error: "Failed to create playlist"});
    }
};

export const addProblemToPlaylist = async (req, res) => {
    try {
        const {playlistId} = req.params;
        const {problemIds} = req.body;

        if(!Array.isArray(problemIds) || problemIds.length === 0) {
            return res.status(400).json({error: "Invalid or missing problem ids"});
        }

        const problemsInPlaylist = await db.problemsInPlaylist.createMany({
            data: problemIds.map(id => {
                return {playlistId, problemId: id}
            })
        });

        res.status(201).json({
            success: true,
            message: "Problems added in playlist",
            problemsInPlaylist
        });
    } catch (error) {
        console.error("Error while adding problems in playlist: ", error);
        return res.status(500).json({error: "Error adding problems to playlist"});
    }
};

export const removeProblemFromPlaylist = async (req, res) => {
    try {
        const {problemIds} = req.body;
        const {playlistId} = req.params;

        if(!Array.isArray(problemIds) || problemIds.length == 0) {
            return res.status(400).json({error: "Invalid or empty problem ids"});
        }

        const removedProblems = await db.problemsInPlaylist.deleteMany({
            where: {
                playlistId,
                problemId: {
                    in: problemIds
                },
            },
        });

        res.status(200).json({
            success: true,
            message: "Problem successfully removed from playlist",
            removedProblems
        });
    } catch (error) {
        console.error("Error while removing problem from playlist: ", error);
        return res.status(500).json({error: "Error removing problem from playlist"});
    }
};

export const deletePlaylist = async (req, res) => {
    try {
        const {playlistId} = req.params;
        const existingPlaylist = await db.playlist.findUnique({
            where: {
                id: playlistId
            }
        });

        if(!existingPlaylist) {
            return res.status(404).json({error: "Playlist not found"});
        }

        const deletedPlaylist = await db.playlist.delete({
            where: {id: playlistId}
        });

        res.status(200).json({
            success: true,
            message: "Playlist deleted successfully",
            deletePlaylist
        });
    } catch (error) {
        console.error("Error while deleting playlist: ", error.message);
        return res.status(500).json({error: "Failed to delete playlist"});
    }
};