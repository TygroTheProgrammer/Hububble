const gameRooms = {
    // [roomKey]: {
    // users: [],
    // randomTasks: [],
    // scores: [],
    // gameScore: 0,
    // players: {},
    // numPlayers: 0
    // }
  };
  
  module.exports = (io) => {
    io.on("connection", (socket) => {
      console.log(
        `A socket connection to the server has been made: ${socket.id}`
      );
      socket.on("joinRoom", (roomKey) => {
        socket.join(roomKey);
        const roomInfo = gameRooms[roomKey];
        console.log("roomInfo", roomInfo);
        roomInfo.players[socket.id] = {
          rotation: 0,
          x: 100,
          y: 50,
          playerId: socket.id,
        }

        roomInfo.numPlayers = Object.keys(roomInfo.players).length;
        socket.emit("setState", roomInfo);

        socket.emit("currentPlayers", {
          players: roomInfo.players,
          numPlayers: roomInfo.numPlayers,
        });

        socket.to(roomKey).emit("newPlayer", {
          playerInfo: roomInfo.players[socket.id],
          numPlayers: roomInfo.numPlayers,
        });
      });

  
      socket.on("isKeyValid", function (input) {
        Object.keys(gameRooms).includes(input)
          ? socket.emit("keyIsValid", input)
          : socket.emit("keyNotValid");
      });
      // get a random code for the room
      socket.on("getRoomCode", async function () {
        
        let key = codeGenerator();
        while (Object.keys(gameRooms).includes(key)) {
          key = codeGenerator();
        }
        gameRooms[key] = {
          roomKey: key,
          players: {},
          numPlayers: 0,
        };
        socket.emit("roomCreated", key);
      });

      socket.on("playerMovement", function (data) {
        const {x, y, roomKey } = data;
        gameRooms[roomKey].players[socket.id].x = x;
        gameRooms[roomKey].players[socket.id].y = y;
  
        socket
          .to(roomKey)
          .emit("playerMoved", gameRooms[roomKey].players[socket.id]);
      });
    
    });
    
  }
  
  function codeGenerator() {
    let code = "";
    let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }