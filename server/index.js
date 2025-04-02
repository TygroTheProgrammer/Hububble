// This is a test
// Set up server
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const compression = require("compression")
const { createClient } = require("redis");
const PORT = process.env.PORT || 8080;
const app = express();
const socketio = require("socket.io");

// Initialize Redis client
const redisClient = createClient();

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

module.exports = { app, redisClient };

const createApp = () => {
    //Set up logging middleware
    app.use(morgan("dev"));

    // Set up body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    
    // Set up compression middleware
    app.use(compression());

    // Set up static file-serving middleware
    app.use(express.static(path.join(__dirname, "..", "public")));

    // Send 404 for unrecongnized request
    app.use((req, res, next) =>{
        if (path.extname(req.path, next).length) {
            const err = new Error("Not found")
            err.status = 404;
            next(err)
        } 
        else 
        {
            next();
        }
    });

    //Send index.html
    app.use("*", (req, res) => {
        res.sendFile(path.join(__dirname, "..", "public/index.html"))
    });

    // Error handling endware
    app.use((err, req, res, next) => 
    {
        console.error(err);
        console.error(err.stack);
        res.status(err.status || 500).send(err.message || "Internal server error.");
    });

    
};

const startListening = () => {
    // Create a server object
    const server = app.listen(PORT, () => 
        console.log(`Listening on port ${PORT}`)
    );
    const io = socketio(server);
    require("./socket")(io, redisClient); // Ensure the path is correct and matches the actual file structure
};

async function bootApp() {
    await createApp();
    await startListening();
}

if (require.main === module) {
    bootApp();
}
else{
    createApp();
}
