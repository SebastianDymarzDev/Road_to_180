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
    onThrow = null;          // wird von World gesetzt

    // x = Mitte, cfg = Boss-Einstellungen aus levels.js
    constructor(x, cfg) {
        super();
        this.cfg = cfg;
        this.scale = cfg.scale;
        this.maxHealth = cfg.health;
        this.health = cfg.health;
        this.angryBelow = cfg.angryBelow || 2;
        this.angryAt = cfg.angryAt || [this.angryBelow];
        this.pauses = cfg.pauses || [this.throwPause, this.angryThrowPause];
        this.angryFrames = cfg.angryFrames || [];
        this.x = x;
        this.y = Character.GROUND_Y;
        this.IMAGES_IDLE = this.paths("idle", "idle", cfg.frames.idle);
        this.IMAGES_ANGRY = this.paths("angry", "angry", cfg.frames.angry);
        this.IMAGES_THROW = this.paths("throw", cfg.throwName, cfg.frames.throw);
        this.IMAGES_HIT = this.paths("hit", "hit", cfg.frames.hit);
        this.IMAGES_DIE = this.paths("die", "die", cfg.frames.die);
        this.loadImage(this.IMAGES_IDLE[0]);
        [this.IMAGES_IDLE, this.IMAGES_ANGRY, this.IMAGES_THROW, this.IMAGES_HIT, this.IMAGES_DIE].forEach((list) =>
            this.loadImages(list)
        );
    }

    paths(folder, name, count) {
        let list = [];
        for (let i = 1; i <= count; i++) {
            list.push(`img_small/character/enemies/endboss/${this.cfg.folder}/${folder}/${this.cfg.prefix}_${name}_0${i}.webp`);
        }
        return list;
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
        if (!this.active || this.dead) return;
        this.health = Math.max(0, this.health - damage);
        if (this.health === 0) {
            this.dead = true;
            this.setState("die");
        } else {
            this.setState("hit");
        }
    }

    update() {
        if (!this.active || this.dead) return;
        let now = Date.now();
        let elapsed = now - this.stateStart;
        if (this.state === "idle" && now >= this.nextThrow) {
            this.setState("throw");
            this.thrown = false;
        } else if (this.state === "throw") {
            if (!this.thrown && elapsed >= 100) {
                this.thrown = true;
                if (this.onThrow) this.onThrow(this.x - this.cfg.hand.x * this.scale, this.y - this.cfg.hand.y * this.scale);
            }
            if (elapsed >= 450) this.endState(this.pauses[Math.min(this.phase(), this.pauses.length - 1)]);
        } else if (this.state === "hit" && elapsed >= 450) {
            this.endState(1000);
        }
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
        let now = Date.now();
        let elapsed = now - this.stateStart;
        let path;
        if (this.state === "throw") {
            let list = this.IMAGES_THROW;
            path = list[Math.min(list.length - 1, Math.floor(elapsed / (450 / list.length)))];
        } else if (this.state === "hit") {
            path = this.IMAGES_HIT[Math.floor(elapsed / 225) % this.IMAGES_HIT.length];
        } else if (this.state === "die") {
            path = this.IMAGES_DIE[Math.min(this.IMAGES_DIE.length - 1, Math.floor(elapsed / 250))];
        } else {
            let list = this.IMAGES_IDLE;
            if (this.isAngry()) {
                list = this.IMAGES_ANGRY;
                let wanted = this.angryFrames[this.phase() - 1];
                if (wanted) list = wanted.map((i) => this.IMAGES_ANGRY[i]);
            }
            path = list[Math.floor(now / this.idleFrameTime) % list.length];
        }
        return this.imageCache[path];
    }

    draw(ctx) {
        let img = this.frameImage();
        if (!img || !img.complete) return;
        ctx.drawImage(img, this.x - img.naturalWidth / 2, this.y - img.naturalHeight);
    }
}