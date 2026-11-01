class Character extends MovableObject {
    static GROUND_Y = 450;
    speed = 4;
    jumpPower = 12;
    ducking = false;
    duckStep = 0;
    idleTick = 0;
    idleSlowdown = 4; // 4 x 125 ms = 500 ms pro Idle-Bild
    throwing = false;
    maxHealth = 5;
    health = 5;
    maxDarts = 5;
    darts = 0;
    coins = 0;
    invulnerableUntil = 0; // bis dahin kein Schaden
    hurtUntil = 0;         // bis dahin Hit-Animation
    dead = false;
    won = false;
    locked = false;   // gesperrt, z.B. während der Boss-Einblendung
    winStart = 0;
    minX = 40;                          // linke Grenze (in der Boss-Arena enger)
    maxX = World.LEVEL_WIDTH - 40;      // rechte Grenze
    deathStart = 0;
    static NO_KEYS = { is: () => false }; // Tastatur, wenn die Figur tot ist
    onThrow = null; // wird von World gesetzt

    IMAGES_THROW = this.frames("player_throw", "throw", 2);
    IMAGES_IDLE = this.frames("player_idle", "idle", 4);
    IMAGES_RUN = this.frames("player_run", "run", 4);
    IMAGES_JUMP = this.frames("player_jump", "jump", 4);
    IMAGES_DUCK = this.frames("player_duck", "duck", 2);
    IMAGES_HIT = this.frames("player_hit", "hit", 2);
    IMAGES_DIE = this.frames("player_die", "lose", 2);
    IMAGES_WIN = this.frames("player_win", "win", 2);

    constructor(keyboard) {
        super();
        this.keyboard = keyboard;
        this.y = Character.GROUND_Y;
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadImages(this.IMAGES_IDLE);
        this.loadImages(this.IMAGES_RUN);
        this.loadImages(this.IMAGES_JUMP);
        this.loadImages(this.IMAGES_DUCK);
        this.loadImages(this.IMAGES_THROW);
        this.loadImages(this.IMAGES_HIT);
        this.loadImages(this.IMAGES_DIE);
        this.loadImages(this.IMAGES_WIN);
        this.animate();
    }

    frames(folder, name, count) {
        let list = [];
        for (let i = 1; i <= count; i++) {
            list.push(`img_small/character/player/${folder}/${name}_0${i}.webp`);
        }
        return list;
    }

    // Trefferbox der Figur (die Sprites haben viel transparenten Rand)
    getHitbox() {
        let h = this.ducking ? 90 : 135;
        return { x: this.x - 25, y: this.y - 4 - h, w: 50, h: h };
    }

    takeDamage() {
        if (this.dead || this.won) return;
        let now = Date.now();
        if (now < this.invulnerableUntil) return;
        this.health = Math.max(0, this.health - 1);
        this.invulnerableUntil = now + 1000; // 1,0 Sekunden unverwundbar
        this.hurtUntil = now + 450;
        if (this.health === 0) this.die();
    }

    win() {
        this.won = true;
        this.winStart = Date.now();
        this.invulnerableUntil = 0;
        this.hurtUntil = 0;
    }

    die() {
        this.dead = true;
        this.deathStart = Date.now();
        this.invulnerableUntil = 0; // kein Blinken mehr
        this.hurtUntil = 0;
    }

    // kleiner Hüpfer nach einem Sprung auf einen Gegner
    bounce() {
        this.speedY = 8;
    }

    // blinkt, solange die Figur unverwundbar ist
    draw(ctx) {
        let blink = Date.now() < this.invulnerableUntil && Math.floor(Date.now() / 100) % 2 === 0;
        ctx.save();
        if (blink) ctx.globalAlpha = 0.4;
        super.draw(ctx);
        ctx.restore();
    }

    isInAir() {
        return this.y < Character.GROUND_Y || this.speedY > 0;
    }

    animate() {
        // Bewegung + Physik: 60x pro Sekunde
        this.moveInterval = setInterval(() => {
            let k = this.dead || this.won || this.locked ? Character.NO_KEYS : this.keyboard;
            this.ducking = k.is("DUCK") && !this.isInAir();
            if (k.is("THROW")) {
                if (!this.throwKeyDown) {
                    this.throwKeyDown = true; // nur der Tastendruck zählt, nicht das Halten
                    if (!this.throwing && !this.ducking) {
                        let strong = k.is("CHARGE") && this.darts >= this.maxDarts;
                        this.throwDart(strong);
                    }
                }
            } else {
                this.throwKeyDown = false;
            }

            if (!this.ducking) {
                if (k.is("RIGHT")) { this.x += this.speed; this.otherDirection = false; }
                if (k.is("LEFT")) { this.x -= this.speed; this.otherDirection = true; }
            }
            this.x = Math.max(this.minX, Math.min(this.maxX, this.x));

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
            let k = this.dead || this.won || this.locked ? Character.NO_KEYS : this.keyboard;
            if (this.won) {
                // jubelt: wechselt alle 400 ms zwischen den beiden Siegbildern
                let i = Math.floor((Date.now() - this.winStart) / 400) % this.IMAGES_WIN.length;
                this.img = this.imageCache[this.IMAGES_WIN[i]];
                return;
            }
            if (this.dead) {
                // erst stehend (lose_01), dann liegend (lose_02), bleibt liegen
                let i = Math.min(this.IMAGES_DIE.length - 1, Math.floor((Date.now() - this.deathStart) / 400));
                this.img = this.imageCache[this.IMAGES_DIE[i]];
                return;
            }
            if (Date.now() < this.hurtUntil) {
                this.playAnimation(this.IMAGES_HIT);
                return;
            }
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

    throwDart(strong) {
        this.throwing = true;
        if (strong) this.darts = 0;
        this.img = this.imageCache[this.IMAGES_THROW[0]];
        setTimeout(() => {
            if (this.dead || this.won) return;
            this.img = this.imageCache[this.IMAGES_THROW[1]];
            let dir = this.otherDirection ? -1 : 1;
            if (this.onThrow) this.onThrow(this.x + dir * 45, this.y - 115, this.otherDirection, strong);
        }, 150);
        setTimeout(() => (this.throwing = false), 400);
    }

    stop() {
        clearInterval(this.moveInterval);
        clearInterval(this.animInterval);
    }
}