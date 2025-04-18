/**
 * This file defines the WebSocket server logic for handling real-time communication
 * between clients and the server. It uses Socket.IO for managing socket connections
 * and Redis for storing room and player data.
 *
 * @param {Object} io - The Socket.IO server instance.
 * @param {Object} redisClient - The Redis client instance for managing room data.
 */

// Global error handlers for unhandled promise rejections and uncaught exceptions
process.on("unhandledRejection", (err) => {
  if (err && err.message && err.message.includes("WRONGTYPE Operation against a key holding the wrong kind of value")) {
    console.error("Caught WRONGTYPE error from promise:", err.message);
  } else {
    console.error("Unhandled rejection:", err);
  }
});

process.on("uncaughtException", (err) => {
  if (err && err.message && err.message.includes("WRONGTYPE Operation against a key holding the wrong kind of value")) {
    console.error("Caught WRONGTYPE error from exception:", err.message);
  } else {
    console.error("Uncaught exception:", err);
    process.exit(1);
  }
});

module.exports = (io, redisClient) => {
  io.on("connection", (socket) => {
    console.log(`A socket connection to the server has been made: ${socket.id}`);

    /**
     * Event: joinRoom
     * Allows a player to join a specific room using a room key.
     * Updates the room's player list in Redis and notifies other players in the room.
     */
    socket.on("joinRoom", async (data) => {
      const roomKey = data.roomKey;
      socket.join(roomKey);

      const roomInfo = JSON.parse(await redisClient.get(roomKey)) || {};
      roomInfo.players = roomInfo.players || {};
      roomInfo.players[socket.id] = {
        name: data.name,
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

      // Send join system message with color property set to yellow
      const displayName = roomInfo.players[socket.id].name || socket.id;
      io.to(roomKey).emit("chatMessage", {
        type: "system",
        displayName: "System",
        message: `${displayName} has joined the room`,
        color: "yellow"
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
      if (!roomInfo || !roomInfo.players || !roomInfo.players[socket.id]) {
        console.error(`Invalid roomKey or player not found: ${roomKey}`);
        return;
      }
      roomInfo.players[socket.id].x = x;
      roomInfo.players[socket.id].y = y;
      await redisClient.set(roomKey, JSON.stringify(roomInfo));

      socket.to(roomKey).emit("playerMoved", roomInfo.players[socket.id]);
    });

    /**
     * Event: chatMessage
     * Handles incoming chat messages and broadcasts them to the room.
     * Stores chat messages in Redis.
     */
    socket.on("chatMessage", async (data) => {
      const { roomKey, message, playerId } = data;

      // Validate input data
      if (!roomKey) {
        console.error("Invalid chat message: Missing roomKey", data);
        return;
      }
      if (typeof message !== "string" || message.trim() === "") {
        console.error("Invalid chat message: Message must be a non-empty string", data);
        return;
      }
      if (!playerId) {
        console.error("Invalid chat message: Missing playerId", data);
        return;
      }

      // Sanitize the message to prevent malicious code
      const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();

      // Ensure the room exists
      const roomInfo = JSON.parse(await redisClient.get(roomKey));
      if (!roomInfo || !roomInfo.players || !roomInfo.players[playerId]) {
        console.error("Player or room not found for chat message", data);
        return;
      }

      // Use the stored name from joinRoom or fallback to socket.id.
      const displayName = roomInfo.players[playerId].name || playerId;

      // Store the message in Redis
      const chatLogKey = `chat:${roomKey}`;
      try {
        const chatEntry = JSON.stringify({ playerId, message: sanitizedMessage });
        await redisClient.rPush(chatLogKey, chatEntry);
      } catch (error) {
        console.error("Failed to store chat message in Redis:", error);
        return;
      }

      // Broadcast the message with color if provided
      io.to(roomKey).emit("chatMessage", { 
        displayName, 
        message: sanitizedMessage,
        color: data.color || null 
      });
    });

    // Add an endpoint to fetch chat logs
    socket.on("fetchChatLog", async (roomKey) => {
      const chatLogKey = `chat:${roomKey}`;
      try {
        const chatLog = await redisClient.lRange(chatLogKey, 0, -1);
        const parsedLog = chatLog.map((entry) => JSON.parse(entry));
        socket.emit("chatLog", parsedLog);
      } catch (error) {
        console.error("Failed to fetch chat log from Redis:", error);
      }
    });

    /**
     * Event: disconnect
     * Handles player disconnection and removes the player from the room.
     */
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Iterate through all keys in Redis to find the room the player belongs to
      const keys = await redisClient.keys("*");
      let roomKey = null;
      let roomInfo = null;

      for (const key of keys) {
        let data;
        try {
          data = JSON.parse(await redisClient.get(key));
        } catch (err) {
          // Skip keys that cannot be parsed as JSON
          continue;
        }
        if (data && data.players && data.players[socket.id]) {
          roomKey = key;
          roomInfo = data;
          break;
        }
      }

      if (roomInfo) {
        console.log(`User disconnected from room: ${roomKey}`);
        // Send leave system message with color property set to yellow
        const displayName = roomInfo.players[socket.id].name || socket.id;
        io.to(roomKey).emit("chatMessage", {
          type: "system",
          displayName: "System",
          message: `${displayName} has left the room`,
          color: "yellow"
        });

        // Remove the player from the room
        delete roomInfo.players[socket.id];
        roomInfo.numPlayers = Object.keys(roomInfo.players).length;

        // Update the room data in Redis
        await redisClient.set(roomKey, JSON.stringify(roomInfo));

        // Notify other players in the room about the disconnection
        io.to(roomKey).emit("playerDisconnected", {
          playerId: socket.id,
          numPlayers: roomInfo.numPlayers,
        });

        // If the room is empty, delete it from Redis
        if (roomInfo.numPlayers === 0) {
          await redisClient.del(roomKey);
          console.log(`Room ${roomKey} deleted as it is now empty.`);
        }
      }
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