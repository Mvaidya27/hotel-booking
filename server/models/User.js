import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Clerk user ID
    username: { type: String, default: "" },
    email: { type: String, default: "" },
    image: { type: String, default: "" },
    role: { type: String, enum: ["user", "hotelOwner"], default: "user" },
    recentSearchedCities: { type: [String], default: [] },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
