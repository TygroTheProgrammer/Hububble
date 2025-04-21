/** @type {import("../typings/phaser")} */

import Phaser from "phaser";
// set default font for all Phaser Text objects
Phaser.GameObjects.TextStyle.DEFAULT_FONT_FAMILY = 'pixel';

import config from "./config/config";
import WaitingRoom from "./scenes/WaitingRoom";
import MainScene from "./scenes/Mainscene";
import ChatScene from "./scenes/ChatScene";
import RoomCodeScene from "./scenes/RoomCodeScene";

class Game extends Phaser.Game {
    constructor() {
        super(config);
        this.scene.add("MainScene", MainScene);
        this.scene.add("WaitingRoom", WaitingRoom);
        this.scene.add("ChatScene", ChatScene);
        this.scene.add("RoomCodeScene", RoomCodeScene);
        this.scene.start("MainScene");
    }
}

window.onload = function() {
    window.game = new Game();
};