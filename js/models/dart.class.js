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

    // Spitze zeigt in Flugrichtung
    draw(ctx) {
        ctx.save();
        if (this.strong) this.glow(ctx);
        let angle = Math.atan2(this.speedY, this.speed);
        this.drawCentered(ctx, this.img, { angle: angle, scale: this.strong ? 1.4 : 1, flip: this.otherDirection });
        ctx.restore();
    }

    glow(ctx) {
        ctx.shadowColor = "#ff3b1f";
        ctx.shadowBlur = 18;
    }
}