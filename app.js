//imports
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const path = require("path");
app.set('view engine', 'ejs');
const session = require("express-session");
const routes = require("./routes/routes");
const adminRoutes = require("./routes/admin");

process.on('uncaughtException', function (err) {
    console.log(err);
});

app.use(session({
    secret: "secret_key",
    saveUninitialized: false,
    resave: false
}))


//middlewares
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//routes 
app.use("/", routes);
app.use("/admin", adminRoutes);

//Server start
app.listen(8080);