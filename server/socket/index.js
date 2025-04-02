/**
 * This file defines the WebSocket server logic for handling real-time communication
 * between clients and the server. It uses Socket.IO for managing socket connections
 * and Redis for storing room and player data.
 *
 * @param {Object} io - The Socket.IO server instance.
 * @param {Object} redisClient - The Redis client instance for managing room data.
 */

module.exports = (io, redisClient) => {
  io.on("connection", (socket) => {
    console.log(`A socket connection to the server has been made: ${socket.id}`);

    /**
     * Event: joinRoom
     * Allows a player to join a specific room using a room key.
     * Updates the room's player list in Redis and notifies other players in the room.
     */
    socket.on("joinRoom", async (roomKey) => {
      socket.join(roomKey);

      const roomInfo = JSON.parse(await redisClient.get(roomKey)) || {};
      roomInfo.players = roomInfo.players || {};
      roomInfo.players[socket.id] = {
        rotation: 0,
        x: 100,
        y: 50,
        playerId: socket.id,
      };

      roomInfo.numPlayers = Object.keys(roomInfo.players).length;
      await redisClient.set(roomKey, JSON.stringify(roomInfo));

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

    /**
     * Event: isKeyValid
     * Validates whether a given room key exists in Redis.
     */
    socket.on("isKeyValid", async (input) => {
      const exists = await redisClient.exists(input);
      exists ? socket.emit("keyIsValid", input) : socket.emit("keyNotValid");
    });

    /**
     * Event: getRoomCode
     * Generates a unique room key and creates a new room in Redis.
     */
    socket.on("getRoomCode", async () => {
      let key = codeGenerator();
      while (await redisClient.exists(key)) {
        key = codeGenerator();
      }

      const roomData = {
        roomKey: key,
        players: {},
        numPlayers: 0,
      };
      await redisClient.set(key, JSON.stringify(roomData));
      socket.emit("roomCreated", key);
    });

    /**
     * Event: playerMovement
     * Updates the player's position in the room and notifies other players.
     */
    socket.on("playerMovement", async (data) => {
      const { x, y, roomKey } = data;
      const roomInfo = JSON.parse(await redisClient.get(roomKey));
      if (roomInfo && roomInfo.players[socket.id]) {
        roomInfo.players[socket.id].x = x;
        roomInfo.players[socket.id].y = y;
        await redisClient.set(roomKey, JSON.stringify(roomInfo));

        socket.to(roomKey).emit("playerMoved", roomInfo.players[socket.id]);
      }
    });

    /**
     * Event: disconnect
     * Handles player disconnection and optionally removes the player from the room.
     */
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Optionally handle player removal from Redis here
    });
  });
};

/**
 * Generates a unique 5-character alphanumeric room code.
 * Excludes ambiguous characters like 'I' and 'O'.
 *
 * @returns {string} - A randomly generated room code.
 */
function codeGenerator() {
  let code = "";
  let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}