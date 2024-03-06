const { db } = require("./db/dbConfig");

async function createRoutes (req, res){
    const inputData = req.body;
    res.set("Content-Type", "application/json");
    if(!inputData.boarding_point || !inputData.dropping_point){
        res.status(400).send(JSON.stringify({"message" : "One of routes property is missing"}));
        return;
    }
    Object.keys(inputData).forEach(key => {
        if(typeof inputData[key] === "string"){
            inputData[key] = inputData[key].toLowerCase();
        }
    });
    if(inputData.boarding_point === inputData.dropping_point){
        res.status(400).send(JSON.stringify({"message" : "Properties cannot be the same"}));
        return;
    }
    try{
        const [result] = await db.execute("SELECT id FROM routes WHERE boarding_point = ? AND dropping_point = ?", 
            Object.values(inputData));
        if(result.length === 0){
            await db.execute("INSERT INTO routes(boarding_point, dropping_point) VALUES (?, ?)", 
                Object.values(inputData)); 
        }
        res.status(201).send(JSON.stringify({"message" : "Route Created"}));
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error);
    }
}

async function getAllRoutes (req, res) {
    res.set("Content-Type", "application/json");
    try{
        const [result] = await db.execute("SELECT * FROM routes");
        if(result.length >= 1){
            res.status(200).send(JSON.stringify(result));
        }
        else{
            res.status(404).send(JSON.stringify({"message" : "No Routes found"}));
        }
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error);
    }
}

module.exports = { getAllRoutes, createRoutes };