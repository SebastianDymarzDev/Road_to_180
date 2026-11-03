/**
 * In-game displays: health, darts, coins and the end boss health bar.
 */
class Hud extends MovableObject {
    static SCALE = 0.45;
    static BOSS_SCALE = 0.65;
    static X = 6;
    static Y = 2;
    static GAP = 2;
    static FONT = '16px "Permanent Marker"';

    /**
     * @param {Character} character - The player character whose values are shown.
     */
    constructor(character) {
        super();
        this.character = character;
        this.IMAGES_HEALTH = this.frames("healthbar_player/healthbar", 6);
        this.IMAGES_DARTS = this.frames("dartbar/dartbar", 6);
        this.COIN_FRAME = "img_small/assets/bars/coin_counter.webp";
        this.loadImages(this.IMAGES_HEALTH, this.IMAGES_DARTS, [this.COIN_FRAME]);
        document.fonts.load(Hud.FONT);
    }

    /**
     * Connects the end boss with its health bar (images come from levels.js).
     * @param {Endboss} boss - The end boss.
     * @param {object} cfg - Boss settings from levels.js (bar, barCount).
     */
    setBoss(boss, cfg) {
        this.boss = boss;
        this.IMAGES_BOSS = this.frames(cfg.bar, cfg.barCount);
        this.loadImages(this.IMAGES_BOSS);
    }

    /**
     * Creates the paths of the bar images.
     * @param {string} name - File name without number and extension.
     * @param {number} count - Number of images.
     * @returns {string[]} List of image paths.
     */
    frames(name, count) {
        return MovableObject.framePaths("img_small/assets/bars", name, count);
    }

    /**
     * Draws a loaded display image scaled at the position.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     * @param {string} path - Path of the image.
     * @param {number} x - Top-left position.
     * @param {number} y - Top-left position.
     * @param {number} [scale] - Scale factor.
     */
    drawImage(ctx, path, x, y, scale = Hud.SCALE) {
        let img = this.imageCache[path];
        if (!img || !img.complete) return;
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
    }

    /**
     * Draws all displays.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    draw(ctx) {
        let c = this.character;
        let s = Hud.SCALE;
        let dartY = Hud.Y + 83 * s + Hud.GAP;
        let coinY = dartY + 82 * s + Hud.GAP;
        this.drawImage(ctx, this.IMAGES_HEALTH[c.maxHealth - c.health], Hud.X, Hud.Y);
        this.drawDartBar(ctx, dartY);
        this.drawImage(ctx, this.COIN_FRAME, Hud.X, coinY);
        this.drawBossBar(ctx);
        this.drawCoins(ctx, c.coins, Hud.X + 106 * s, coinY + 44 * s);
    }

    /**
     * Draws the dart bar. It glows while the throw is charged.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     * @param {number} y - Top edge of the bar.
     */
    drawDartBar(ctx, y) {
        ctx.save();
        if (this.character.charged) this.glow(ctx, MovableObject.CHARGE_GLOW, 14 + Math.sin(Date.now() / 120) * 8);
        this.drawImage(ctx, this.IMAGES_DARTS[this.character.darts], Hud.X, y);
        ctx.restore();
    }

    /**
     * Draws the end boss health bar as soon as it should be visible.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     */
    drawBossBar(ctx) {
        if (!this.boss || !this.bossBarVisible || !this.IMAGES_BOSS) return;
        let bs = Hud.BOSS_SCALE;
        let x = (720 - 360 * bs) / 2;
        this.drawImage(ctx, this.IMAGES_BOSS[this.boss.maxHealth - this.boss.health], x, Hud.Y, bs);
    }

    /**
     * Draws the number of coins centered at the position.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     * @param {number} coins - Number of coins.
     * @param {number} x - Center of the text.
     * @param {number} y - Center of the text.
     */
    drawCoins(ctx, coins, x, y) {
        ctx.save();
        ctx.font = Hud.FONT;
        ctx.fillStyle = "#ffd23c";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        let m = ctx.measureText(String(coins));
        let offset = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
        ctx.fillText(coins, x, y + offset);
        ctx.restore();
    }
}
