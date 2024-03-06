const { db } = require("./db/dbConfig");

async function getBusSeats (req, res) {
    const bus = req.params;
    res.set("Content-Type", "application/json");
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
        res.status(404).send(JSON.stringify({"message" : "No Buses Found"}));
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error);
    }
}

module.exports = { getBusSeats };