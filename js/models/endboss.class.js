class Endboss extends MovableObject {
    angryBelow = 2;          // ab so wenigen Leben wird er wütend (wirft schneller)
    throwPause = 2500;       // ms zwischen zwei Würfen
    idleFrameTime = 700;     // ms pro Bild in der Ruhe-Animation (größer = langsamer)
    angryThrowPause = 1500;  // ms zwischen zwei Würfen, wenn er wütend ist
    active = false;          // wirft erst, wenn die Arena gestartet ist
    dead = false;
    state = "idle";          // idle, throw, hit, die
    stateStart = 0;
    nextThrow = 0;
    thrown = false;
    invulnerableUntil = 0;    // bis dahin kein Schaden (nach einem Treffer)
    INVULNERABLE_TIME = 1000; // so lange ist der Boss nach einem Treffer unverwundbar
    onThrow = null;          // wird von World gesetzt

    // x = Mitte, cfg = Boss-Einstellungen aus levels.js
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

    readAnger(cfg) {
        this.angryBelow = cfg.angryBelow || 2;
        this.angryAt = cfg.angryAt || [this.angryBelow];
        this.pauses = cfg.pauses || [this.throwPause, this.angryThrowPause];
        this.angryFrames = cfg.angryFrames || [];
    }

    loadAllImages() {
        let f = this.cfg.frames;
        this.IMAGES_IDLE = this.paths("idle", "idle", f.idle);
        this.IMAGES_ANGRY = this.paths("angry", "angry", f.angry);
        this.IMAGES_THROW = this.paths("throw", this.cfg.throwName, f.throw);
        this.IMAGES_HIT = this.paths("hit", "hit", f.hit);
        this.IMAGES_DIE = this.paths("die", "die", f.die);
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadImages(this.IMAGES_IDLE, this.IMAGES_ANGRY, this.IMAGES_THROW, this.IMAGES_HIT, this.IMAGES_DIE);
    }

    paths(folder, name, count) {
        let prefix = `img_small/character/enemies/endboss/${this.cfg.folder}/${folder}`;
        return MovableObject.framePaths(prefix, `${this.cfg.prefix}_${name}`, count);
    }

    projectilePath() {
        return `img_small/character/enemies/endboss/${this.cfg.folder}/projectile/${this.cfg.projectile}.webp`;
    }

    // 0 = ruhig, 1 = wütend, 2 = sehr wütend (je nach Leben)
    phase() {
        return this.angryAt.filter((h) => this.health <= h).length;
    }

    isAngry() {
        return this.phase() > 0;
    }

    start() {
        this.active = true;
        this.nextThrow = Date.now() + 1500;
    }

    setState(state) {
        this.state = state;
        this.stateStart = Date.now();
    }

    // Dart getroffen. Beim Boss zählt der Schaden direkt (normal 1, stark 2).
    hit(damage) {
        if (!this.active || this.dead || this.isInvulnerable()) return;
        this.invulnerableUntil = Date.now() + this.INVULNERABLE_TIME;
        this.health = Math.max(0, this.health - damage);
        if (this.health === 0) {
            this.dead = true;
            this.setState("die");
        } else if (this.state === "idle") {
            this.setState("hit"); // nur in der Ruhe: ein Wurf wird nie unterbrochen, ein Treffer startet nichts neu
        }
    }

    isInvulnerable() {
        return Date.now() < this.invulnerableUntil;
    }

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
            this.setState("idle"); // der Wurfrhythmus (nextThrow) bleibt unverändert
        }
    }

    updateThrow(elapsed) {
        if (!this.thrown && elapsed >= 100) {
            this.thrown = true;
            Sound.play(this.cfg.sounds.throw);
            if (this.onThrow) this.onThrow(this.x - this.cfg.hand.x * this.scale, this.y - this.cfg.hand.y * this.scale);
        }
        if (elapsed >= 450) this.endState(this.pauses[Math.min(this.phase(), this.pauses.length - 1)]);
    }

    endState(pause) {
        this.setState("idle");
        this.nextThrow = Date.now() + pause;
    }

    getHitbox() {
        let s = this.scale;
        let box = this.cfg.hitbox;
        return { x: this.x - (box.w / 2) * s, y: this.y - (box.h + 5) * s, w: box.w * s, h: box.h * s };
    }

    frameImage() {
        let elapsed = Date.now() - this.stateStart;
        let path;
        if (this.state === "throw") path = this.frameOnce(this.IMAGES_THROW, elapsed, 450 / this.IMAGES_THROW.length);
        else if (this.state === "hit") path = this.frameLoop(this.IMAGES_HIT, elapsed, 225);
        else if (this.state === "die") path = this.frameOnce(this.IMAGES_DIE, elapsed, 250);
        else path = this.idlePath();
        return this.imageCache[path];
    }

    idlePath() {
        let list = this.IMAGES_IDLE;
        if (this.isAngry()) {
            list = this.IMAGES_ANGRY;
            let wanted = this.angryFrames[this.phase() - 1];
            if (wanted) list = wanted.map((i) => this.IMAGES_ANGRY[i]);
        }
        return this.frameLoop(list, Date.now(), this.idleFrameTime);
    }

    // blinkt, solange er unverwundbar ist
    draw(ctx) {
        ctx.save();
        if (this.isInvulnerable() && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.4;
        super.draw(ctx, this.frameImage());
        ctx.restore();
    }
}
