import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
        this.state = {};
    }

    preload() {
        this.load.spritesheet("bubble", "assets/sprites/bubble.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        this.load.image("mainroom", "assets/backgrounds/mainroom.png");
    }

    addPlayer(scene, playerInfo)
    {
        scene.joined = true;
        scene.bubble = scene.physics.add
        .sprite(playerInfo.x, playerInfo.y, "bubble")
    }

    addOtherPlayers(scene, playerInfo)
    {
        const otherPlayer = scene.add.sprite(
            playerInfo.x + 40,
            playerInfo.y + 40,
            "bubble"
        );
        otherPlayer.playerId = playerInfo.playerId;
        scene.otherPlayer.add(otherPlayer);
    }
    
    create() {
        const scene = this;
        this.cameras.main.setZoom(4); // 4x zoom
        this.cameras.main.setBounds(0, 0, 200, 100);
        
        this.add.image(100,50, "mainroom");

        this.socket = io();

        scene.scene.launch("WaitingRoom", { socket: scene.socket });

        this.otherPlayers = this.physics.add.group();

        this.socket.on("setState", function (state) {
            const { roomKey, players, numPlayers } = state;
            scene.physics.resume();

            scene.state.roomKey = roomKey;
            scene.state.players = players;
            scene.state.numPlayers = numPlayers;


        });

        this.socket.on("currentPlayers", function (arg) {
            const { players, numPlayers } = arg;
            scene.state.numPlayers = numPlayers;
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === scene.socket,id) {
                    scene.addPlayer(scene, players[id]);
                }
                else
                {
                    scene.addOtherPlayers(scene, players[id]);
                }
            });
        });  

        this.socket.on("newPlayer", function (arg) {
            const { playerInfo, numPlayers } = arg;
            scene.addOtherPlayers(scene, playerInfo);
            scene.state.numPlayers = numPlayers;
        })
    }

    update() {

        
    }
}