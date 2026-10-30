class Dart extends MovableObject {
    speed = 10;
    maxDistance = 600; // so weit fliegt der Dart, dann verschwindet er

    constructor(x, y, otherDirection) {
        super();
        this.loadImage("img_small/character/player/projectile/projectile_01.webp");
        this.x = x;
        this.startX = x;
        this.y = y; // Mitte des Darts
        this.otherDirection = otherDirection;
    }

    move() {
        this.x += this.otherDirection ? -this.speed : this.speed;
    }

    isGone() {
        return Math.abs(this.x - this.startX) > this.maxDistance;
    }

    // Das Bild zeigt die Spitze nach links unten, daher 135 Grad drehen
    draw(ctx) {
        if (!this.img || !this.img.complete) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.otherDirection) ctx.scale(-1, 1);
        ctx.drawImage(this.img, -this.img.naturalWidth / 2, -this.img.naturalHeight / 2);
        ctx.restore();
    }
}