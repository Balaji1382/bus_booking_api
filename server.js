const express = require("express");
const mysql = require("mysql2/promise");

const HOST = "localhost";
const PORT = 4004;

const app = express();

app.use(express.json());

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bus_booking_test",
    connectionLimit: 10,
    enableKeepAlive: true
});

app.post("/api/routes", async (req, res) => {
    const inputData = req.body;
    if(!inputData.boarding_point || !inputData.dropping_point){
        res.status(400).send("One of routes property is missing");
        return;
    }
    Object.keys(inputData).forEach(key => {
        if(typeof inputData[key] === "string"){
            inputData[key] = inputData[key].toLowerCase();
        }
    });
    if(inputData.boarding_point === inputData.dropping_point){
        res.status(400).send("Properties cannot be the same");
        return;
    }
    try{
        const [result] = await db.execute("SELECT id FROM routes WHERE boarding_point = ? AND dropping_point = ?", 
            Object.values(inputData));
        if(result.length === 0){
            await db.execute("INSERT INTO routes(boarding_point, dropping_point) VALUES (?, ?)", 
                Object.values(inputData)); 
        }
        res.status(201).send("Route Created");
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error);
    }
});

app.post("/api/buses", async (req, res) => {
    const inputData = req.body;
    if(!inputData.name || !inputData.from || !inputData.to || !inputData.timing 
        || !inputData.remaining_seats || !inputData.time_taken){
        res.status(400).send("One of bus property is missing");
        return;
    }
    Object.keys(inputData).forEach(key => {
        if(key === 'name'){
            return;
        }
        if(typeof inputData[key] === "string"){
            inputData[key] = inputData[key].toLowerCase();
        }
    });
    if(inputData.from === inputData.to){
        res.status(400).send("Boarding and Dropping points can't be same");
        return;
    }
    try{
        let [route] = await db.execute("SELECT id FROM routes WHERE boarding_point = ? AND dropping_point = ?", 
            [inputData.from, inputData.to]);
        if(route.length === 0){
            await db.execute("INSERT INTO routes(boarding_point, dropping_point) VALUES (?, ?)",
                [inputData.from, inputData.to]);
            [route] = await db.execute("SELECT id FROM routes WHERE boarding_point = ? AND dropping_point = ?",
                [inputData.from, inputData.to]);            
        }
        else{
            const [found] = await db.execute("SELECT id FROM buses WHERE name = CAST(? AS BINARY) AND route_id = ?",
                [inputData.name, route[0].id]);
            if(found.length > 0){
                res.status(409).send("Bus already exists");
                return;
            }
        }
        await db.execute("INSERT INTO buses(name, route_id, timing, remaining_seats, time_taken_in_mins) VALUES(?, ?, ?, ?, ?)", 
            [inputData.name, route[0].id, inputData.timing, inputData.remaining_seats, inputData.time_taken]);
        let [bus] = await db.execute("SELECT id FROM buses WHERE name = CAST(? AS BINARY) AND route_id = ?", 
            [inputData.name, route[0].id]);
        for(let index = 1; index <= Number(inputData.remaining_seats); index++){
            db.execute("INSERT INTO seats(bus_id, seat_number) VALUES (?, ?)",
                [bus[0].id, index]);
        }
        res.status(201).send("Bus created");
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error);
        return;
    }
});

app.get("/api/routes", async (req, res) => {
    try{
        const [result] = await db.execute("SELECT * FROM routes");
        if(result.length >= 1){
            res.status(200).send(JSON.stringify(result));
        }
        else{
            res.status(404).send("No Routes found");
        }
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error);
    }
});

app.get("/api/buses", async (req, res) => {
    try{
        const [result] = await db.execute("SELECT * FROM buses");
        if(result.length >= 1){
            res.status(200).send(JSON.stringify(result));
        }
        else{
            res.status(404).send("No buses found");
        }
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error.message);
    }
});

app.post("/api/register", async (req, res) => {
    const credentials = req.body;
    if(!credentials.name || !credentials.email || !credentials.password){
        res.status(400).send("One of the User properties is missing");
        return;
    }
    credentials.email = credentials.email.toLowerCase();
    try{
        const [email] = await db.execute("SELECT id FROM users WHERE email = ?", [credentials.email]);
        if(email.length === 0){
            await db.execute("INSERT INTO users(name, email, password) VALUES (?, ?, ?)", 
                [credentials.name, credentials.email, credentials.password]);
            res.status(201).send("Registration Successfull");
        }
        else{
            res.status(409).send("Email already in use");
        }
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error);
    }
});

app.post("/api/login", async (req, res) => {
    const credentials = req.body;
    if(!credentials.email || !credentials.password){
        res.status(400).send("One of Login Properties is missing");
        return;
    }
    credentials.email = credentials.email.toLowerCase();
    try{
        const [result] = await db.execute("SELECT * FROM users WHERE email = ? AND password = ?", 
            [credentials.email, credentials.password]);
        if(result.length === 0){
            res.status(404).send("Invalid Username or Password");
            return;
        }
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error);
        return;
    }
    res.status(200).send("Logged In successfully");
});

app.get("/api/users/:userId/bookings", async (req, res) => {
    const user = req.params;
    user.userId = Number(user.userId);
    try{
        const [userResult] = await db.execute("SELECT id FROM users WHERE id = ?", [user.userId]);
        if(userResult.length == 0){
            res.status(404).send("User not Found");
            return;
        }
        const [output] = await db.execute("SELECT * FROM bookings WHERE user_id = ?", [user.userId]);
        res.status(200).send(JSON.stringify(output));
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error);
        return;
    }
});

//TODO: Validate the endpoint
app.get("/api/buses/:busId/seats", async (req, res) => {
    const bus = req.params;
    bus.busId = Number(bus.busId);
    try{
        const [busResult] = await db.execute("SELECT * FROM buses WHERE id = ?", [bus.busId]);
        if(busResult.length > 0){
            const [seatResult] = await db.execute("SELECT * FROM seats WHERE bus_id = ?", [bus.busId]);
            if(seatResult.length > 0){
                res.status(200).send(JSON.stringify(seatResult));
                return;
            }
            //TODO: Write code to handle when all bus seats are occupied
        }
        res.status(404).send("No Buses Found");
    }
    catch(error){
        res.status(500).send("Internal Server Error");
        console.log(error);
    }
});

app.listen(PORT, () => {
    console.log(`The api is running on http://${HOST}:${PORT}`);
});




