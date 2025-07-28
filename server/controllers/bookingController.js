import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";


// function to check room is available
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
    try {
        const booking = await Booking.find({
            room,
            checkInDate: { $lte: checkInDate },
            checkOutDate: { $gte: checkOutDate },
        });
        const isAvailable = booking.length === 0;
        return isAvailable;
    } catch (error) {
        console.error(error.message);
    }
}

// api to check availability of room
export const checkAvailabilityAPI = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate } = req.body;
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        res.json({ success: true, isAvailable })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// to create new booking
export const createBooking = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate, guests } = req.body;
        const user = req.user?._id || req.auth?.userId;

        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const isAvailable = await checkAvailability({
            checkInDate,
            checkOutDate,
            room
        });

        if (!isAvailable) {
            return res.json({ success: false, message: "Room is not available" });
        }

        const roomData = await Room.findById(room).populate("hotel");
        let totalPrice = roomData.pricePerNight;

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

        totalPrice *= nights;

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
        console.log(error);
        res.json({ success: false, message: "Failed to create booking" });
    }
};



//Api to get all booking for a user
export const getUserBookings = async (req, res) => {
    try {
        const user = req.user._id;
        const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 })
        res.json({ success: true, bookings })
    } catch (error) {
        res.json({ success: false, message: "Failed to fetch bookings" })
    }
}


export const getHotelBookings = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ owner: req.auth.userId });
        if (!hotel) {
            return res.json({ success: false, message: "No Hotel Found" })
        }
        const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });

        //total booking
        const totalBookings = bookings.length;

        //total revenue
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice.totalPrice, 0)

        res.json({ success: true, dashboardData: { totalBookings, totalRevenue, bookings } })
    } catch (error) {
        res.json({ success: false, message: "Failed to fetch bookings" })
    }
}