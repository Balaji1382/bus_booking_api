const { json } = require("express");
const { db } = require("./db/dbConfig");

async function createUserBookings (req, res){
    const booking_details = req.body;
    res.set("Content-Type", "application/json");
    if(!booking_details.bus_id || !booking_details.seat_number || !booking_details.passenger_name ||
        !booking_details.passenger_age || !booking_details.passenger_gender){
        res.status(400).send(JSON.stringify({"message" : "Request Body might miss some Credentials"}));
        return;
    }
    try{
        const [ifUserExists] = await db.execute("SELECT id FROM users WHERE id = ?", [req.params.userId]);
        if(ifUserExists.length === 0){
            res.status(404).send(JSON.stringify({"message" : "User not Found"}));
            return;
        }
        const [ifBusExists] = await db.execute("SELECT id FROM buses WHERE id = ?", [booking_details.bus_id]);
        if(ifBusExists.length === 0){
            res.status(404).send(JSON.stringify({"message" : "Bus not Found"}));
            return;
        }
        const [seatStatus] = await db.execute("SELECT status FROM seats WHERE bus_id = ? AND seat_number = ?",
            [booking_details.bus_id, booking_details.seat_number]);
        if(seatStatus.length === 0){
            res.status(404).send(JSON.stringify({"message" : "Seat not Found"}));
            return;
        }
        if(seatStatus[0].status === "vacant"){
            await db.execute("UPDATE seats SET status = 'booked' WHERE bus_id = ? AND seat_number = ?", 
                [booking_details.bus_id, booking_details.seat_number]);
            await db.execute("INSERT INTO bookings(user_id, bus_id, date, seat, passenger_name, passenger_age, passenger_gender) VALUES(?, ?, NOW(), ?, ?, ?, ?)", 
                [req.params.userId, booking_details.bus_id, booking_details.seat_number, booking_details.passenger_name, booking_details.passenger_age, booking_details.passenger_gender]);
            res.status(200).send(JSON.stringify({"message" : "Seat Booked"}));
        }
        else{
            // if the front-end is implemented right,
            // it should not come here
            res.status(409).send(JSON.stringify({"message" : "Seat Already booked"}));
        }
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error);
    }
};

async function getUserBookings (req, res) {
    const user = req.params;
    res.set("Content-Type", "application/json");
    user.userId = Number(user.userId);
    try{
        const [userResult] = await db.execute("SELECT id FROM users WHERE id = ?", [user.userId]);
        if(userResult.length == 0){
            res.status(404).send(JSON.stringify({"message" : "User not Found"}));
            return;
        }
        const [output] = await db.execute("SELECT * FROM bookings WHERE user_id = ?", [user.userId]);
        res.status(200).send(JSON.stringify(output));
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error);
        return;
    }
};

async function updateUserBookings (req, res) {
    const cancellation_details = req.body;
    res.set("Content-Type", "application/json");
    if(!cancellation_details.bus_id || !cancellation_details.seat_number){
        res.status(400).send(JSON.stringify({"message" : "Some details might be missing"}));
        return;
    }
    try{
        const [ifUserExists] = await db.execute("SELECT id from users WHERE id = ?", [req.params.userId]);
        if(ifUserExists.length === 0){
            res.status(404).send(JSON.stringify({"message" : "User not Found"}));
            return;
        }
        const [ifBusExists] = await db.execute("SELECT id from buses WHERE id = ?", [cancellation_details.bus_id]);
        if(ifBusExists.length === 0){
            res.status(404).send(JSON.stringify({"message" : "Bus not Found"}));
            return;
        }
        const [seatStatus] = await db.execute("SELECT status from seats WHERE bus_id = ? AND seat_number = ?", 
            [cancellation_details.bus_id, cancellation_details.seat_number]);
        if(seatStatus.length === 0){
            res.status(404).send(JSON.stringify({"message" : "Seat not Found"}));
            return;
        }
        if(seatStatus[0].status === "vacant"){
            res.status(200).send(JSON.stringify({"message" : "Seat's vacant. Booking might be cancelled already"}));
            return;
        }
        else if(seatStatus[0].status === "booked"){
            await db.execute("UPDATE seats SET status = 'vacant' WHERE bus_id = ? AND seat_number = ?", [cancellation_details.bus_id, cancellation_details.seat_number]);
            await db.execute("UPDATE bookings SET status = 'cancelled', date = NOW() WHERE bus_id = ? AND seat = ? AND user_id = ?", [cancellation_details.bus_id, cancellation_details.seat_number, req.params.userId]);
            res.status(200).send(JSON.stringify({"message" : "Booking cancelled"}));
            return;
        }
        else{
            // never comes here
            // db status column can only be filled with ("vacant", "booked")
            res.status(500).send(JSON.stringify({"message" : "Internal Servor Error"}));
            return;
        }
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Servor Error", "error" : error.message}));
        console.log(error);
    }
};

module.exports = { createUserBookings, getUserBookings, updateUserBookings };