/**
 * End boss of a level. Throws projectiles at intervals, gets angry at low health and is briefly invulnerable after a hit. The values come from levels.js.
 */
class Endboss extends MovableObject {
    angryBelow = 2;
    throwPause = 2500;
    idleFrameTime = 700;
    angryThrowPause = 1500;
    active = false;
    dead = false;
    state = "idle";
    stateStart = 0;
    nextThrow = 0;
    thrown = false;
    invulnerableUntil = 0;
    INVULNERABLE_TIME = 1000;
    SHOT_GAP = 250;
    onThrow = null;

    /**
     * @param {number} x - Position in world coordinates.
     * @param {object} cfg - Boss settings from levels.js.
     */
    constructor(x, cfg) {
        super();
        this.cfg = cfg;
        this.scale = cfg.scale;
        this.maxHealth = cfg.health;
        this.health = cfg.health;
        this.readAnger(cfg);
        this.x = x;
        this.y = Character.GROUND_Y;
        this.loadAllImages();
    }

    /**
     * Reads from the settings when the boss gets angry and how long the throw pauses are.
     * @param {object} cfg - Boss settings from levels.js.
     */
    readAnger(cfg) {
        this.angryBelow = cfg.angryBelow || 2;
        this.angryAt = cfg.angryAt || [this.angryBelow];
        this.pauses = cfg.pauses || [this.throwPause, this.angryThrowPause];
        this.angryFrames = cfg.angryFrames || [];
    }

    /**
     * Loads all images of the boss.
     */
    loadAllImages() {
        let frames = this.cfg.frames;
        this.IMAGES_IDLE = this.paths("idle", "idle", frames.idle);
        this.IMAGES_ANGRY = this.paths("angry", "angry", frames.angry);
        this.IMAGES_THROW = this.paths("throw", this.cfg.throwName, frames.throw);
        this.IMAGES_HIT = this.paths("hit", "hit", frames.hit);
        this.IMAGES_DIE = this.paths("die", "die", frames.die);
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadImages(this.IMAGES_IDLE, this.IMAGES_ANGRY, this.IMAGES_THROW, this.IMAGES_HIT, this.IMAGES_DIE);
    }

    /**
     * Creates the paths of the boss images.
     * @param {string} folder - Subfolder (idle, angry, throw, hit, die).
     * @param {string} name - File name without boss prefix, number and extension.
     * @param {number} count - Number of images.
     * @returns {string[]} List of image paths.
     */
    paths(folder, name, count) {
        let prefix = `img_small/character/enemies/endboss/${this.cfg.folder}/${folder}`;
        return MovableObject.framePaths(prefix, `${this.cfg.prefix}_${name}`, count);
    }

    /**
     * Returns the image path of the projectile.
     * @returns {string} Path to the image.
     */
    projectilePath() {
        return `img_small/character/enemies/endboss/${this.cfg.folder}/projectile/${this.cfg.projectile}.webp`;
    }

    /**
     * Returns the anger level based on the remaining health.
     * @returns {number} 0 = calm, greater than 0 = angry (higher number = angrier).
     */
    phase() {
        return this.angryAt.filter((threshold) => this.health <= threshold).length;
    }

    /**
     * Checks whether the boss is angry.
     * @returns {boolean} true if angry.
     */
    isAngry() {
        return this.phase() > 0;
    }

    /**
     * Starts the fight. The first throw follows after 1.5 seconds.
     */
    start() {
        this.active = true;
        this.nextThrow = Date.now() + 1500;
    }

    /**
     * Changes the state and remembers the time.
     * @param {"idle"|"hit"|"throw"|"die"} state - New state.
     */
    setState(state) {
        this.state = state;
        this.stateStart = Date.now();
    }

    /**
     * Handles a hit. The boss is briefly invulnerable afterwards. At 0 health it dies.
     * @param {number} damage - Damage of the hit.
     */
    hit(damage) {
        if (!this.active || this.dead || this.isInvulnerable()) return;
        this.invulnerableUntil = Date.now() + this.INVULNERABLE_TIME;
        this.health = Math.max(0, this.health - damage);
        if (this.health === 0) {
            this.dead = true;
            this.setState("die");
        } else if (this.state === "idle") {
            this.setState("hit");
        }
    }

    /**
     * Checks whether the boss is currently invulnerable.
     * @returns {boolean} true if hits have no effect.
     */
    isInvulnerable() {
        return Date.now() < this.invulnerableUntil;
    }

    /**
     * One step: throws after the throw pause and ends the hit state.
     */
    update() {
        if (!this.active || this.dead) return;
        let now = Date.now();
        let elapsed = now - this.stateStart;
        if (this.state !== "throw" && now >= this.nextThrow) {
            this.setState("throw");
            this.thrown = false;
        } else if (this.state === "throw") {
            this.updateThrow(elapsed);
        } else if (this.state === "hit" && elapsed >= 450) {
            this.setState("idle");
        }
    }

    /**
     * Performs the throw and ends it with a pause that matches the anger level.
     * @param {number} elapsed - Time since the start of the throw in ms.
     */
    updateThrow(elapsed) {
    if (!this.thrown && elapsed >= 100) {
        this.thrown = true;
        this.fireVolley();
    }
    if (elapsed >= 450) this.endState(this.pauses[Math.min(this.phase(), this.pauses.length - 1)]);
}

/**
 * Throws one projectile more per anger level (1, 2 or 3), one after another.
 */
fireVolley() {
    for (let shot = 0; shot <= this.phase(); shot++) {
        setTimeout(() => this.fireShot(), shot * this.SHOT_GAP);
    }
}

/**
 * Throws a single projectile from the hand of the boss.
 */
fireShot() {
    if (this.dead || !this.onThrow) return;
    Sound.play(this.cfg.sounds.throw);
    this.onThrow(this.x - this.cfg.hand.x * this.scale, this.y - this.cfg.hand.y * this.scale);
}

    /**
     * Returns to the idle state and sets the next throw.
     * @param {number} pause - Time until the next throw in ms.
     */
    endState(pause) {
        this.setState("idle");
        this.nextThrow = Date.now() + pause;
    }

    /**
     * Returns the hit area.
     * @returns {{x: number, y: number, width: number, height: number}} Rectangle in world coordinates.
     */
    getHitbox() {
        let scale = this.scale;
        let box = this.cfg.hitbox;
        return { x: this.x - (box.width / 2) * scale, y: this.y - (box.height + 5) * scale, width: box.width * scale, height: box.height * scale };
    }

    /**
     * Picks the image matching the state.
     * @returns {HTMLImageElement} The current image.
     */
    frameImage() {
        let elapsed = Date.now() - this.stateStart;
        let path;
        if (this.state === "throw") path = this.frameOnce(this.IMAGES_THROW, elapsed, 450 / this.IMAGES_THROW.length);
        else if (this.state === "hit") path = this.frameLoop(this.IMAGES_HIT, elapsed, 225);
        else if (this.state === "die") path = this.frameOnce(this.IMAGES_DIE, elapsed, 250);
        else path = this.idlePath();
        return this.imageCache[path];
    }

    /**
     * Picks the image in the idle state (when angry, with the angry images of the current level).
     * @returns {string} Path of the image.
     */
    idlePath() {
        let list = this.IMAGES_IDLE;
        if (this.isAngry()) {
            list = this.IMAGES_ANGRY;
            let wanted = this.angryFrames[this.phase() - 1];
            if (wanted) list = wanted.map((i) => this.IMAGES_ANGRY[i]);
        }
        return this.frameLoop(list, Date.now(), this.idleFrameTime);
    }

    /**
     * Draws the boss. It blinks while invulnerable.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    draw(ctx) {
        ctx.save();
        if (this.isInvulnerable() && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.4;
        super.draw(ctx, this.frameImage());
        ctx.restore();
    }
}
