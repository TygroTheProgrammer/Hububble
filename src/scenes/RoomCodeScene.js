import Phaser from "phaser";

export default class RoomCodeScene extends Phaser.Scene {
    constructor() {
        super("RoomCodeScene");
    }

    init(data) {
        this.roomKey = data.roomKey;
    }

    create() {
        const cam = this.cameras.main;
        this.add.text(cam.width - 10, cam.height - 10, `Room: ${this.roomKey}`, {
            fontSize: '12px',
            fill: '#000000'
        })
        .setOrigin(1, 1)
        .setScrollFactor(0);
    }
}
