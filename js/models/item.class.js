class Item extends MovableObject {
    static IMAGES = {
        coin: "img_small/items/coin.webp",
        dart: "img_small/items/arrow.webp",
        drink: "img_small/items/heeling-energydrink.webp",
    };

    // Farbe des Scheins pro Item-Art
    static GLOW = {
        coin: "#ffd23c",
        dart: "#ff7a2a",
        drink: "#6fe8ff",
    };

    // x, y = Mitte des Items
    constructor(type, x, y) {
        super();
        this.type = type;
        this.x = x;
        this.y = y;
        this.phase = Math.random() * Math.PI * 2; // damit nicht alle im Gleichtakt leuchten
        this.loadImage(Item.IMAGES[type]);
    }

    getHitbox() {
        let w = this.img.naturalWidth * 0.7;
        let h = this.img.naturalHeight * 0.7;
        return { x: this.x - w / 2, y: this.y - h / 2, w: w, h: h };
    }

    draw(ctx) {
        if (!this.img || !this.img.complete) return;
        let t = Date.now() / 300 + this.phase;
        let bob = Math.sin(t) * 3;                  // sanftes Auf und Ab
        ctx.save();
        ctx.shadowColor = Item.GLOW[this.type];
        ctx.shadowBlur = 18 + Math.sin(t * 1.3) * 6; // pulsierender Schein
        ctx.drawImage(this.img, this.x - this.img.naturalWidth / 2, this.y - this.img.naturalHeight / 2 + bob);
        ctx.restore();
    }
}