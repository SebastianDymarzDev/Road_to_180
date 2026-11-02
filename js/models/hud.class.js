class Hud extends MovableObject {
    static SCALE = 0.45; // Größe der Leisten (Originale sind 360x120 px)
    static BOSS_SCALE = 0.65; // Größe der Boss-Lebensleiste
    static X = 6;        // linker Rand
    static Y = 2;        // oberer Rand der Healthbar
    static GAP = 2;      // sichtbarer Abstand zwischen den Leisten (px)
    static FONT = '16px "Permanent Marker"';

    constructor(character) {
        super();
        this.character = character;
        this.IMAGES_HEALTH = this.frames("healthbar_player/healthbar", 6);
        this.IMAGES_DARTS = this.frames("dartbar/dartbar", 6);
        this.COIN_FRAME = "img_small/assets/bars/coin_counter.webp";
        this.loadImages(this.IMAGES_HEALTH, this.IMAGES_DARTS, [this.COIN_FRAME]);
        document.fonts.load(Hud.FONT); // Schrift schon vor dem ersten Zeichnen laden
    }

    // Boss und seine Lebensleiste (Bilder kommen aus levels.js)
    setBoss(boss, cfg) {
        this.boss = boss;
        this.IMAGES_BOSS = this.frames(cfg.bar, cfg.barCount);
        this.loadImages(this.IMAGES_BOSS);
    }

    frames(name, count) {
        return MovableObject.framePaths("img_small/assets/bars", name, count);
    }

    drawImage(ctx, path, x, y, scale = Hud.SCALE) {
        let img = this.imageCache[path];
        if (!img || !img.complete) return;
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
    }

    draw(ctx) {
        let c = this.character;
        let s = Hud.SCALE;
        // Die Bilder haben transparenten Rand, daher die Abstände nach dem sichtbaren Teil
        let dartY = Hud.Y + 83 * s + Hud.GAP;  // sichtbare Leistenhöhe = 83 px (Original)
        let coinY = dartY + 82 * s + Hud.GAP;
        this.drawImage(ctx, this.IMAGES_HEALTH[c.maxHealth - c.health], Hud.X, Hud.Y); // 01 = voll (5), 06 = leer (0)
        this.drawImage(ctx, this.IMAGES_DARTS[c.darts], Hud.X, dartY);                  // 01 = leer (0), 06 = voll (5)
        this.drawImage(ctx, this.COIN_FRAME, Hud.X, coinY);
        this.drawBossBar(ctx);
        this.drawCoins(ctx, c.coins, Hud.X + 106 * s, coinY + 44 * s);
    }

    // boss_healthbar_01 = voll (5), _06 = leer (0), oben in der Mitte
    drawBossBar(ctx) {
        if (!this.boss || !this.bossBarVisible || !this.IMAGES_BOSS) return;
        let bs = Hud.BOSS_SCALE;
        let x = (720 - 360 * bs) / 2;
        this.drawImage(ctx, this.IMAGES_BOSS[this.boss.maxHealth - this.boss.health], x, Hud.Y, bs);
    }

    drawCoins(ctx, coins, x, y) {
        ctx.save();
        ctx.font = Hud.FONT;
        ctx.fillStyle = "#ffd23c";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        // Zahl anhand ihrer tatsächlichen Höhe mittig setzen (Schrift hat sonst Eigenabstände)
        let m = ctx.measureText(String(coins));
        let offset = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
        ctx.fillText(coins, x, y + offset);
        ctx.restore();
    }
}