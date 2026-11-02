class Enemy extends MovableObject {
    static ACTIVATE_DISTANCE = 560; // so nah muss die Figur sein, dann setzt sich der Gegner in Bewegung
    health = 1;
    active = false;
    dying = false;
    removable = false;
    dieStart = 0;

    static paths(folder, name, count) {
        return MovableObject.framePaths(`img_small/character/enemies/${folder}`, name, count);
    }

    update(character) {
        if (this.dying) {
            this.updateDying();
            return;
        }
        if (!this.active && this.x - character.x < Enemy.ACTIVATE_DISTANCE) this.active = true;
        if (this.active) this.move();
        if (this.x < character.x - 500) this.removable = true; // links aus dem Bild gelaufen
    }

    hit(damage) {
        if (this.dying) return;
        this.health -= damage;
        if (this.health <= 0) this.die("front");
    }

    // kind: "front" = von einem Dart getroffen, "top" = von oben draufgesprungen
    die(kind) {
        this.dying = true;
        this.dieKind = kind;
        this.dieStart = Date.now();
    }

    dieFrame(images, ms) {
        return this.frameOnce(images, Date.now() - this.dieStart, ms);
    }
}

class Dartboard extends Enemy {
    speed = 2;
    angle = 0;
    DIE_FRONT = Enemy.paths("dartboard/die", "dartboard_die_front", 3);
    DIE_TOP = Enemy.paths("dartboard/die", "dartboard_die_top", 3);

    // y = Boden
    constructor(x) {
        super();
        this.x = x;
        this.y = Character.GROUND_Y;
        this.loadImage("img_small/character/enemies/dartboard/roll/dartboard_enemy.webp");
        this.loadImages(this.DIE_FRONT);
        this.loadImages(this.DIE_TOP);
    }

    move() {
        this.x -= this.speed;
        this.angle -= this.speed / 48; // rollt nach links
    }

    updateDying() {
        if (Date.now() - this.dieStart > 700) this.removable = true;
    }

    getHitbox() {
        return { x: this.x - 40, y: this.y - 90, w: 80, h: 86 };
    }

    draw(ctx) {
        if (this.dying) {
            let list = this.dieKind === "top" ? this.DIE_TOP : this.DIE_FRONT;
            super.draw(ctx, this.imageCache[this.dieFrame(list, 120)]);
            return;
        }
        if (!this.img.complete) return;
        ctx.save();
        ctx.translate(this.x, this.y - 48);
        ctx.rotate(this.angle);
        ctx.drawImage(this.img, -48, -48);
        ctx.restore();
    }
}

class FlyingArrow extends Enemy {
    speed = 5;
    FLY = Enemy.paths("arrow/fly", "arrow_enemy", 2);
    DIE = Enemy.paths("arrow/die", "arrow_die", 3);

    // y = Flughöhe (Mitte)
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.loadImage(this.FLY[0]);
        this.loadImages(this.FLY);
        this.loadImages(this.DIE);
    }

    move() {
        this.x -= this.speed;
    }

    updateDying() {
        this.y += 4; // fällt herunter
        this.x -= 1;
        if (Date.now() - this.dieStart > 500) this.removable = true;
    }

    getHitbox() {
        return { x: this.x - 50, y: this.y - 13, w: 100, h: 26 };
    }

    draw(ctx) {
        let path = this.dying ? this.dieFrame(this.DIE, 130) : this.frameLoop(this.FLY, Date.now(), 120);
        // das Bild zeigt nach rechts, der Pfeil fliegt aber nach links
        this.drawCentered(ctx, this.imageCache[path], { flip: true });
    }
}