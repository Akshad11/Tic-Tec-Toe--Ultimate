const { Socket } = require("socket.io");
const { getJsonData, CreatePlayer, saveRooms, CreateUUID, UpdatePlayerSocketID, UpdateRoomSocketID, CreateGameRoom, JoinPlayerRoom, isRoomGameStarted, getGameboard, getCurrentTurn, MakePlayerMove, getGameWinner, SetPlayerLeft, PlayerRematch, AcceptedRematch } = require("./HelperFunctions");

function registerSocketHandlers(io) {


    io.on("connection", (socket) => {

        //Log player
        console.log("A User Connected: ", socket.id);

        socket.emit("CheckPlayerExits");

        socket.on("CreatePlayer", () => {
            const playerId = CreateUUID(socket.id);
            socket.emit("assignPlayerId", playerId);
            socket.data.playerId = playerId;
            console.log("player Id : ", playerId);
        })

        socket.on("updatePlayer", (data) => {
            const { roomCode, playerID } = data;
            UpdatePlayerSocketID(playerID, socket.id);
            if (UpdateRoomSocketID(roomCode, playerID, socket.id)) {
                socket.join(roomCode);
            }
            if (isRoomGameStarted(roomCode)) {
                io.to(roomCode).emit("gameStart", {
                    gameState: getGameboard(roomCode),
                    turn: getCurrentTurn(roomCode)
                });
            }

        })

        socket.on("createRoom", (data) => {
            const { playerId, Name } = data;
            const roomCode = CreateGameRoom(playerId, Name)
            if (roomCode) {
                socket.join(roomCode);
                socket.emit("roomCreated", roomCode);
                socket.emit("assignSymbol", "X");
                console.log(playerId + " has Create Room");
            } else {
                socket.emit("errorMessage", "Room could not be created");
            }
        })

        socket.on("joinRoom", (Data) => {
            const { roomCode, Name, playerID } = Data;

            const FLAG = JoinPlayerRoom(roomCode, Name, playerID);

            if (FLAG === "NOROOM") {
                return socket.emit("errorMessage", "Room does not exits");
            } else if (FLAG === "FULLROOM") {
                return socket.emit("errorMessage", "Room Full");
            } else if (FLAG === "JOINED") {
                socket.emit("assignSymbol", "O");
                socket.join(roomCode);
                socket.emit("joinedRoom", roomCode);
                console.log(playerID + " has joined Room");

            } else {
                return socket.emit("errorMessage", "Unkown Error");
            }
        })

        socket.on("makeMove", (data) => {
            const { roomCode, index } = data;
            const FLAG = MakePlayerMove(roomCode, index);

            if (FLAG === "NOROOM") {
                socket.emit("errorMessage", "Room not found");
            } else if (FLAG === "GAMEOVER") {
                socket.emit("errorMessage", "Game already finished");
            } else if (FLAG === "MOVEMADE") {
                io.to(roomCode).emit("gameUpdate", {
                    gameState: getGameboard(roomCode),
                    turn: getCurrentTurn(roomCode),
                    winner: getGameWinner(roomCode)
                })
            }
        });

        socket.on("playerLeft", (data) => {
            const { roomCode, playerId } = data;

            const FLAG = SetPlayerLeft(roomCode, playerId);

            if (FLAG === "NOROOM") {
                socket.emit("errorMessage", "Room not found");
            } if (FLAG === "NOPLAYER") {
                socket.emit("errorMessage", "Player not found");
            } else if (FLAG === "LEFTPLAYER") {
                socket.to(roomCode).emit("playerLeftUpdate", playerId);
            }
        });

        socket.on("rematch", (data) => {
            const { playerId, newSymbol, roomCode } = data;

            const FLAG = PlayerRematch(playerId, newSymbol, roomCode);
            if (FLAG === "NOROOM") {
                socket.emit("errorMessage", "Room not found");
            } if (FLAG === "PLAYERLEFT" || FLAG === "NOGAME" || FLAG === "NOPLAYER") {
                socket.emit("errorMessage", "Player not found " + FLAG);
            } else if (FLAG === "SENTREMATCH") {
                socket.to(roomCode).emit("WantsRematch", playerId);
            }
        });

        socket.on("acceptRematch", (data) => {
            const { playerId, newSymbol, roomCode } = data;

            const FLAG = AcceptedRematch(playerId, newSymbol, roomCode);

            if (FLAG === "NOROOM") {
                socket.emit("errorMessage", "Room not found");
            } if (FLAG === "PLAYERLEFT" || FLAG === "NOGAME" || FLAG === "NOPLAYER") {
                socket.emit("errorMessage", "Player not found" + FLAG);
            } else if (FLAG === "SENTAREMATCH") {
                io.to(roomCode).emit("gameStart", {
                    gameState: getGameboard(roomCode),
                    turn: getCurrentTurn(roomCode)
                });
            }

        });

        socket.on("disconnect", () => {
            socket.emit("PlayerDisconnected", "Player left");
        });

    })
}

module.exports = registerSocketHandlers;