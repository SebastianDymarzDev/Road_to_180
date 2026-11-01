class Dart extends MovableObject {
    speed = 10;
    gravity = 0.22; // Flugbogen: je größer, desto stärker sinkt der Dart
    maxDistance = 600; // so weit fliegt der Dart, dann verschwindet er
    used = false; // true, sobald der Dart etwas getroffen hat

    constructor(x, y, otherDirection, strong) {
        super();
        this.strong = strong;
        this.damage = strong ? 2 : 1;
        let image = strong ? "projectile_03" : "projectile_01";
        this.loadImage(`img_small/character/player/projectile/${image}.webp`);
        this.x = x;
        this.startX = x;
        this.y = y;
        this.otherDirection = otherDirection;
    }

    move() {
        this.x += this.otherDirection ? -this.speed : this.speed;
        this.speedY += this.gravity;
        this.y += this.speedY;
    }

    getHitbox() {
        let w = this.img.naturalWidth;
        let h = this.img.naturalHeight * 0.8;
        return { x: this.x - w / 2, y: this.y - h / 2, w: w, h: h };
    }

    isGone() {
        return Math.abs(this.x - this.startX) > this.maxDistance || this.y > Character.GROUND_Y;
    }

    // Das Bild zeigt die Spitze nach links unten, daher 135 Grad drehen
    draw(ctx) {
        if (!this.img || !this.img.complete) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.otherDirection) ctx.scale(-1, 1);
        ctx.rotate(Math.atan2(this.speedY, this.speed)); // Spitze zeigt in Flugrichtung
        let scale = this.strong ? 1.4 : 1;
        if (this.strong) {
            ctx.shadowColor = "#ff3b1f";
            ctx.shadowBlur = 18;
        }
        let w = this.img.naturalWidth * scale;
        let h = this.img.naturalHeight * scale;
        ctx.drawImage(this.img, -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}