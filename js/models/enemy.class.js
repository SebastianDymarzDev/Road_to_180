/**
 * Base class for enemies: becomes active near the character, can be hit and disappears after the death animation.
 */
class Enemy extends MovableObject {
    static ACTIVATE_DISTANCE = 560;
    health = 1;
    active = false;
    dying = false;
    removable = false;
    dieStart = 0;

    /**
     * Creates the paths of the enemy images.
     * @param {string} folder - Subfolder in the enemy folder.
     * @param {string} name - File name without number and extension.
     * @param {number} count - Number of images.
     * @returns {string[]} List of image paths.
     */
    static paths(folder, name, count) {
        return MovableObject.framePaths(`img_small/character/enemies/${folder}`, name, count);
    }

    /**
     * One step: becomes active when the character is close enough, moves, and is removed once it is far behind the character.
     * @param {Character} character - The player character.
     */
    update(character) {
        if (this.dying) {
            this.updateDying();
            return;
        }
        if (!this.active && this.x - character.x < Enemy.ACTIVATE_DISTANCE) this.active = true;
        if (this.active) this.move();
        if (this.x < character.x - 500) this.removable = true;
    }

    /**
     * Removes health. At 0 the enemy dies.
     * @param {number} damage - Damage of the hit.
     */
    hit(damage) {
        if (this.dying) return;
        this.health -= damage;
        if (this.health <= 0) this.die("front");
    }

    /**
     * Starts dying.
     * @param {"front"|"top"} kind - "front" = hit by a dart, "top" = jumped on from above.
     */
    die(kind) {
        this.dying = true;
        this.dieKind = kind;
        this.dieStart = Date.now();
    }

    /**
     * Picks the current image of the death animation.
     * @param {string[]} images - Images of the animation.
     * @param {number} ms - Duration of one image in ms.
     * @returns {string} The current image.
     */
    dieFrame(images, ms) {
        return this.frameOnce(images, Date.now() - this.dieStart, ms);
    }
}

/**
 * Dartboard: rolls from right to left towards the character.
 */
class Dartboard extends Enemy {
    speed = 2;
    angle = 0;
    DIE_FRONT = Enemy.paths("dartboard/die", "dartboard_die_front", 3);
    DIE_TOP = Enemy.paths("dartboard/die", "dartboard_die_top", 3);

    /**
     * @param {number} x - Start position in world coordinates.
     */
    constructor(x) {
        super();
        this.x = x;
        this.y = Character.GROUND_Y;
        this.loadImage("img_small/character/enemies/dartboard/roll/dartboard_enemy.webp");
        this.loadImages(this.DIE_FRONT);
        this.loadImages(this.DIE_TOP);
    }

    /**
     * Rolls one step to the left and rotates.
     */
    move() {
        this.x -= this.speed;
        this.angle -= this.speed / 48;
    }

    /**
     * Removes the dartboard shortly after the hit.
     */
    updateDying() {
        if (Date.now() - this.dieStart > 700) this.removable = true;
    }

    /**
     * Returns the hit area.
     * @returns {{x: number, y: number, w: number, h: number}} Rectangle in world coordinates.
     */
    getHitbox() {
        return { x: this.x - 40, y: this.y - 90, w: 80, h: 86 };
    }

    /**
     * Draws the rolling or dying dartboard.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
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

/**
 * Flying arrow: flies from right to left towards the character.
 */
class FlyingArrow extends Enemy {
    speed = 5;
    FLY = Enemy.paths("arrow/fly", "arrow_enemy", 2);
    DIE = Enemy.paths("arrow/die", "arrow_die", 3);

    /**
     * @param {number} x - Start position in world coordinates.
     * @param {number} y - Flight height.
     */
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.loadImage(this.FLY[0]);
        this.loadImages(this.FLY);
        this.loadImages(this.DIE);
    }

    /**
     * Flies one step to the left.
     */
    move() {
        this.x -= this.speed;
    }

    /**
     * Lets the hit arrow fall and removes it shortly after.
     */
    updateDying() {
        this.y += 4;
        this.x -= 1;
        if (Date.now() - this.dieStart > 500) this.removable = true;
    }

    /**
     * Returns the hit area.
     * @returns {{x: number, y: number, w: number, h: number}} Rectangle in world coordinates.
     */
    getHitbox() {
        return { x: this.x - 50, y: this.y - 13, w: 100, h: 26 };
    }

    /**
     * Draws the flying or hit arrow.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    draw(ctx) {
        let path = this.dying ? this.dieFrame(this.DIE, 130) : this.frameLoop(this.FLY, Date.now(), 120);
        this.drawCentered(ctx, this.imageCache[path], { flip: true });
    }
}