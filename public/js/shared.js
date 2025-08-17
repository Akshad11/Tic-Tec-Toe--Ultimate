const socket = io("http://192.168.1.33:3000");
const roomCode = new URLSearchParams(window.location.search).get("room");
function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}

socket.on("assignSymbol", (symbol) => {
    console.log(symbol);
    sessionStorage.setItem("Playersymbol", symbol);
})

socket.on("errorMessage", (msg) => {
    alert(msg);
});

let playerId = sessionStorage.getItem("playerId");

socket.on("assignPlayerId", (id) => {
    playerId = id;
    sessionStorage.setItem("playerId", id);
    // updateText(sessionStorage.getItem("playerId") + " ---- " + sessionStorage.getItem("Playersymbol"))
    console.log(playerId);
});

function logValue(val) {
    console.log(val);

}

socket.on("CheckPlayerExits", () => {
    // updateText(sessionStorage.getItem("playerId") + " ---- " + sessionStorage.getItem("Playersymbol"))
    let pID = sessionStorage.getItem("playerId");
    if (!pID) {
        socket.emit("CreatePlayer");
    }
    else {
        socket.emit("updatePlayer", {
            roomCode: sessionStorage.getItem("roomID"),
            playerID: sessionStorage.getItem("playerId")
        })
    }
})


function updateText(newText) {
    // document.getElementById("fixedText").textContent = newText;
}