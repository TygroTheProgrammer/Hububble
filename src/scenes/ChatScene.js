import Phaser from "phaser";

export default class ChatScene extends Phaser.Scene {
    constructor() {
        super("ChatScene");
    }

    init(data) {
        this.socket = data.socket;
        this.roomKey = data.roomKey;
        this.mainCamera = data.mainCamera; // Reference to the main camera
    }

    create() {
        // Create a container for the chat UI
        this.chatContainer = this.add.dom(0, 0).createFromHTML(`
            <div id="chat-container" style="
                width: 300px; 
                height: 200px; 
                overflow-y: auto; 
                background-color: rgba(34, 34, 34, 0.8); 
                color: #fff; 
                padding: 10px; 
                border-radius: 10px; 
                font-size: 14px; 
                position: absolute; 
                display: flex; 
                flex-direction: column-reverse;
                border: 1px solid rgba(255, 255, 255, 0.2);
            "></div>
        `);

        // Create the input box for sending messages
        this.chatInput = this.add.dom(0, 0).createFromHTML(`
            <input type="text" id="chat-input" placeholder="Type a message..." style="
                width: 300px; 
                padding: 8px; 
                border-radius: 10px; 
                border: 1px solid rgba(255, 255, 255, 0.2); 
                background-color: rgba(34, 34, 34, 0.9); 
                color: #fff; 
                font-size: 14px; 
                outline: none;
                position: absolute;
            " />
        `);

        // Handle message sending and stop Phaser from intercepting the space key
        this.chatInput.addListener("keydown");
        this.chatInput.on("keydown", (event) => {
            event.stopPropagation();  // Prevent Phaser from capturing the key event
            if (event.key === "Enter") {
                event.preventDefault();
                const inputElement = document.getElementById("chat-input");
                const message = inputElement.value;
                if (message.trim()) {
                    this.socket.emit("chatMessage", {
                        roomKey: this.roomKey,
                        message,
                        playerId: this.socket.id,
                    });
                    inputElement.value = "";
                }
            }
        });

        // Listen for new chat messages
        this.socket.on("chatMessage", (data) => {
            const { displayName, message } = data;
            const chatContainerElement = document.getElementById("chat-container");
            if (chatContainerElement) {
                const newMessage = document.createElement("div");
                newMessage.innerHTML = `<strong>${displayName}:</strong> ${message}`;
                chatContainerElement.prepend(newMessage); // Add new messages at the bottom
            }
        });

        // Fetch chat log
        this.socket.emit("fetchChatLog", this.roomKey);
        this.socket.on("chatLog", (chatLog) => {
            const chatContainerElement = document.getElementById("chat-container");
            if (chatContainerElement) {
                chatLog.reverse().forEach(({ playerId, message }) => {
                    const logMessage = document.createElement("div");
                    logMessage.innerHTML = `<strong>${playerId}:</strong> ${message}`;
                    chatContainerElement.appendChild(logMessage); // Append older messages
                });
            }
        });
    }

    update() {
        // Position the chat UI relative to the camera in the upper-left corner
        const cameraX = this.mainCamera.scrollX; // Offset from the left
        const cameraY = this.mainCamera.scrollY; // Offset from the top

        this.chatContainer.setPosition(cameraX + 300, cameraY + 200);
        this.chatInput.setPosition(cameraX + 293, cameraY + 465); // Position input below the chat container
    }
}
