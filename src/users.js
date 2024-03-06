const { db } = require("./db/dbConfig");

const bcrypt = require("bcrypt");
const saltRounds = 4;

async function createUser (req, res) {
    const credentials = req.body;
    res.set("Content-Type", "application/json");
    if(!credentials.name || !credentials.email || !credentials.password){
        res.status(400).send(JSON.stringify({"message" : "One of the User properties is missing"}));
        return;
    }
    credentials.email = credentials.email.toLowerCase();
    try{
        const [email] = await db.execute("SELECT id FROM users WHERE email = ?", [credentials.email]);
        if(email.length === 0){
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(credentials.password, salt);
            await db.execute("INSERT INTO users(name, email, password) VALUES (?, ?, ?)", 
                [credentials.name, credentials.email, hashedPassword]);
            res.status(201).send(JSON.stringify({"message": "Registration Successfull"}));
        }
        else{
            res.status(409).send(JSON.stringify({"message" : "Email already in use"}));
        }
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error",
            "error" : error.message}));
        console.log(error);
    }
}

async function loginUser (req, res) {
    const credentials = req.body;
    res.set("Content-Type", "application/json");
    if(!credentials.email || !credentials.password){
        res.status(400).send(JSON.stringify({"message" : "One of Login Properties is missing"}));
        return;
    }
    credentials.email = credentials.email.toLowerCase();
    try{
        const [result] = await db.execute("SELECT * FROM users WHERE email = ?", 
            [credentials.email]);
        if(result.length === 0){
            res.status(404).send(JSON.stringify({"message" : "Invalid Username or Password"}));
            return;
        }
        res.locals.result = result[0];
        const correctPassword = await bcrypt.compare(credentials.password, res.locals.result.password);
        if(!correctPassword){
            res.status(404).send(JSON.stringify({"message" : "Invalid Username or Password"}));
            return;
        }
    }
    catch(error){
        res.status(500).send(JSON.stringify({"message" : "Internal Server Error", "error" : error.message}));
        console.log(error);
        return;
    }
    res.status(200).send(JSON.stringify({"message":"Logged In Successfully"}));
}

module.exports = { createUser, loginUser };