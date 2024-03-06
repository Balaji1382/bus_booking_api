const { db } = require("./db/dbConfig");

async function createBuses(req, res) {
    const inputData = req.body;
    res.set("Content-Type", "application/json");
    if(!inputData.name || !inputData.from || !inputData.to || !inputData.timing 
        || !inputData.remaining_seats || !inputData.time_taken){
        res.status(400).send(JSON.stringify({"message" : "One of bus property is missing"}));
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
        res.status(400).send(JSON.stringify({"message" : "Boarding and Dropping points can't be same"}));
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
                res.status(409).send(JSON.stringify({"message" : "Bus already exists"}));
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
        res.status(201).send(JSON.stringify({"message" : "Bus created"}));
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error);
        return;
    }
}

async function getAllBuses (req, res) {
    res.set("Content-Type", "application/json");
    try{
        const [result] = await db.execute("SELECT * FROM buses");
        if(result.length >= 1){
            res.status(200).send(JSON.stringify(result));
        }
        else{
            res.status(404).send(JSON.stringify({"message" : "No buses found"}));
        }
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error.message);
    }
};

module.exports = { createBuses, getAllBuses };