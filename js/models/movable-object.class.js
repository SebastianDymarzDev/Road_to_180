class MovableObject {
    x = 0;
    y = 0;
    speedY = 0;
    gravity = 0.6;
    otherDirection = false;
    img;
    imageCache = {};
    currentImage = 0;

    static newImage(src) {
        let img = new Image();
        img.src = src;
        return img;
    }

    // Pfade prefix/name_01.webp, prefix/name_02.webp ... (count Stück)
    static framePaths(prefix, name, count) {
        let list = [];
        for (let i = 1; i <= count; i++) {
            list.push(`${prefix}/${name}_${String(i).padStart(2, "0")}.webp`);
        }
        return list;
    }

    loadImage(path) {
        this.img = MovableObject.newImage(path);
    }

    // mehrere Bildlisten auf einmal in den Cache laden
    loadImages(...lists) {
        lists.flat().forEach((path) => (this.imageCache[path] = MovableObject.newImage(path)));
    }

    playAnimation(paths) {
        let i = this.currentImage % paths.length;
        this.img = this.imageCache[paths[i]];
        this.currentImage++;
    }

    static CHARGE_GLOW = "#ffd23c"; // Leuchtfarbe für den aufgeladenen Wurf

    // Leuchten um das nächste gezeichnete Bild (gilt bis ctx.restore)
    glow(ctx, color, blur) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
    }

    // Bild nach Zeit: einmal abspielen (ms pro Bild) und beim letzten Bild stehen bleiben
    frameOnce(list, elapsed, ms) {
        return list[Math.min(list.length - 1, Math.floor(elapsed / ms))];
    }

    // Bild nach Zeit: Liste immer wieder abspielen
    frameLoop(list, elapsed, ms) {
        return list[Math.floor(elapsed / ms) % list.length];
    }

    // y = Fusslinie. Das Bild wird mit seiner Unterkante darauf gesetzt.
    draw(ctx, img = this.img) {
        if (!img || !img.complete) return;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        ctx.save();
        if (this.otherDirection) {
            ctx.translate(this.x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, -w / 2, this.y - h);
        } else {
            ctx.drawImage(img, this.x - w / 2, this.y - h);
        }
        ctx.restore();
    }

    // Bild mittig auf (x, y), optional gedreht, skaliert oder gespiegelt
    drawCentered(ctx, img, { angle = 0, scale = 1, flip = false } = {}) {
        if (!img || !img.complete) return;
        let w = img.naturalWidth * scale;
        let h = img.naturalHeight * scale;
        ctx.save();
        ctx.translate(this.x, this.y);
        if (flip) ctx.scale(-1, 1);
        ctx.rotate(angle);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}
