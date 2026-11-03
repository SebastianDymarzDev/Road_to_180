/**
 * The player character: walking, jumping, ducking, throwing, charging, sleeping, health and animations.
 */
class Character extends MovableObject {
    static GROUND_Y = 450;
    speed = 4;
    jumpPower = 12;
    ducking = false;
    duckStep = 0;
    idleTick = 0;
    idleSlowdown = 4;
    SLEEP_AFTER = 10000;
    sleepTick = 0;
    throwing = false;
    charged = false;
    maxHealth = 5;
    health = 5;
    maxDarts = 5;
    darts = 0;
    coins = 0;
    invulnerableUntil = 0;
    hurtUntil = 0;
    dead = false;
    won = false;
    locked = false;
    winStart = 0;
    minX = 40;
    maxX = World.LEVEL_WIDTH - 40;
    deathStart = 0;
    static NO_KEYS = { is: () => false };
    onThrow = null;

    IMAGES_THROW = this.frames("player_throw", "throw", 2);
    IMAGES_IDLE = this.frames("player_idle", "idle", 4);
    IMAGES_RUN = this.frames("player_run", "run", 4);
    IMAGES_JUMP = this.frames("player_jump", "jump", 4);
    IMAGES_DUCK = this.frames("player_duck", "duck", 2);
    IMAGES_HIT = this.frames("player_hit", "hit", 2);
    IMAGES_DIE = this.frames("player_die", "lose", 2);
    IMAGES_WIN = this.frames("player_win", "win", 2);
    IMAGES_SLEEP = this.frames("player_sleep", "asleep", 3);

    /**
     * @param {Keyboard} keyboard - Input that controls the character.
     */
    constructor(keyboard) {
        super();
        this.keyboard = keyboard;
        this.y = Character.GROUND_Y;
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadAllImages();
        keyboard.lastInput = Date.now();
        this.animate();
    }

    /**
     * Loads all animation images of the character.
     */
    loadAllImages() {
        this.loadImages(this.IMAGES_IDLE, this.IMAGES_RUN, this.IMAGES_JUMP, this.IMAGES_DUCK, this.IMAGES_THROW,
            this.IMAGES_HIT, this.IMAGES_DIE, this.IMAGES_WIN, this.IMAGES_SLEEP);
    }

    /**
     * Creates the paths of the character animation images.
     * @param {string} folder - Subfolder of the animation.
     * @param {string} name - File name without number and extension.
     * @param {number} count - Number of images.
     * @returns {string[]} List of image paths.
     */
    frames(folder, name, count) {
        return MovableObject.framePaths(`img_small/character/player/${folder}`, name, count);
    }

    /**
     * Returns the hit area. It is lower while ducking.
     * @returns {{x: number, y: number, w: number, h: number}} Rectangle in world coordinates.
     */
    getHitbox() {
        let h = this.ducking ? 90 : 135;
        return { x: this.x - 25, y: this.y - 4 - h, w: 50, h: h };
    }

    /**
     * Removes one life unless the character is dead, has won or is briefly invulnerable.
     * @returns {boolean} true if damage was taken.
     */
    takeDamage() {
        if (this.dead || this.won) return false;
        let now = Date.now();
        if (now < this.invulnerableUntil) return false;
        this.health = Math.max(0, this.health - 1);
        this.invulnerableUntil = now + 1000;
        this.hurtUntil = now + 450;
        this.keyboard.lastInput = now;
        if (this.health === 0) this.die();
        return true;
    }

    /**
     * Shared by win and death: music and footsteps off, no longer invulnerable or hurt.
     */
    endRound() {
        Sound.stop("gameMusic");
        Sound.stop("walk");
        this.setSleeping(false);
        this.invulnerableUntil = 0;
        this.hurtUntil = 0;
    }

    /**
     * Makes the character win.
     */
    win() {
        this.won = true;
        this.endRound();
        this.winStart = Date.now();
    }

    /**
     * Makes the character die.
     */
    die() {
        this.dead = true;
        this.endRound();
        Sound.play("gameOver");
        this.deathStart = Date.now();
    }

    /**
     * Small hop after jumping on an enemy.
     */
    bounce() {
        this.speedY = 8;
    }

    /**
     * Draws the character. It blinks after a hit and glows while the throw is charged.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    draw(ctx) {
        let blink = Date.now() < this.invulnerableUntil && Math.floor(Date.now() / 100) % 2 === 0;
        ctx.save();
        if (blink) ctx.globalAlpha = 0.4;
        if (this.charged) this.glow(ctx, MovableObject.CHARGE_GLOW, 16 + Math.sin(Date.now() / 120) * 8);
        super.draw(ctx);
        ctx.restore();
    }

    /**
     * Checks whether the character is in the air.
     * @returns {boolean} true if it is not standing on the ground.
     */
    isInAir() {
        return this.y < Character.GROUND_Y || this.speedY > 0;
    }

    /**
     * Starts the timers for movement (60 times per second) and animation (every 125 ms).
     */
    animate() {
        this.moveInterval = setInterval(() => this.moveStep(), 1000 / 60);
        this.animInterval = setInterval(() => this.animationStep(), 125);
    }

    /**
     * Returns the input that currently applies. Dead, won or locked means no input.
     * @returns {Keyboard|{is: function(): boolean}} The keyboard or a replacement without pressed keys.
     */
    activeKeys() {
        return this.dead || this.won || this.locked ? Character.NO_KEYS : this.keyboard;
    }

    /**
     * One movement step: ducking, charging, throwing, walking, jumping and walking sound.
     */
    moveStep() {
        let k = this.activeKeys();
        this.ducking = k.is("DUCK") && !this.isInAir();
        this.handleCharge(k);
        this.handleThrowKey(k);
        this.walk(k);
        this.jumpAndFall(k);
        this.updateWalkSound(k);
    }

    /**
     * Throws one dart per key press (a held key does not throw again).
     * @param {Keyboard|object} k - Active input.
     */
    handleThrowKey(k) {
        if (!k.is("THROW")) {
            this.throwKeyDown = false;
            return;
        }
        if (this.throwKeyDown) return;
        this.throwKeyDown = true;
        if (this.throwing || this.ducking) return;
        this.throwDart(this.charged);
    }

    /**
     * Charges the throw with a single key press when all darts are collected.
     * @param {Keyboard|object} k - Active input.
     */
    handleCharge(k) {
        let pressed = this.keyboard.wasPressed("CHARGE");
        if (k !== this.keyboard || !pressed || this.charged || this.darts < this.maxDarts) return;
        this.charged = true;
        Sound.play("charge");
    }

    /**
     * Walks left or right and keeps the character within the allowed area.
     * @param {Keyboard|object} k - Active input.
     */
    walk(k) {
        if (!this.ducking) {
            if (k.is("RIGHT")) { this.x += this.speed; this.otherDirection = false; }
            if (k.is("LEFT")) { this.x -= this.speed; this.otherDirection = true; }
        }
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    }

    /**
     * Jumps from the ground when the key is pressed and lets the character fall in the air.
     * @param {Keyboard|object} k - Active input.
     */
    jumpAndFall(k) {
        if (k.is("JUMP") && !this.isInAir() && !this.ducking) {
            this.speedY = this.jumpPower;
            Sound.play("jump");
        }
        if (this.isInAir()) this.fall();
    }

    /**
     * One step in the air: the character falls and lands on the ground.
     */
    fall() {
        this.y -= this.speedY;
        this.speedY -= this.gravity;
        if (this.y < Character.GROUND_Y) return;
        this.y = Character.GROUND_Y;
        this.speedY = 0;
        Sound.play("land");
    }

    /**
     * Starts or stops the walking sound while the character walks on the ground.
     * @param {Keyboard|object} k - Active input.
     */
    updateWalkSound(k) {
        let walking = !this.isInAir() && !this.ducking && (k.is("LEFT") || k.is("RIGHT"));
        if (walking === this.walkSounding) return;
        this.walkSounding = walking;
        if (walking) Sound.start("walk");
        else Sound.stop("walk");
    }

    /**
     * One animation step: chooses the matching animation for the current state.
     */
    animationStep() {
        let k = this.activeKeys();
        if (this.locked) this.keyboard.lastInput = Date.now();
        if (this.won) return this.animateWin();
        if (this.dead) return this.animateDeath();
        if (Date.now() < this.hurtUntil) return this.animateHurt();
        if (this.throwing) return this.setSleeping(false);
        if (!this.isInAir() && !this.ducking && this.shouldSleep(k)) return this.animateSleep();
        this.animateAwake(k);
        this.setSleeping(false);
    }

    /**
     * Plays the win animation in a loop.
     */
    animateWin() {
        this.img = this.imageCache[this.frameLoop(this.IMAGES_WIN, Date.now() - this.winStart, 400)];
    }

    /**
     * Plays the death animation once.
     */
    animateDeath() {
        this.img = this.imageCache[this.frameOnce(this.IMAGES_DIE, Date.now() - this.deathStart, 400)];
    }

    /**
     * Plays the animation after a hit.
     */
    animateHurt() {
        this.setSleeping(false);
        this.playAnimation(this.IMAGES_HIT);
    }

    /**
     * Checks whether the character should fall asleep (stands still without input for a long time).
     * @param {Keyboard|object} k - Active input.
     * @returns {boolean} true if it should sleep.
     */
    shouldSleep(k) {
        return !k.is("LEFT") && !k.is("RIGHT") && !this.locked && this.keyboard.idleTime() > this.SLEEP_AFTER;
    }

    /**
     * Plays the sleep animation and starts the snoring.
     */
    animateSleep() {
        this.duckStep = 0;
        this.setSleeping(true);
        let n = Math.floor(this.sleepTick / this.idleSlowdown);
        let i = n === 0 ? 0 : 1 + ((n - 1) % (this.IMAGES_SLEEP.length - 1));
        this.img = this.imageCache[this.IMAGES_SLEEP[i]];
        this.sleepTick++;
    }

    /**
     * Plays the animation of the awake character: jump, duck or ground.
     * @param {Keyboard|object} k - Active input.
     */
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

    /**
     * Plays the duck animation. It stays on the last image.
     */
    animateDuck() {
        let i = Math.min(this.duckStep, this.IMAGES_DUCK.length - 1);
        this.img = this.imageCache[this.IMAGES_DUCK[i]];
        this.duckStep++;
    }

    /**
     * Plays running or (slowed down) waiting on the ground.
     * @param {Keyboard|object} k - Active input.
     */
    animateGround(k) {
        if (k.is("LEFT") || k.is("RIGHT")) {
            this.idleTick = 0;
            this.playAnimation(this.IMAGES_RUN);
            return;
        }
        if (this.idleTick % this.idleSlowdown === 0) this.playAnimation(this.IMAGES_IDLE);
        this.idleTick++;
    }

    /**
     * Sets the sleep state and starts or stops the snoring.
     * @param {boolean} sleeping - true if the character is asleep.
     */
    setSleeping(sleeping) {
        if (sleeping === this.sleeping) return;
        this.sleeping = sleeping;
        this.sleepTick = 0;
        if (sleeping) Sound.start("snoring");
        else Sound.stop("snoring");
    }

    /**
     * Throws a dart. A charged throw uses up all darts and the charge.
     * @param {boolean} strong - true for a charged throw.
     */
    throwDart(strong) {
        this.throwing = true;
        if (strong) { this.darts = 0; this.charged = false; }
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

    /**
     * Stops the timers and sounds of the character.
     */
    stop() {
        Sound.stop("walk");
        Sound.stop("snoring");
        clearInterval(this.moveInterval);
        clearInterval(this.animInterval);
    }
}
