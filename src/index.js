/** @type {import("../typings/phaser")} */

import "phaser";
import config from "./config/config";
import WaitingRoom from "./scenes/WaitingRoom";
import MainScene from "./scenes/Mainscene";

class Game extends Phaser.Game {
    constructor() {
        //Add the config file to the game
        super(config);

        this.scene.add("MainScene", MainScene);
        this.scene.add("WaitingRoom", WaitingRoom);
        this.scene.start("MainScene");
    }
}

window.onload = function() {
    window.game = new Game();
};