/**
 * Collectible item: coin, dart or energy drink. Floats slightly and glows.
 */
class Item extends MovableObject {
    static IMAGES = {
        coin: "img_small/items/coin.webp",
        dart: "img_small/items/arrow.webp",
        drink: "img_small/items/heeling-energydrink.webp",
    };

    static GLOW = {
        coin: "#ffd23c",
        dart: "#ff7a2a",
        drink: "#6fe8ff",
    };

    /**
     * @param {"coin"|"dart"|"drink"} type - Kind of item.
     * @param {number} x - Center in world coordinates.
     * @param {number} y - Center in world coordinates.
     */
    constructor(type, x, y) {
        super();
        this.type = type;
        this.x = x;
        this.y = y;
        this.phase = Math.random() * Math.PI * 2;
        this.loadImage(Item.IMAGES[type]);
    }

    /**
     * Returns the hit area (70 % of the image size).
     * @returns {{x: number, y: number, w: number, h: number}} Rectangle in world coordinates.
     */
    getHitbox() {
        let w = this.img.naturalWidth * 0.7;
        let h = this.img.naturalHeight * 0.7;
        return { x: this.x - w / 2, y: this.y - h / 2, w: w, h: h };
    }

    /**
     * Draws the item with floating and glowing.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    draw(ctx) {
        if (!this.img || !this.img.complete) return;
        let t = Date.now() / 300 + this.phase;
        let bob = Math.sin(t) * 3;
        ctx.save();
        this.glow(ctx, Item.GLOW[this.type], 18 + Math.sin(t * 1.3) * 6);
        ctx.drawImage(this.img, this.x - this.img.naturalWidth / 2, this.y - this.img.naturalHeight / 2 + bob);
        ctx.restore();
    }
}