const db = require("./../mysqlconnection");
const jwt = require("jsonwebtoken");
const con = require("./../mysqlconnection");
const mysql2 = require("mysql2-promise")();

exports.checkPlayer = async (req, res) => {
    try {
        let playerId = req.query.id;
        //search for playerid
        let sql = "Select * from (player_details inner join owneditems on player_details.playerid=owneditems.playerid) where player_details.playerid='" + playerId + "'";

        const token = jwt.sign({
            playerId: playerId
        }, "kwi9owl");

        db.query(sql, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result.length > 0) {
                //player found
                let data = result[0];
                return res.status(200).json({ message: "Player Found", data: data, token: token });
            }
            else {
                return res.status(404).json({ message: "Player Not Found" });
            }
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.addPlayer = (req, res) => {

    try {
        let playerId = req.body.playerId;
        let username = req.body.username;
        let numberFlag = false;
        let lengthFlag = false;

        //Username Pattern Validation
        if (username.length == 8) {
            lengthFlag = true;
        }

        for (let i = 0; i < username.length; i++) {
            if (username[i] >= '0' && username[i] <= "9") {
                numberFlag = true;
            }
        }

        var patt = new RegExp("^[a-zA-Z0-9]*$");
        var flag = patt.test(username);
        if (flag & lengthFlag & numberFlag) {

            let sql = "INSERT INTO player_details (playerid,username) VALUES ('" + playerId + "','" + username + "')";

            con.query(sql, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: err.message });
                };
                //create a token
                const token = jwt.sign({
                    playerId: playerId
                }, "kwi9owl");

                let sql = "INSERT INTO owneditems (playerid) VALUES ('" + playerId + "')";
                con.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }
                    let sql = "INSERT INTO friendrequests (playerid) VALUES ('" + playerId + "')";
                    con.query(sql, (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: err.message });
                        }
                        let sql = "INSERT INTO friends (playerid) VALUES ('" + playerId + "')";
                        con.query(sql, (err, result) => {
                            if (err) {
                                return res.status(500).json({ message: err.message });
                            }
                            let sql = "INSERT INTO playerdata (playerid) VALUES ('" + playerId + "')";
                            con.query(sql, (err, result) => {
                                if (err) {
                                    return res.status(500).json({ message: err.message });
                                }
                                return res.status(200).json({ message: "Player Added", token: token });
                            });
                        });
                    });
                });

            });
        }
        else {
            return res.status(500).json({ message: "Username should contain be of length 8 characters including number" });
        }
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }


}

exports.sendRequest = (req, res) => {

    try {
        let toSend = req.body.toSend;

        let sql = "Select * from friendrequests where playerid='" + req.playerId + "'";
        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            else {
                let fr_sent;
                let flag1 = false;
                let flag2 = false;
                let fr_sent_new;
                let fr_recieved;

                if (result[0].fr_sent) {
                    fr_sent = result[0].fr_sent.split(',');
                    fr_sent_new = result[0].fr_sent + "," + toSend;
                    fr_sent.map(fr => {
                        if (fr == toSend) {
                            flag1 = true;
                            return res.status(200).json({ message: "Request Sent Already" });
                        }
                    });
                }
                else {
                    fr_sent_new = toSend;
                }

                if (result[0].fr_recieved) {
                    fr_recieved = result[0].fr_recieved.split(',');
                    fr_recieved.map(fr => {
                        if (fr == toSend & flag1 == false) {
                            flag2 = true;
                            return res.status(200).json({ message: "You already got the request of same person" });
                        }
                    });
                }

                if (flag1 == false & flag2 == false) {
                    let sql = "Update friendrequests set fr_sent='" + fr_sent_new + "'" + " where playerid='" + req.playerId + "'";
                    db.query(sql, (err, result) => {
                        if (err) return res.status(500).json({ message: err.message });
                        if (result) {
                            let sql = "Update friendrequests set fr_recieved='" + req.playerId + "'" + " where playerid='" + toSend + "'";
                            db.query(sql, (err, result) => {
                                if (err) return res.status(500).json({ message: err.message });
                                if (result) {
                                    return res.status(200).json({ message: "Request Sent Successfully" });
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


exports.acceptReq = (req, res) => {

    try {
        let acceptedId = req.body.acceptedId;
        let playerId = req.playerId;
        let newFrs;

        let sql = "Select * from friends where playerid='" + playerId + "'";
        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            let newFriendList;
            if (result[0].friends) {
                newFriendList = result[0].friends + "," + acceptedId;
            }
            else {
                newFriendList = acceptedId;
            }

            let sql = "Update friends set friends='" + newFriendList + "'" + " where playerid='" + req.playerId + "'";
            con.query(sql, (err, result) => {

                if (err) {
                    return res.status(500).json({ message: err.message });
                }

                let sql = "Select * from friendrequests where playerid='" + req.playerId + "'";
                db.query(sql, (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    let friendReqs = (result[0].fr_recieved).split(',');

                    if (friendReqs.length == 1) {
                        let sql = "Update friendrequests set fr_recieved= NULL where playerid='" + req.playerId + "'";
                        db.query(sql, (err, result) => {
                            if (err) return res.status(500).json({ message: err.message });
                            if (result) {
                                return res.status(200).json({ message: "Friend Added Successfully" });
                            }
                        });
                    }
                    else {

                        friendReqs.map(fr => {
                            if (fr != acceptedId) {
                                if (newFrs) {
                                    newFrs += "," + fr;
                                }
                                else {
                                    newFrs = fr;
                                }
                            }
                        })
                        let sql = "Update friendrequests set fr_recieved='" + newFrs + "'" + " where playerid='" + req.playerId + "'";
                        db.query(sql, (err, result) => {
                            if (err) return res.status(500).json({ message: err.message });
                            if (result) {
                                return res.status(200).json({ message: "Friend Added Successfully" });
                            }
                        });
                    }
                })

            })

        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.updateClothingPurchase = (req, res) => {

    try {
        let playerId = req.playerId;
        let newClothId = req.body.clothId;

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

            let sql = "Update owneditems set cloths='" + updatedCloths + "'" + " where playerid='" + playerId + "'";
            db.query(sql, (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                if (result) {
                    return res.status(200).json({ message: "Cloths Updated Successfully" });
                }
            });

        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.updateEmotePurchase = (req, res) => {

    try {
        let playerId = req.playerId;
        let newEmoteId = req.body.emoteId;

        let sql = "Select * from owneditems where playerid='" + playerId + "'";

        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            let updatedEmotes;

            if (result[0].emotes) {
                updatedEmotes = result[0].emotes + "," + newEmoteId;
            }
            else {
                updatedEmotes = newEmoteId;
            }

            let sql = "Update owneditems set emotes='" + updatedEmotes + "'" + " where playerid='" + playerId + "'";
            db.query(sql, (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                if (result) {
                    return res.status(200).json({ message: "Emotes Updated Successfully" });
                }
            });

        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.updateCharacterPurchase = (req, res) => {

    try {
        let playerId = req.playerId;
        let newCharacterId = req.body.characterId;

        let sql = "Select * from owneditems where playerid='" + playerId + "'";

        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            let updatedCharacters;

            if (result[0].characters) {
                updatedCharacters = result[0].characters + "," + newCharacterId;
            }
            else {
                updatedCharacters = newCharacterId;
            }

            let sql = "Update owneditems set characters='" + updatedCharacters + "'" + " where playerid='" + playerId + "'";
            db.query(sql, (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                if (result) {
                    return res.status(200).json({ message: "Characters Updated Successfully" });
                }
            });

        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }


}

exports.updatePetPurchase = (req, res) => {

    try {
        let playerId = req.playerId;
        let newPetId = req.body.petId;

        let sql = "Select * from owneditems where playerid='" + playerId + "'";

        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            let updatedPets;

            if (result[0].pets) {
                updatedPets = result[0].pets + "," + newPetId;
            }
            else {
                updatedPets = newPetId;
            }

            let sql = "Update owneditems set pets='" + updatedPets + "'" + " where playerid='" + playerId + "'";
            db.query(sql, (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                if (result) {
                    return res.status(200).json({ message: "Pets Updated Successfully" });
                }
            });

        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.updatePetEmotePurchase = (req, res) => {

    try {
        let playerId = req.playerId;
        let newPetEmoteId = req.body.petEmoteId;

        let sql = "Select * from owneditems where playerid='" + playerId + "'";

        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            let updatedPetEmotes;

            if (result[0].petsEmotes) {
                updatedPetEmotes = result[0].petsEmotes + "," + newPetEmoteId;
            }
            else {
                updatedPetEmotes = newPetEmoteId;
            }

            let sql = "Update owneditems set petsemotes='" + updatedPetEmotes + "'" + " where playerid='" + playerId + "'";
            db.query(sql, (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
                if (result) {
                    return res.status(200).json({ message: "Pets Emotes Updated Successfully" });
                }
            });

        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.updateDailyReward = (req, res) => {

    try {

        let daysToUpdate = req.body.daysToUpdate;
        let category = req.body.category;
        let rewardId = req.body.rewardId;

        let sql = "Update dailyrewards set rewardcategory='" + category + "' , rewardid='" + rewardId + "' where days='" + daysToUpdate + "'";
        db.query(sql, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result) {
                return res.status(200).json({ message: "Daily Rewards Updated Successfully" });
            }
        });

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.viewDailyReward = (req, res) => {

    try {
        let sql = "Select * from dailyrewards";
        db.query(sql, (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            if (result) {
                return res.status(200).json({ rewards: result });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.viewLeaderboard = (req, res) => {

    try {
        let playersByKills;
        let playersByWins;

        let sql = "SELECT * FROM (playerdata inner join player_details on playerdata.playerid=player_details.playerid inner join friends on playerdata.playerid=friends.playerid) ORDER BY kills Desc Limit 20";

        con.query(sql, function (err, result) {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            if (result) {
                playersByKills = result;
                let sql2 = "SELECT * FROM (playerdata inner join player_details on playerdata.playerid=player_details.playerid inner join friends on playerdata.playerid=friends.playerid) ORDER BY win Desc Limit 20";

                con.query(sql2, function (err, result) {
                    if (err) {
                        res.status(500).json({ message: err.message });
                        throw err;
                    }
                    if (result) {
                        playersByWins = result;
                        res.status(200).json({ playersByKills: playersByKills, playersByWins: playersByWins });
                    }
                });
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.postFeedback = (req, res) => {

    try {
        let username = req.body.username;
        let feedback = req.body.feedback;
        let sql = "INSERT INTO feedback (username,feedback) VALUES ('" + username + "','" + feedback + "')";
        con.query(sql, function (err, result) {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            return res.status(200).json({ message: "feedback added" });
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
        con.query(sql, function (err, result) {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            return res.status(200).json({ message: "message sent" });
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.playerData = (req, res) => {

    try {
        let playerId = req.playerId;
        let lastmatchkills = req.body.lastmatchkills;
        let lastmatchdamage = req.body.lastmatchdamage;
        let matchresult = req.body.result;

        let sql = "Select * from playerdata where playerid=' " + playerId + "'";
        db.query(sql, (err, result) => {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            if (result.length > 0) {
                let totalmatch = result[0].totalmatchplayed;
                totalmatch += 1;
                let kills = parseInt(result[0].kills) + parseInt(lastmatchkills);
                let dem = parseInt(result[0].damages) + parseInt(lastmatchdamage);
                let win;
                let loss;
                if (matchresult == "win") {
                    win = result[0].win + 1;
                    loss = result[0].loss;
                }
                else {
                    win = result[0].win;
                    loss = result[0].loss + 1;
                }
                var sql = "UPDATE playerdata SET totalmatchplayed = '" + totalmatch + "',lastmatchkills =   '" + lastmatchkills + "' ,kills =   '" + kills + "'  ,damages =   '" + dem + "', win =   '" + win + "',loss =   '" + loss + "' WHERE playerid = ' " + playerId + "'";
                db.query(sql, (err, result) => {
                    if (err) {
                        res.status(500).json({ message: err.message });
                        throw err;
                    }
                    return res.status(200).json({ message: "player data updated Successfully" });
                })

            }
            else {
                let tmp = 1;
                let win
                let loss;
                if (matchresult == "win") {
                    win = 1;
                    loss = 0;
                }

                let sqll = "INSERT INTO playerdata (playerid, totalmatchplayed, lastmatchkills, kills, damages, win, loss) VALUES ('" + playerId + "','" + tmp + "','" + lastmatchkills + "','" + lastmatchkills + "','" + lastmatchdamage + "','" + win + "','" + loss + "')";
                db.query(sqll, (err, result) => {
                    if (err) {
                        res.status(500).json({ message: err.message });
                        throw err;
                    }
                    return res.status(200).json({ message: "player data updated Successfully" });
                })
            }
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}



exports.getPlayerData = (req, res) => {

    try {
        const playerId = req.query.id;
        let sql = "Select * from playerdata where playerid=' " + playerId + "'";
        db.query(sql, (err, result) => {
            if (err) {
                res.status(500).json({ message: err.message });
                throw err;
            }
            if (result.length > 0) {
                res.status(200).json({
                    totalmatchplayed: result[0].totalmatchplayed,
                    lastmatchkills: result[0].lastmatchkills,
                    kills: result[0].kills,
                    damages: result[0].damages,
                    win: result[0].win,
                    loss: result[0].loss
                });

            }
            else {
                res.status(500).json({ message: "user not found" });
            }
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.toggelmaintainance = (req, res) => {

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
                    return res.status(408).json({ message: "System is under maintenance" });
                }
                else {
                    return res.status(200).json({ message: "System is working fine" });
                }
            }
        })

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.updatePlayerDetails = (req, res) => {

    try {
        let playerId = req.playerId;
        let level = req.body.level;
        let experience = req.body.experience;
        let profilePicture = req.body.profilePicture;
        let curCloth = req.body.curCloth;
        let curChar = req.body.curChar;

        let sql = "UPDATE player_details SET level = '" + level + "',experience =   '" + experience + "' ,profilepicture =   '" + profilePicture + "'  ,curcloth =   '" + curCloth + "', cur_char =   '" + curChar + "' WHERE playerid = ' " + playerId + "'";
        db.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            };
            return res.status(200).json({ message: "Player Details Updated Successfully" });
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.friendsData = async (req, res) => {

    try {
        const playerId = req.query.id;
        let dataToSend = [];
        let usernames = [];

        let sql = "Select * from friends where playerid='" + playerId + "'";
        const result = await mysql2.query(sql);
        const friendsDB = ((result[0])[0].friends);

        if (friendsDB) {
            let friends = (friendsDB).split(',');
            for (let i = 0; i < friends.length; i++) {
                let sql = "Select * from (player_details inner join owneditems on player_details.playerid=owneditems.playerid inner join friends on player_details.playerid=friends.playerid inner join friendrequests on player_details.playerid=friendrequests.playerid) where player_details.playerid='" + friends[i] + "'";
                let result = await mysql2.query(sql);
                dataToSend.push(result[0][0]);
                usernames.push((result[0][0]).username)
            }
        }

        res.status(200).json({ message: "Player Friends Are: ", friendsUsernames: usernames, friendsData: dataToSend })

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.getSentRequests = async (req, res) => {

    try {
        const playerId = req.query.id;
        let usernames = [];

        let sql = "Select * from friendrequests where playerid='" + playerId + "'";
        const result = await mysql2.query(sql);
        const reqs = ((result[0])[0].fr_sent);


        if (reqs) {
            let frSentArray = (reqs).split(',');
            for (let i = 0; i < frSentArray.length; i++) {
                let sql = "Select * from (player_details inner join owneditems on player_details.playerid=owneditems.playerid inner join friends on player_details.playerid=friends.playerid inner join friendrequests on player_details.playerid=friendrequests.playerid) where player_details.playerid='" + frSentArray[i] + "'";
                let result = await mysql2.query(sql);
                usernames.push(result[0][0].username)
            }
        }

        res.status(200).json({ message: "Player Sent Requests Are: ", fr_sent: usernames })

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.getRecievedRequests = async (req, res) => {

    try {
        const playerId = req.query.id;
        let usernames = [];

        let sql = "Select * from friendrequests where playerid='" + playerId + "'";
        const result = await mysql2.query(sql);
        const reqs = ((result[0])[0].fr_recieved);

        if (reqs) {
            let frRecArray = (reqs).split(',');
            for (let i = 0; i < frRecArray.length; i++) {
                let sql = "Select * from (player_details inner join owneditems on player_details.playerid=owneditems.playerid inner join friends on player_details.playerid=friends.playerid inner join friendrequests on player_details.playerid=friendrequests.playerid) where player_details.playerid='" + frRecArray[i] + "'";
                let result = await mysql2.query(sql);
                usernames.push((result[0][0]).username);
            }
        }

        res.status(200).json({ message: "Player Received Requests Are: ", fr_recieved: usernames })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}