class Character extends MovableObject {
    static GROUND_Y = 450;
    speed = 4;
    jumpPower = 12;
    ducking = false;
    duckStep = 0;
    idleTick = 0;
    idleSlowdown = 4; // 4 x 125 ms = 500 ms pro Idle-Bild
    throwing = false;
    onThrow = null; // wird von World gesetzt

    IMAGES_THROW = this.frames("player_throw", "throw", 2);
    IMAGES_IDLE = this.frames("player_idle", "idle", 4);
    IMAGES_RUN = this.frames("player_run", "run", 4);
    IMAGES_JUMP = this.frames("player_jump", "jump", 4);
    IMAGES_DUCK = this.frames("player_duck", "duck", 2);

    constructor(keyboard) {
        super();
        this.keyboard = keyboard;
        this.x = 120;
        this.y = Character.GROUND_Y;
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadImages(this.IMAGES_IDLE);
        this.loadImages(this.IMAGES_RUN);
        this.loadImages(this.IMAGES_JUMP);
        this.loadImages(this.IMAGES_DUCK);
        this.loadImages(this.IMAGES_THROW);
        this.animate();
    }

    frames(folder, name, count) {
        let list = [];
        for (let i = 1; i <= count; i++) {
            list.push(`img_small/character/player/${folder}/${name}_0${i}.webp`);
        }
        return list;
    }

    isInAir() {
        return this.y < Character.GROUND_Y || this.speedY > 0;
    }

    animate() {
        // Bewegung + Physik: 60x pro Sekunde
        this.moveInterval = setInterval(() => {
            let k = this.keyboard;
            this.ducking = k.is("DUCK") && !this.isInAir();
            if (k.is("THROW") && !this.throwing && !this.ducking) this.throwDart();

            if (!this.ducking) {
                if (k.is("RIGHT")) { this.x += this.speed; this.otherDirection = false; }
                if (k.is("LEFT")) { this.x -= this.speed; this.otherDirection = true; }
            }
            this.x = Math.max(40, Math.min(World.LEVEL_WIDTH - 40, this.x));

            if (k.is("JUMP") && !this.isInAir() && !this.ducking) {
                this.speedY = this.jumpPower;
            }
            if (this.isInAir()) {
                this.y -= this.speedY;
                this.speedY -= this.gravity;
                if (this.y >= Character.GROUND_Y) {
                    this.y = Character.GROUND_Y;
                    this.speedY = 0;
                }
            }
        }, 1000 / 60);

        // Animation: 8x pro Sekunde
        this.animInterval = setInterval(() => {
            let k = this.keyboard;
            if (this.throwing) return;
            if (this.isInAir()) {
                this.duckStep = 0;
                this.playAnimation(this.IMAGES_JUMP);
            } else if (this.ducking) {
                // Frame 1 einmal beim Hinunterducken, danach Frame 2 halten
                let i = Math.min(this.duckStep, this.IMAGES_DUCK.length - 1);
                this.img = this.imageCache[this.IMAGES_DUCK[i]];
                this.duckStep++;
            } else {
                this.duckStep = 0;
                if (k.is("LEFT") || k.is("RIGHT")) {
                    this.idleTick = 0;
                    this.playAnimation(this.IMAGES_RUN);
                } else {
                    if (this.idleTick % this.idleSlowdown === 0) this.playAnimation(this.IMAGES_IDLE);
                    this.idleTick++;
                }
            }
        }, 125);
    }

    throwDart() {
        this.throwing = true;
        this.img = this.imageCache[this.IMAGES_THROW[0]];
        setTimeout(() => {
            this.img = this.imageCache[this.IMAGES_THROW[1]];
            let dir = this.otherDirection ? -1 : 1;
            if (this.onThrow) this.onThrow(this.x + dir * 45, this.y - 115, this.otherDirection);
        }, 150);
        setTimeout(() => (this.throwing = false), 400);
    }

    stop() {
        clearInterval(this.moveInterval);
        clearInterval(this.animInterval);
    }
}