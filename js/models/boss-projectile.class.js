/**
 * Projectile thrown by the end boss (beer mug, arrow, ...). Flies in an arc exactly to where the character stood at the time of the throw.
 */
class BossProjectile extends MovableObject {
    angle = 0;
    used = false;

    /**
     * Calculates the flight time so that the projectile lands on the target point after an arc.
     * @param {number} x - Start position.
     * @param {number} y - Start position.
     * @param {number} targetX - Target position.
     * @param {number} targetY - Target position.
     * @param {string} imagePath - Path to the projectile image.
     * @param {{gravity: number, lift: number, rotation: "spin"|"aim"}} flight - Flight properties from levels.js.
     */
    constructor(x, y, targetX, targetY, imagePath, flight) {
        super();
        this.rotation = flight.rotation;
        this.gravity = flight.gravity;
        this.loadImage(imagePath);
        this.x = x;
        this.y = y;
        let startSpeedY = -flight.lift;
        let drop = targetY - y;
        let T = (-startSpeedY + Math.sqrt(Math.max(0, startSpeedY * startSpeedY + 2 * this.gravity * drop))) / this.gravity;
        this.speedX = (targetX - x) / T;
        this.speedY = startSpeedY;
    }

    /**
     * Moves the projectile one step and rotates it.
     */
    move() {
        this.x += this.speedX;
        this.speedY += this.gravity;
        this.y += this.speedY;
        if (this.rotation === "spin") this.angle -= 0.25;
        else if (this.rotation === "aim") this.angle = Math.atan2(-this.speedY, -this.speedX);
    }

    /**
     * Checks whether the projectile has dropped below the ground.
     * @returns {boolean} true if it can be removed.
     */
    isGone() {
        return this.y > Character.GROUND_Y + 20;
    }

    /**
     * Returns the hit area.
     * @returns {{x: number, y: number, w: number, h: number}} Rectangle in world coordinates.
     */
    getHitbox() {
        return { x: this.x - 22, y: this.y - 18, w: 44, h: 36 };
    }

    /**
     * Draws the rotated projectile.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    draw(ctx) {
        this.drawCentered(ctx, this.img, { angle: this.angle });
    }
}