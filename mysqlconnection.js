var mysql = require('mysql');
const mysql2 = require("mysql2-promise")();

mysql2.configure({
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "gamedatabase"
});

let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database:"gamedatabase"
});
con.connect(function (err) {
    if (err) {
        throw err;
    };
    console.log("Mysql Connected!");
});

module.exports=con