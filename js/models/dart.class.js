/**
 * Dart thrown by the player. Flies in an arc. A charged throw does double damage and glows.
 */
class Dart extends MovableObject {
    speed = 10;
    gravity = 0.22;
    maxDistance = 600;
    used = false;

    /**
     * @param {number} x - Start position.
     * @param {number} y - Start position.
     * @param {boolean} otherDirection - true if thrown to the left.
     * @param {boolean} strong - true for a charged throw.
     */
    constructor(x, y, otherDirection, strong) {
        super();
        this.strong = strong;
        this.damage = strong ? 2 : 1;
        this.loadImage("img_small/character/player/projectile/projectile_01.webp");
        this.x = x;
        this.startX = x;
        this.y = y;
        this.otherDirection = otherDirection;
    }

    /**
     * Moves the dart one step: forward and downwards because of gravity.
     */
    move() {
        this.x += this.otherDirection ? -this.speed : this.speed;
        this.speedY += this.gravity;
        this.y += this.speedY;
    }

    /**
     * Returns the hit area.
     * @returns {{x: number, y: number, width: number, height: number}} Rectangle in world coordinates.
     */
    getHitbox() {
        let width = this.img.naturalWidth;
        let height = this.img.naturalHeight * 0.8;
        return { x: this.x - width / 2, y: this.y - height / 2, width, height };
    }

    /**
     * Checks whether the dart has flown too far or reached the ground.
     * @returns {boolean} true if it can be removed.
     */
    isGone() {
        return Math.abs(this.x - this.startX) > this.maxDistance || this.y > Character.GROUND_Y;
    }

    /**
     * Draws the dart with its tip in the flight direction. A charged dart is larger and glows.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    draw(ctx) {
        ctx.save();
        if (this.strong) this.glow(ctx, MovableObject.CHARGE_GLOW, 28);
        let angle = Math.atan2(this.speedY, this.speed);
        this.drawCentered(ctx, this.img, { angle: angle, scale: this.strong ? 1.4 : 1, flip: this.otherDirection });
        ctx.restore();
    }
}
