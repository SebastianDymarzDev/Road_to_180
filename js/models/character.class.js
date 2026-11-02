class Character extends MovableObject {
    static GROUND_Y = 450;
    speed = 4;
    jumpPower = 12;
    ducking = false;
    duckStep = 0;
    idleTick = 0;
    idleSlowdown = 4; // 4 x 125 ms = 500 ms pro Idle-Bild
    SLEEP_AFTER = 10000; // so viele ms ohne Taste, dann schläft die Figur
    sleepTick = 0;
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
    IMAGES_SLEEP = this.frames("player_sleep", "asleep", 3);

    constructor(keyboard) {
        super();
        this.keyboard = keyboard;
        this.y = Character.GROUND_Y;
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadAllImages();
        keyboard.lastInput = Date.now(); // Schlaf-Timer beginnt neu
        this.animate();
    }

    loadAllImages() {
        this.loadImages(this.IMAGES_IDLE, this.IMAGES_RUN, this.IMAGES_JUMP, this.IMAGES_DUCK, this.IMAGES_THROW,
            this.IMAGES_HIT, this.IMAGES_DIE, this.IMAGES_WIN, this.IMAGES_SLEEP);
    }

    frames(folder, name, count) {
        return MovableObject.framePaths(`img_small/character/player/${folder}`, name, count);
    }

    // Trefferbox der Figur (die Sprites haben viel transparenten Rand)
    getHitbox() {
        let h = this.ducking ? 90 : 135;
        return { x: this.x - 25, y: this.y - 4 - h, w: 50, h: h };
    }

    // true, wenn wirklich Schaden entstanden ist (nicht während der Unverwundbarkeit)
    takeDamage() {
        if (this.dead || this.won) return false;
        let now = Date.now();
        if (now < this.invulnerableUntil) return false;
        this.health = Math.max(0, this.health - 1);
        this.invulnerableUntil = now + 1000; // 1,0 Sekunden unverwundbar
        this.hurtUntil = now + 450;
        this.keyboard.lastInput = now; // ein Treffer weckt die Figur auf
        if (this.health === 0) this.die();
        return true;
    }

    // gemeinsam für Sieg und Tod: Musik und Schritte aus, nicht mehr verwundbar oder getroffen
    endRound() {
        Sound.stop("gameMusic");
        Sound.stop("walk");
        this.setSleeping(false);
        this.invulnerableUntil = 0; // kein Blinken mehr
        this.hurtUntil = 0;
    }

    win() {
        this.won = true;
        this.endRound();
        this.winStart = Date.now();
    }

    die() {
        this.dead = true;
        this.endRound();
        Sound.play("gameOver");
        this.deathStart = Date.now();
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
        this.moveInterval = setInterval(() => this.moveStep(), 1000 / 60); // Bewegung + Physik: 60x pro Sekunde
        this.animInterval = setInterval(() => this.animationStep(), 125);  // Animation: 8x pro Sekunde
    }

    // Tastatur, die gerade zählt (tot, gewonnen oder gesperrt = keine Eingabe)
    activeKeys() {
        return this.dead || this.won || this.locked ? Character.NO_KEYS : this.keyboard;
    }

    moveStep() {
        let k = this.activeKeys();
        this.ducking = k.is("DUCK") && !this.isInAir();
        this.handleThrowKey(k);
        this.handleChargeSound(k);
        this.walk(k);
        this.jumpAndFall(k);
        this.updateWalkSound(k);
    }

    handleThrowKey(k) {
        if (!k.is("THROW")) {
            this.throwKeyDown = false;
            return;
        }
        if (this.throwKeyDown) return;
        this.throwKeyDown = true; // nur der Tastendruck zählt, nicht das Halten
        if (this.throwing || this.ducking) return;
        this.throwDart(k.is("CHARGE") && this.darts >= this.maxDarts);
    }

    // starker Wurf aufgeladen: Sound einmal beim Drücken von Shift
    handleChargeSound(k) {
        let charging = k.is("CHARGE") && this.darts >= this.maxDarts;
        if (charging && !this.chargeSounded) Sound.play("charge");
        this.chargeSounded = charging;
    }

    walk(k) {
        if (!this.ducking) {
            if (k.is("RIGHT")) { this.x += this.speed; this.otherDirection = false; }
            if (k.is("LEFT")) { this.x -= this.speed; this.otherDirection = true; }
        }
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    }

    jumpAndFall(k) {
        if (k.is("JUMP") && !this.isInAir() && !this.ducking) {
            this.speedY = this.jumpPower;
            Sound.play("jump");
        }
        if (this.isInAir()) this.fall();
    }

    fall() {
        this.y -= this.speedY;
        this.speedY -= this.gravity;
        if (this.y < Character.GROUND_Y) return;
        this.y = Character.GROUND_Y;
        this.speedY = 0;
        Sound.play("land");
    }

    // Schritte: nur beim Laufen am Boden
    updateWalkSound(k) {
        let walking = !this.isInAir() && !this.ducking && (k.is("LEFT") || k.is("RIGHT"));
        if (walking === this.walkSounding) return;
        this.walkSounding = walking;
        if (walking) Sound.start("walk");
        else Sound.stop("walk");
    }

    animationStep() {
        let k = this.activeKeys();
        if (this.locked) this.keyboard.lastInput = Date.now(); // Sperre zählt nicht als Untätigkeit
        if (this.won) return this.animateWin();
        if (this.dead) return this.animateDeath();
        if (Date.now() < this.hurtUntil) return this.animateHurt();
        if (this.throwing) return this.setSleeping(false);
        if (!this.isInAir() && !this.ducking && this.shouldSleep(k)) return this.animateSleep();
        this.animateAwake(k);
        this.setSleeping(false);
    }

    // jubelt: wechselt alle 400 ms zwischen den beiden Siegbildern
    animateWin() {
        this.img = this.imageCache[this.frameLoop(this.IMAGES_WIN, Date.now() - this.winStart, 400)];
    }

    // erst stehend (lose_01), dann liegend (lose_02), bleibt liegen
    animateDeath() {
        this.img = this.imageCache[this.frameOnce(this.IMAGES_DIE, Date.now() - this.deathStart, 400)];
    }

    animateHurt() {
        this.setSleeping(false);
        this.playAnimation(this.IMAGES_HIT);
    }

    shouldSleep(k) {
        return !k.is("LEFT") && !k.is("RIGHT") && !this.locked && this.keyboard.idleTime() > this.SLEEP_AFTER;
    }

    // Bild 1 nur beim Einschlafen, danach wechseln Bild 2 und 3 alle 500 ms ab
    animateSleep() {
        this.duckStep = 0;
        this.setSleeping(true);
        let n = Math.floor(this.sleepTick / this.idleSlowdown);
        let i = n === 0 ? 0 : 1 + ((n - 1) % (this.IMAGES_SLEEP.length - 1));
        this.img = this.imageCache[this.IMAGES_SLEEP[i]];
        this.sleepTick++;
    }

    animateAwake(k) {
        if (this.isInAir()) {
            this.duckStep = 0;
            this.playAnimation(this.IMAGES_JUMP);
        } else if (this.ducking) {
            this.animateDuck();
        } else {
            this.duckStep = 0;
            this.animateGround(k);
        }
    }

    // Frame 1 einmal beim Hinunterducken, danach Frame 2 halten
    animateDuck() {
        let i = Math.min(this.duckStep, this.IMAGES_DUCK.length - 1);
        this.img = this.imageCache[this.IMAGES_DUCK[i]];
        this.duckStep++;
    }

    animateGround(k) {
        if (k.is("LEFT") || k.is("RIGHT")) {
            this.idleTick = 0;
            this.playAnimation(this.IMAGES_RUN);
            return;
        }
        if (this.idleTick % this.idleSlowdown === 0) this.playAnimation(this.IMAGES_IDLE);
        this.idleTick++;
    }

    // Schnarchen läuft nur, solange die Figur schläft
    setSleeping(sleeping) {
        if (sleeping === this.sleeping) return;
        this.sleeping = sleeping;
        this.sleepTick = 0;
        if (sleeping) Sound.start("snoring");
        else Sound.stop("snoring");
    }

    throwDart(strong) {
        this.throwing = true;
        if (strong) this.darts = 0;
        this.img = this.imageCache[this.IMAGES_THROW[0]];
        setTimeout(() => {
            if (this.dead || this.won) return;
            this.img = this.imageCache[this.IMAGES_THROW[1]];
            let dir = this.otherDirection ? -1 : 1;
            Sound.play("throw");
            if (this.onThrow) this.onThrow(this.x + dir * 45, this.y - 115, this.otherDirection, strong);
        }, 150);
        setTimeout(() => (this.throwing = false), 400);
    }

    stop() {
        Sound.stop("walk");
        Sound.stop("snoring");
        clearInterval(this.moveInterval);
        clearInterval(this.animInterval);
    }
}