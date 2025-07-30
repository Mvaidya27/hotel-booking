import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        const { userId } = await req.auth(); // ✅ FIX: use it as a function

        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
