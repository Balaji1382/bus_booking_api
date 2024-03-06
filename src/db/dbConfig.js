const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME,
    connectionLimit: 10,
    timezone: "+05:30",
    enableKeepAlive: true
});

module.exports = { db };