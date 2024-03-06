require("dotenv").config();

const express = require("express");

const { getUserBookings, updateUserBookings, createUserBookings } = require("./src/bookings");
const { getAllRoutes, createRoutes } = require("./src/routes");
const { createBuses, getAllBuses } = require("./src/buses");
const { createUser, loginUser } = require("./src/users");
const { getBusSeats } = require("./src/seats");

const HOST = "localhost";
const PORT = process.env.CONN_PORT;

const app = express();

app.use(express.json());

// methods for manipulating buses resource

app.post("/api/buses", createBuses);

app.get("/api/buses", getAllBuses);

// methods for manipulating routes resource

app.post("/api/routes", createRoutes);

app.get("/api/routes", getAllRoutes);

// method to handle new user registration

app.post("/api/register", createUser);

// method to handle login

app.post("/api/login", loginUser);

// methods to manipulate Bus Seats

app.get("/api/buses/:busId/seats", getBusSeats);

// methods for manipulating bookings resource

app.get("/api/users/:userId/bookings", getUserBookings);

app.post("/api/users/:userId/bookings", createUserBookings);

app.patch("/api/users/:userId/bookings", updateUserBookings);

app.listen(PORT, () => {
    console.log(`The api is running on http://${HOST}:${PORT}`);
});




