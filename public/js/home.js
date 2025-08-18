const btnCreateRoom = document.querySelector("#btnCreateRoom");
const txtRoomId = document.querySelector("#txtRoomId");
const txtName = document.querySelector("#txtName");
const btnjoin = document.querySelector("#btnjoin");

btnCreateRoom.addEventListener("click", () => {
  if (txtName.value.trim() === "") {
    return alert("Enter your name");
  }
  sessionStorage.setItem("PlayerName", txtName.value);
  socket.emit("createRoom", {
    playerId: sessionStorage.getItem("playerId"),
    Name: sessionStorage.getItem("PlayerName"),
  });
  socket.on("roomCreated", (roomCode) => {
    sessionStorage.setItem("roomID", roomCode);
    window.location.href = `/Game.html?room=${roomCode}`;
  });
});

btnjoin.addEventListener("click", () => {
  const roomCode = txtRoomId.value.trim();
  if (txtName.value.trim() === "") {
    return alert("Enter your name");
  }
  sessionStorage.setItem("PlayerName", txtName.value);

  if (roomCode) {
    const roomData = {
      roomCode,
      Name: sessionStorage.getItem("PlayerName"),
      playerID: playerId,
    };
    // console.log(roomData);
    socket.emit("joinRoom", roomData);
  }
  txtRoomId.value = "";

  socket.on("joinedRoom", (roomCode) => {
    roomfull = true;
    sessionStorage.setItem("roomID", roomCode);
    window.location.href = `/Game.html?room=${roomCode}`;
  });
});
