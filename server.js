require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require("http")
const { Server } = require('socket.io');
const session = require("express-session");
const registerSocketHandlers = require('./socket');
const { getJsonData, CreateRoomsPlayers } = require("./HelperFunctions");
const sessionMiddleware = session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow all origins for testing
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
})
const port = process.env.PORT || 3000;

CreateRoomsPlayers();
app.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/Home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});
app.get('/Game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Game.html'));
});

app.get('/', (req, res) => {
    res.send("Hello there Docker is live");
});

server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
})

io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

registerSocketHandlers(io);

// Expose HTML pages
app.get("/Home", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Home.html"));
});
app.get("/game.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "game.html"));
});


