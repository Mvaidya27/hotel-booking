import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

// Helper function to check room availability
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
    try {
        const booking = await Booking.find({
            room,
            checkInDate: { $lte: checkInDate },
            checkOutDate: { $gte: checkOutDate },
        });
        return booking.length === 0;
    } catch (error) {
        console.error("Availability Check Error:", error.message);
        return false;
    }
};

// API to check availability of a room
export const checkAvailabilityAPI = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate } = req.body;
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        res.json({ success: true, isAvailable });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// API to create a new booking
export const createBooking = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate, guests } = req.body;
        const user = req.user?._id || req.auth?.userId;

        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });

        if (!isAvailable) {
            return res.json({ success: false, message: "Room is not available" });
        }

        const roomData = await Room.findById(room).populate("hotel");
        if (!roomData || !roomData.hotel) {
            return res.status(400).json({ success: false, message: "Invalid room or hotel data" });
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        let totalPrice = roomData.pricePerNight * nights;

        const booking = await Booking.create({
            user,
            room,
            hotel: roomData.hotel._id,
            guests: +guests,
            checkInDate,
            checkOutDate,
            totalPrice,
        });

        res.json({ success: true, message: "Booking created successfully" });
    } catch (error) {
        console.log("Booking Creation Error:", error);
        res.json({ success: false, message: "Failed to create booking" });
    }
};

// API to get all bookings for a user
export const getUserBookings = async (req, res) => {
    try {
        const user = req.user?._id || req.auth?.userId;

        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const bookings = await Booking.find({ user })
            .populate("room hotel")
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (error) {
        console.error("Get User Bookings Error:", error);
        res.json({ success: false, message: "Failed to fetch bookings" });
    }
};

// API to get all bookings for a hotel owner (dashboard)
export const getHotelBookings = async (req, res) => {
    try {
        const ownerId = req.auth?.userId;

        if (!ownerId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const hotel = await Hotel.findOne({ owner: ownerId });

        if (!hotel) {
            return res.json({ success: false, message: "No Hotel Found" });
        }

        const bookings = await Booking.find({ hotel: hotel._id })
            .populate("room hotel user")
            .sort({ createdAt: -1 });

        const totalBookings = bookings.length;

        const totalRevenue = bookings.reduce(
            (acc, booking) => acc + (booking.totalPrice || 0),
            0
        );

        res.json({
            success: true,
            dashboardData: { totalBookings, totalRevenue, bookings },
        });
    } catch (error) {
        console.error("Get Hotel Bookings Error:", error);
        res.json({ success: false, message: "Failed to fetch bookings" });
    }
};
