// Wurfgeschoss des Endbosses (Bierkrug, Pfeil, ...). Fliegt im Bogen genau dorthin, wo die Figur beim Wurf stand.
class BossProjectile extends MovableObject {
    angle = 0;
    used = false;

    // flight = { gravity, lift, rotation } aus levels.js
    constructor(x, y, targetX, targetY, imagePath, flight) {
        super();
        this.rotation = flight.rotation;
        this.gravity = flight.gravity;
        this.loadImage(imagePath);
        this.x = x;
        this.y = y;
        // Flugzeit T so berechnen, dass das Geschoss nach einem Bogen im Zielpunkt ankommt
        let startSpeedY = -flight.lift;
        let drop = targetY - y;
        let T = (-startSpeedY + Math.sqrt(Math.max(0, startSpeedY * startSpeedY + 2 * this.gravity * drop))) / this.gravity;
        this.speedX = (targetX - x) / T;
        this.speedY = startSpeedY;
    }

    move() {
        this.x += this.speedX;
        this.speedY += this.gravity;
        this.y += this.speedY;
        if (this.rotation === "spin") this.angle -= 0.25; // dreht sich im Flug (Bierkrug)
        else if (this.rotation === "aim") this.angle = Math.atan2(-this.speedY, -this.speedX); // Spitze (im Bild links) zeigt in Flugrichtung
    }

    isGone() {
        return this.y > Character.GROUND_Y + 20;
    }

    getHitbox() {
        return { x: this.x - 22, y: this.y - 18, w: 44, h: 36 };
    }

    draw(ctx) {
        if (!this.img || !this.img.complete) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.img, -this.img.naturalWidth / 2, -this.img.naturalHeight / 2);
        ctx.restore();
    }
}