const { Socket } = require("dgram");
const fs = require("fs");
const path = require('path');
const { v4: uuidv4 } = require("uuid");

let rooms = {};
let players = {};

const ROOMS_FILE = path.join(__dirname, "Rooms.json");
const PLAYER_FILE = path.join(__dirname, "Players.json");

function CreateRoomsPlayers() {
    rooms = getJsonData(ROOMS_FILE);
    players = getJsonData(PLAYER_FILE);
}


// ─────────────────────────────────────────────
// Room Persistence
// ─────────────────────────────────────────────
function CreatePlayer(id, socketId) {
    const player = {
        Name: "",
        PlayerID: id,
        SocketID: socketId,
        InactiveTime: 0,
        isLeft: false,
        PlayerMark: ""
    }
    return player;
}

function CreateGame() {
    const Game = {
        GameID: uuidv4(),
        Gameboard: Array(9).fill(null),
        WinnerPlayer: null,
        GameStarted: new Date().toISOString(),
        GameEnded: null,
        isGameEnded: false
    }
    return Game;
}


function CreateRoom() {
    const room = {
        RoomID: generateRoomCode(),
        RoomCreated: new Date().toISOString(),
        Players: [],
        Games: [],
        CurrentTurn: "X",
        isStarted: false,
        Messages: []
    }
    return room;
}

// ─────────────────────────────────────────────
// Room Operations
// ─────────────────────────────────────────────

function CreateUUID(socketID) {
    const playerId = uuidv4();
    const player = CreatePlayer(playerId, socketID);
    players[playerId] = player;
    saveRooms(players, PLAYER_FILE);
    return playerId;
}

function UpdatePlayerSocketID(playerId, socketId) {
    const player = players[playerId];
    if (player) {
        player.SocketID = socketId;
    } else {
        players[playerId] = CreatePlayer(playerId, socketId);
    }
    saveRooms(players, PLAYER_FILE);

}

function UpdateRoomSocketID(roomCode, playerId, socketId) {
    const room = rooms[roomCode];
    if (!room) return false;

    const player = room.Players.find(p => p.PlayerID === playerId);
    player.SocketID = socketId;

    saveRooms(rooms, ROOMS_FILE);

    return true;
}

function CreateGameRoom(id, Name) {
    const room = CreateRoom();
    const player = players[id];
    if (!player) return false
    player.Name = Name;
    player.PlayerMark = "X";
    saveRooms(players, PLAYER_FILE);

    room.Players.push(player);
    room.Games.push(CreateGame());
    rooms[room.RoomID] = room;
    saveRooms(rooms, ROOMS_FILE);

    return room.RoomID;
}


function JoinPlayerRoom(roomCode, Name, playerId) {
    const room = rooms[roomCode];
    if (!room) return "NOROOM";
    if (room.Players.length >= 2) return "FULLROOM";

    const player = players[playerId];
    player.Name = Name;
    player.PlayerMark = "O";
    room.Players.push(player);
    room.isStarted = true;
    saveRooms(rooms, ROOMS_FILE);

    return "JOINED";
}

function isRoomGameStarted(roomCode) {
    const room = rooms[roomCode];
    if (!room) return false;
    return room.isStarted;
}

function getGameboard(roomCode) {
    const room = rooms[roomCode];
    if (!room) return null;
    return room.Games.at(-1).Gameboard;
}

function getCurrentTurn(roomCode) {
    const room = rooms[roomCode];
    if (!room) return null;
    return room.CurrentTurn;
}

function getGameWinner(roomCode) {
    const room = rooms[roomCode];
    if (!room) return null;
    return room.Games.at(-1).WinnerPlayer;
}

function MakePlayerMove(roomCode, index) {
    const room = rooms[roomCode];
    if (!room) return "NOROOM";
    const game = room.Games.at(-1);
    if (game.Gameboard[index] || game.isGameEnded) return "GAMEOVER";

    game.Gameboard[index] = room.CurrentTurn;

    const winner = checkWinner(game.Gameboard);
    if (winner) {
        game.isGameEnded = true;
        game.GameEnded = new Date().toISOString();
        game.WinnerPlayer = winner;
    } else {
        room.CurrentTurn = room.CurrentTurn === "X" ? "O" : "X";
    }

    saveRooms(rooms, ROOMS_FILE);

    return "MOVEMADE"
}

function SetPlayerLeft(roomCode, playerId) {
    const room = rooms[roomCode];
    if (!room) return "NOROOM";
    const player = room.Players.find(p => p.PlayerID === playerId);
    if (!player) return "NOPLAYER";

    player.isLeft = true;

    saveRooms(rooms, ROOMS_FILE);
    return "LEFTPLAYER";
}

function PlayerRematch(playerId, newSymbol, roomCode) {
    const room = rooms[roomCode];
    if (!room) return "NOROOM";
    if (room.Players[0].isLeft || room.Players[1].isLeft) return "PLAYERLEFT"

    const game = room.Games;
    if (!game) return "NOGAME";
    const player = room.Players.find(p => p.PlayerID === playerId);

    if (!player) return "NOPLAYER";
    player.PlayerMark = newSymbol;

    saveRooms(rooms, ROOMS_FILE);

    return "SENTREMATCH"
}

function AcceptedRematch(playerId, newSymbol, roomCode) {
    const room = rooms[roomCode];
    if (!room) return "NOROOM";

    if (room.Players[0].isLeft || room.Players[1].isLeft) return "PLAYERLEFT"

    const player = room.Players.find(p => p.PlayerID === playerId);

    if (!player) return "NOPLAYER";
    player.PlayerMark = newSymbol;

    const game = room.Games;
    if (!game) return "NOGAME";

    game.push(CreateGame());

    saveRooms(rooms, ROOMS_FILE);

    return "SENTAREMATCH"
}

function PlayerLeftOnDisconnect(socketId) {

}

// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────

function getJsonData(FILENAME) {
    if (fs.existsSync(FILENAME)) {
        const data = fs.readFileSync(FILENAME, "utf-8");
        return JSON.parse(data);
    }
}

function generateRoomCode(length = 6) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        803886
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function saveRooms(Json, FILE_NAME) {
    fs.writeFileSync(FILE_NAME, JSON.stringify(Json, null, 2));
}

function checkWinner(board) {
    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]           // diagonals
    ];

    for (const [a, b, c] of winCombos) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // "X" or "O" wins
        }
    }

    // Check for draw
    if (board.every(cell => cell !== null)) {
        return "draw"; // no empty cells and no winner
    }

    return null; // game still ongoing
}

module.exports = { saveRooms, AcceptedRematch, PlayerRematch, SetPlayerLeft, getGameWinner, MakePlayerMove, getCurrentTurn, getGameboard, isRoomGameStarted, JoinPlayerRoom, CreateGameRoom, UpdateRoomSocketID, UpdatePlayerSocketID, CreateUUID, getJsonData, CreateRoomsPlayers, CreatePlayer, CreateGame, CreateRoom };
