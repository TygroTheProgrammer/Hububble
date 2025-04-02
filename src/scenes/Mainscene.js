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
                if (players[id].playerId === scene.socket.id) {
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
        });

        this.socket.on("playerMoved", function (playerInfo) {
            scene.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    const oldX = otherPlayer.x;
                    const oldY = otherPlayer.y;
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                }
            });
        });
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        const scene = this;

        if (this.bubble) {
          const speed = 50;
          const prevVelocity = this.bubble.body.velocity.clone();
    
          this.bubble.body.setVelocity(0);
    
          if(this.cursors.left.isDown) {
            this.bubble.body.setVelocityX(-speed);
          } else if (this.cursors.right.isDown) {
            this.bubble.body.setVelocityX(speed);
          }
    
          if (this.cursors.up.isDown) {
            this.bubble.body.setVelocityY(-speed);
          }
          else if (this.cursors.down.isDown) {
            this.bubble.body.setVelocityY(speed);
          }
    
          this.bubble.body.velocity.normalize().scale(speed);
    
          var x = this.bubble.x;
          var y = this.bubble.y;
    
          if (this.bubble.oldPosition && 
            (x != this.bubble.oldPosition.x || 
            y != this.bubble.oldPosition.y))
            {
              this.moving = true;
              this.socket.emit("playerMovement", {
                x: this.bubble.x,
                y: this.bubble.y,
                roomKey: scene.state.roomKey,
              });
            }
            this.bubble.oldPosition = {
              x: this.bubble.x,
              y: this.bubble.y,
              rotation: this.bubble.rotation,
            };

        }
        
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
            playerInfo.x,
            playerInfo.y,
            "bubble"
        );
        otherPlayer.playerId = playerInfo.playerId;
        scene.otherPlayers.add(otherPlayer);
    }
    
    

    
}