



const squares = document.querySelectorAll(".cell");
const turnDisplay = document.getElementById("turnDisplay");
const waitingPopup = document.getElementById("waitingPopup");
const textPopup = document.getElementById("popuptext");
const btnRematch = document.querySelectorAll("#btnRematch");
let isPlayerLeft = true;
let board = Array(9).fill("");
let currentPlayer = null;

waitingPopup.style.display = "flex";
textPopup.innerHTML = `Room code: <span class="font-bold">${roomCode}</span><br> Waiting for other player to join...`;



// waitingPopup.addEventListener("click", () => {
//     const roomCode = "SRQP4U";
//     const roomData = { roomCode, playerID: playerId };

//     socket.emit("joinRoom", roomData);

// });

// let started = false;

socket.on("gameStart", (data) => {
    if (!currentPlayer) {
        board = [...data.gameState];
        currentPlayer = data.turn;
        waitingPopup.style.display = "none";
        AssignMark(sessionStorage.getItem("Playersymbol") == "O");
        renderBoard();
        updateTurnDisplay();
        isPlayerLeft = false;
    }
});

squares.forEach((sq, index) => {
    sq.addEventListener("click", () => {
        if (board[index] !== null || currentPlayer !== sessionStorage.getItem("Playersymbol")) return;
        socket.emit("makeMove", { roomCode, index });
    });
});

socket.on("gameUpdate", (data) => {
    const { gameState, turn, winner } = data;

    board = [...gameState];
    currentPlayer = turn;

    renderBoard();
    updateTurnDisplay();

    if (winner) {
        if (winner === "draw") showDrawPopup();
        else if (winner === sessionStorage.getItem("Playersymbol")) showWinPopup();
        else showLossPopup();
    }
});
Object.defineProperty(window, "isPlayerLeft", {
    get() {
        return isPlayerLeft;
    },
    set(value) {
        if (isPlayerLeft === false && value === true) {
            console.log("Changed from false → true");
            NotifyandRedirect();
        }
        isPlayerLeft = value;
    }
});

function NotifyandRedirect() {
    console.log(waitingPopup.style.display);
    console.log(textPopup.innerHTML.trim());
    console.log(textPopup);
    if (
        waitingPopup &&
        textPopup &&
        waitingPopup.style.display === "flex" &&
        textPopup.innerHTML.trim() === "Waiting for your opponent to accept the rematch…"
    ) {
        waitingPopup.style.display = "none";
        const popup = document.createElement("div");
        popup.innerHTML = `
            <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p class="mb-4">Opponent has left the room, redirecting to Home</p>
                    <button id="okBtn" class="px-4 py-2 bg-blue-500 text-white rounded">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        document.getElementById("okBtn").addEventListener("click", () => {
            popup.remove();
            PlayerLeft();
            ClearSession();
        });
    }
}
socket.on("playerLeftUpdate", (PlayerId) => {
    isPlayerLeft = true;
    NotifyandRedirect();
})

function onRetryClick() {
    if (isPlayerLeft) return alert("Opponent has left the room");

    waitingPopup.style.display = "flex";
    textPopup.innerHTML = "Waiting for your opponent to accept the rematch…";
    let sy = sessionStorage.getItem("Playersymbol");
    currentPlayer = null;
    sessionStorage.setItem("Playersymbol", sy === "O" ? "X" : "O");
    if (!document.getElementById("drawPopup").classList.contains("hidden")) {
        document.getElementById("drawPopup").classList.add("hidden");
    }
    if (!document.getElementById("winPopup").classList.contains("hidden")) {
        document.getElementById("winPopup").classList.add("hidden");
    }
    if (!document.getElementById("lossPopup").classList.contains("hidden")) {
        document.getElementById("lossPopup").classList.add("hidden");
    }

    socket.emit("rematch", {
        playerId: sessionStorage.getItem("playerId"),
        newSymbol: sessionStorage.getItem("Playersymbol"),
        roomCode: sessionStorage.getItem("roomID")
    });
}

socket.on("WantsRematch", (playerId) => {
    if (!document.getElementById("drawPopup").classList.contains("hidden")) {
        document.getElementById("drawPopup").classList.add("hidden");
    }
    if (!document.getElementById("winPopup").classList.contains("hidden")) {
        document.getElementById("winPopup").classList.add("hidden");
    }
    if (!document.getElementById("lossPopup").classList.contains("hidden")) {
        document.getElementById("lossPopup").classList.add("hidden");
    }

    showRematchPopup();
})



document.getElementById("acceptRematch").addEventListener("click", () => {
    let sy = sessionStorage.getItem("Playersymbol");
    sessionStorage.setItem("Playersymbol", sy === "O" ? "X" : "O");
    currentPlayer = null;
    socket.emit("acceptRematch", {
        playerId: sessionStorage.getItem("playerId"),
        newSymbol: sessionStorage.getItem("Playersymbol"),
        roomCode: sessionStorage.getItem("roomID")
    });
    hideRematchPopup();
});

// Cancel button click
document.getElementById("cancelRematch").addEventListener("click", () => {
    hideRematchPopup();
    PlayerLeft();
    ClearSession();
});

function AssignMark(player1) {
    document.getElementById("player1").innerText = player1 ? "O" : "X";
    document.getElementById("player2").innerText = player1 ? "X" : "O";
}

function renderBoard() {
    board.forEach((val, i) => {
        squares[i].innerHTML = val ? `<span class="text-6xl font-bold ${val === "O" ? "text-red-500" : "text-green-500"}">${val}</span>`
            : "";
    })
}

function updateTurnDisplay() {
    if (!currentPlayer) return;
    if (currentPlayer === sessionStorage.getItem("Playersymbol")) {
        turnDisplay.innerText = `Your move... ${sessionStorage.getItem("Playersymbol")}`;
    } else {
        turnDisplay.innerText = `Opponent's move... ${currentPlayer}`;
    }
}


function showDrawPopup() {
    document.getElementById("drawPopup").classList.remove("hidden");
}



function showWinPopup() {
    document.getElementById("winPopup").classList.remove("hidden");
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });
}
function showRematchPopup() {
    document.getElementById("rematchPopup").classList.remove("hidden");
}

function hideRematchPopup() {
    document.getElementById("rematchPopup").classList.add("hidden");
    waitingPopup.style.display = "flex";
    textPopup.innerHTML = "Waiting for your opponent…";
}

function showLossPopup() {
    document.getElementById("lossPopup").classList.remove("hidden");

}

function closeDrawPopup() {
    document.getElementById("drawPopup").classList.add("hidden");
    PlayerLeft()
    ClearSession();
}

function closeWinPopup() {
    document.getElementById("winPopup").classList.add("hidden");
    PlayerLeft()
    ClearSession();
}

function closeLossPopup() {
    document.getElementById("lossPopup").classList.add("hidden");
    PlayerLeft()
    ClearSession();
}

function ClearSession() {
    sessionStorage.removeItem("Playersymbol");
    sessionStorage.removeItem("roomID");
    window.location.href = `/home.html`;
}

function PlayerLeft() {
    const roomData = {
        playerId: sessionStorage.getItem("playerId"),
        roomCode: sessionStorage.getItem("roomID")
    }
    socket.emit("playerLeft", roomData);
}

