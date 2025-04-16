import Phaser from "phaser";

export default class WaitingRoom extends Phaser.Scene {
  constructor() {
    super("WaitingRoom");
    this.state = {};
    this.hasBeenSet = false;
  }

  init(data) {
    this.socket = data.socket;
  }

  preload() {
    this.load.html("codeform", "assets/text/codeform.html");
    this.load.html("nameform", "assets/text/nameform.html"); // preload new name form
  }

  create() {
    const scene = this;

    scene.popUp = scene.add.graphics();
    scene.boxes = scene.add.graphics();

    // for popup window
    scene.popUp.lineStyle(1, 0xffffff);
    scene.popUp.fillStyle(0xffffff, 0.5);

    // for boxes
    scene.boxes.lineStyle(1, 0xffffff);
    scene.boxes.fillStyle(0xa9a9a9, 1);

    // popup window
    scene.popUp.strokeRect(25, 25, 750, 500);
    scene.popUp.fillRect(25, 25, 750, 500);

    //title
    scene.title = scene.add.text(100, 75, "Waiting Room", {
      fill: "#add8e6",
      fontSize: "66px",
      fontStyle: "bold",
    });

    //left popup
    scene.boxes.strokeRect(100, 200, 275, 100);
    scene.boxes.fillRect(100, 200, 275, 100);
    scene.requestButton = scene.add.text(140, 215, "Request Room Key", {
      fill: "#000000",
      fontSize: "20px",
      fontStyle: "bold",
    });

    //right popup
    scene.boxes.strokeRect(425, 200, 275, 100);
    scene.boxes.fillRect(425, 200, 275, 100);
    scene.inputElement = scene.add.dom(562.5, 250).createFromCache("codeform");
    scene.inputElement.addListener("submit"); // Change to "submit" for form submission
    scene.inputElement.on("submit", function (event) {
      event.preventDefault(); // Prevent default form submission behavior
      const input = scene.inputElement.getChildByName("code-form");

      if (input.value.trim()) {
        scene.socket.emit("isKeyValid", input.value.trim());
      }
    });

    scene.requestButton.setInteractive();
    scene.requestButton.on("pointerdown", () => {
      scene.socket.emit("getRoomCode");
    });

    scene.notValidText = scene.add.text(670, 295, "", {
      fill: "#ff0000",
      fontSize: "15px",
    });
    scene.roomKeyText = scene.add.text(210, 250, "", {
      fill: "#00ff00",
      fontSize: "20px",
      fontStyle: "bold",
    });

    scene.socket.on("roomCreated", function (roomKey) {
      scene.roomKey = roomKey;
      scene.roomKeyText.setText(scene.roomKey);
    });

    scene.socket.on("keyNotValid", function () {
      scene.notValidText.setText("Invalid Room Key");
    });

    // Instead of joining room directly, display a name prompt
    scene.socket.on("keyIsValid", function (input) {
      scene.roomKey = input;
      // Remove any previous error messages
      scene.notValidText.setText("");
      // Display the name entry form
      scene.nameElement = scene.add.dom(562.5, 350).createFromCache("nameform");
      scene.nameElement.addListener("submit");
      scene.nameElement.on("submit", function (event) {
        event.preventDefault();
        const nameInput = scene.nameElement.getChildByName("name-form");
        if (nameInput.value.trim()) {
          // Emit joinRoom with an object containing roomKey and the entered name
          scene.socket.emit("joinRoom", { roomKey: scene.roomKey, name: nameInput.value.trim() });
          scene.scene.stop("WaitingRoom");
        }
      });
    });
  }
  update() {}
}
