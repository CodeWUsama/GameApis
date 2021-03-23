const jwt = require("jsonwebtoken");
const db = require("./../mysqlconnection");

module.exports = (req, res, next) => {
    const token = req.get("Authorization");
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, "kwi9owl");
    }
    catch (err) {
        err.statusCode = 500;
        return res.status(500).json({ message: err.message });
    }
    if (!decodedToken) {
        return res.status(401).json({ message: "Authentication Failed!" });
    }
    req.playerId = decodedToken.playerId;
    let sql = "Select * from player_details where playerid='" + req.playerId + "'";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result[0].status === 1) {
            next();
        }
        else {
            return res.status(401).json({ message: "Unauthorized access because player is banned" });
        }
    })
}