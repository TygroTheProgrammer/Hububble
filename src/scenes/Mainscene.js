import Phaser from "phaser";

export default class MainScene extends Phaser.
Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        this.load.spritesheet("lilguy", "assets/sprites/lilguy1-Sheet.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        this.load.image("mainroom", "assets/backgrounds/mainroom.png");
    }

    create() {
        const scene = this;
        this.add.image(0,0, "mainroom").setOrigin(0);

        this.socket = io();

        scene.scene.launch("WaitingRoom", { socket : scene.socket });
    }
    update() {}
}