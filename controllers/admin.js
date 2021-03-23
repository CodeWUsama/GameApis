mysql2 = require("mysql2-promise")();
const db = require("./../mysqlconnection");

exports.renderLogin = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect("/admin/home");
    }
    res.render("login", { data: {} });
}

exports.login = async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let sql = "Select * from admin where username='" + username + "'";
    let result = await mysql2.query(sql);
    if (result[0][0]) {
        if (result[0][0].password === password) {
            req.session.admin = true;
            res.redirect("/admin/home");
        }
        else {
            res.render("login", { data: { error: "Password doesn't matches" } });
        }
    }
    else {
        res.render("login", { data: { error: "Invalid Username" } });
    }
}

exports.renderHome = (req, res, next) => {
    res.render("home");
}

exports.giftCoins = (req, res, next) => {
    res.render("giftCoins", { data: {} });
}

exports.giftGems = (req, res, next) => {
    res.render("giftGems", { data: {} });
}

exports.giftCloth = (req, res, next) => {
    res.render("giftCloth", { data: {} });
}

exports.giftCharacter = (req, res, next) => {
    res.render("giftCharacter", { data: {} });
}

exports.giftPet = (req, res, next) => {
    res.render("giftPet", { data: {} });
}

exports.giftPetEmote = (req, res, next) => {
    res.render("giftPetEmote", { data: {} });
}

exports.giftEmote = (req, res, next) => {
    res.render("giftEmote", { data: {} });
}

exports.logout = (req, res) => {
    req.session.destroy();
    req.session = null;
    res.redirect("/admin");
}

exports.toogleMaintance = (req, res) => {

    try {
        var sql = "SELECT * FROM maintenancestatus";

        db.query(sql, (err, result) => {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            if (result) {
                let data = result[0].status;
                if (data == 1) {
                    data = 0;
                }
                else {
                    data = 1;
                }
                let sqll = "Update maintenancestatus set status='" + data + "'";
                db.query(sqll, (err, result) => {
                    if (err) return res.status(500).json({ message: err.message });
                    if (result) {
                        res.redirect("/admin/home");
                    }
                });

            }
        })

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.viewFeedbacks = (req, res) => {

    let sql = "Select * from feedback ";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result) {
            res.render("feedbacks", { data: result });
        }
    });
}

exports.viewLeaderboard = (req, res) => {

    try {
        let playersByKills;
        let playersByWins;

        let sql = "SELECT * FROM (playerdata inner join player_details on playerdata.playerid=player_details.playerid inner join friends on playerdata.playerid=friends.playerid) ORDER BY kills Desc Limit 20";

        db.query(sql, function (err, result) {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            if (result) {
                playersByKills = result;
                let sql2 = "SELECT * FROM (playerdata inner join player_details on playerdata.playerid=player_details.playerid inner join friends on playerdata.playerid=friends.playerid) ORDER BY win Desc Limit 20";

                db.query(sql2, function (err, result) {
                    if (err) {
                        res.status(500).json({ message: err.message });
                        throw err;
                    }
                    if (result) {
                        playersByWins = result;
                        // res.status(200).json({ playersByKills: playersByKills, playersByWins: playersByWins });
                        return res.render("leaderboard", { data1: playersByKills, data2: playersByWins });
                    }
                });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.handleGiftCoins = (req, res) => {
    try {
        let amount = req.body.coins;
        let userName = req.body.username;
        let playerId;

        let sqll = "Select * from player_details where username='" + userName + "'";
        db.query(sqll, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                playerId = result[0].playerid;
                let sql = "Select * from owneditems where playerid='" + playerId + "'";
                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let updated;
                    if (!result[0].coins || result[0].coins == 0) {
                        updated = amount;
                    }
                    else {
                        updated = parseInt(result[0].coins) + parseInt(amount);
                    }

                    let sql = "Update owneditems set coins='" + updated + "'" + " where playerid='" + playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            return res.render("giftCoins", { data: { error: "Coins Updated Successfully" } });
                        }
                    });

                })
            }
            else {
                return res.render("giftCoins", { data: { error: "Player not found with entered Username" } });
            }
        });
    } catch {
        res.status(500).json({ message: err.message });
    }
}

exports.handleGiftGems = (req, res) => {
    try {
        let amount = req.body.gems;
        let userName = req.body.username;
        let playerId;

        let sqll = "Select * from player_details where username='" + userName + "'";
        db.query(sqll, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                playerId = result[0].playerid;
                let sql = "Select * from owneditems where playerid='" + playerId + "'";
                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let updated;
                    if (!result[0].gems || result[0].gems == 0) {
                        updated = amount;
                    }
                    else {
                        updated = parseInt(result[0].gems) + parseInt(amount);
                    }

                    let sql = "Update owneditems set gems='" + updated + "'" + " where playerid='" + playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            return res.render("giftGems", { data: { error: "Gems Updated Successfully" } });
                        }
                    });

                })
            }
            else {
                return res.render("giftGems", { data: { error: "Player not found with entered Username" } });
            }
        });
    } catch {
        res.status(500).json({ message: err.message });
    }
}


exports.handleGiftCloth = (req, res) => {

    try {
        let newClothId = req.body.cloth;
        let userName = req.body.username;
        let playerId;

        let sqll = "Select * from player_details where username='" + userName + "'";
        db.query(sqll, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                playerId = result[0].playerid;
                let sql = "Select * from owneditems where playerid='" + playerId + "'";

                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let updatedCloths;

                    if (result[0].cloths) {
                        updatedCloths = result[0].cloths + "," + newClothId;
                    }
                    else {
                        updatedCloths = newClothId;
                    }
                    console.log(updatedCloths);
                    let sql = "Update owneditems set cloths='" + updatedCloths + "'" + " where playerid='" + playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            return res.render("giftCloth", { data: { error: "Cloth Updated Successfully" } });
                        }
                    });

                })
            }
            else {
                return res.render("giftCloth", { data: { error: "Player not found with entered username" } });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.handleGiftCharacter = (req, res) => {

    try {
        let updatedId = req.body.character;
        let userName = req.body.username;
        let playerId;

        let sqll = "Select * from player_details where username='" + userName + "'";
        db.query(sqll, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                playerId = result[0].playerid;
                let sql = "Select * from owneditems where playerid='" + playerId + "'";

                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let updatedItem;

                    if (result[0].characters) {
                        updatedItem = result[0].characters + "," + updatedId;
                    }
                    else {
                        updatedItem = updatedId;
                    }

                    let sql = "Update owneditems set characters='" + updatedItem + "'" + " where playerid='" + playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            return res.render("giftCharacter", { data: { error: "Character Updated Successfully" } });
                        }
                    });

                })
            }
            else {
                return res.render("giftCharacter", { data: { error: "Player not found with entered username" } });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.handleGiftPet = (req, res) => {

    try {
        let updatedId = req.body.pet;
        let userName = req.body.username;
        let playerId;

        let sqll = "Select * from player_details where username='" + userName + "'";
        db.query(sqll, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                playerId = result[0].playerid;
                let sql = "Select * from owneditems where playerid='" + playerId + "'";

                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let updatedItem;

                    if (result[0].pets) {
                        updatedItem = result[0].pets + "," + updatedId;
                    }
                    else {
                        updatedItem = updatedId;
                    }

                    let sql = "Update owneditems set pets='" + updatedItem + "'" + " where playerid='" + playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            return res.render("giftPet", { data: { error: "Pet Updated Successfully" } });
                        }
                    });

                })
            }
            else {
                return res.render("giftPet", { data: { error: "Player not found with entered username" } });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.handleGiftEmote = (req, res) => {

    try {
        let updatedId = req.body.emote;
        let userName = req.body.username;
        let playerId;

        let sqll = "Select * from player_details where username='" + userName + "'";
        db.query(sqll, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                playerId = result[0].playerid;
                let sql = "Select * from owneditems where playerid='" + playerId + "'";

                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let updatedItem;

                    if (result[0].emotes) {
                        updatedItem = result[0].emotes + "," + updatedId;
                    }
                    else {
                        updatedItem = updatedId;
                    }

                    let sql = "Update owneditems set emotes='" + updatedItem + "'" + " where playerid='" + playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            return res.render("giftEmote", { data: { error: "Emote Updated Successfully" } });
                        }
                    });

                })
            }
            else {
                return res.render("giftEmote", { data: { error: "Player not found with entered username" } });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.handleGiftPetEmote = (req, res) => {

    try {
        let updatedId = req.body.petemote;
        let userName = req.body.username;
        let playerId;

        let sqll = "Select * from player_details where username='" + userName + "'";
        db.query(sqll, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                playerId = result[0].playerid;
                let sql = "Select * from owneditems where playerid='" + playerId + "'";

                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let updatedItem;

                    if (result[0].petsemotes) {
                        updatedItem = result[0].petsemotes + "," + updatedId;
                    }
                    else {
                        updatedItem = updatedId;
                    }

                    let sql = "Update owneditems set petsemotes='" + updatedItem + "'" + " where playerid='" + playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            return res.render("giftPetEmote", { data: { error: "Pet Emote Updated Successfully" } });
                        }
                    });

                })
            }
            else {
                return res.render("giftPetEmote", { data: { error: "Player not found with entered username" } });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


exports.postMessages = (req, res) => {

    try {
        let message = req.body.message;
        let sql = "INSERT INTO messages (message) VALUES ('" + message + "')";
        db.query(sql, function (err, result) {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            return res.render("message", { data: { error: "Message Sent!" } });
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.displayMessage = (req, res) => {
    res.render("message", { data: {} });
}

exports.ban = (req, res) => {
    res.render("ban", { data: {} });
}

exports.postBan = (req, res) => {
    try {
        let username = req.body.username;
        let nStatus = false;
        let sqll = "Select * from player_details where username='" + username + "'";
        db.query(sqll, (err, result) => {
            if (result.length > 0) {
                let sql = "Update player_details set status='" + nStatus + "'" + " where username='" + username + "'";
                db.query(sql, (err, result) => {
                    if (err) return res.status(500).json({ message: err.message });
                    if (result) {
                        return res.render("ban", { data: { error: "User Banned Successfully!" } });
                    }
                });
            }
            else {
                return res.render("ban", { data: { error: "Such User Don't Exist!" } });
            }
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.unban = (req, res) => {
    res.render("unban", { data: {} });
}

exports.postUnban = (req, res) => {

    try {
        let username = req.body.username;
        let nStatus = 1;
        let sqll = "Select * from player_details where username='" + username + "'";
        db.query(sqll, (err, result) => {
            if (result.length > 0) {
                let sql = "Update player_details set status='" + nStatus + "'" + " where username='" + username + "'";
                db.query(sql, (err, result) => {
                    if (err) return res.status(500).json({ message: err.message });
                    if (result) {
                        return res.render("unban", { data: { error: "User Unbanned Successfully!" } });
                    }
                });
            }
            else {
                return res.render("unban", { data: { error: "Such User Don't Exist!" } });
            }
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}