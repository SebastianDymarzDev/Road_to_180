/**
 * Base class for all game objects with position, images and drawing on the canvas.
 */
class MovableObject {
    x = 0;
    y = 0;
    speedY = 0;
    gravity = 0.6;
    otherDirection = false;
    img;
    imageCache = {};
    currentImage = 0;

    /**
     * Creates an image and starts loading it.
     * @param {string} src - Path to the image.
     * @returns {HTMLImageElement} The image.
     */
    static newImage(src) {
        let img = new Image();
        img.src = src;
        return img;
    }

    /**
     * Creates paths of the form prefix/name_01.webp, prefix/name_02.webp ...
     * @param {string} prefix - Folder of the images.
     * @param {string} name - File name without number and extension.
     * @param {number} count - Number of images.
     * @returns {string[]} List of image paths.
     */
    static framePaths(prefix, name, count) {
        let list = [];
        for (let i = 1; i <= count; i++) {
            list.push(`${prefix}/${name}_${String(i).padStart(2, "0")}.webp`);
        }
        return list;
    }

    /**
     * Loads the main image of the object.
     * @param {string} path - Path to the image.
     */
    loadImage(path) {
        this.img = MovableObject.newImage(path);
    }

    /**
     * Loads all images of the lists into the image cache.
     * @param {...string[]} lists - Lists of image paths.
     */
    loadImages(...lists) {
        lists.flat().forEach((path) => (this.imageCache[path] = MovableObject.newImage(path)));
    }

    /**
     * Shows the next image of an animation and wraps around to the first one at the end.
     * @param {string[]} paths - Image paths of the animation (must be loaded).
     */
    playAnimation(paths) {
        let i = this.currentImage % paths.length;
        this.img = this.imageCache[paths[i]];
        this.currentImage++;
    }

    static CHARGE_GLOW = "#ffd23c";

    /**
     * Turns on a glow effect for the following drawing commands.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     * @param {string} color - Glow color.
     * @param {number} blur - Glow strength.
     */
    glow(ctx, color, blur) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
    }

    /**
     * Picks the image of an animation that plays once and stays on the last image.
     * @param {string[]} list - Images of the animation.
     * @param {number} elapsed - Time since the start in ms.
     * @param {number} ms - Duration of one image in ms.
     * @returns {string} The current image.
     */
    frameOnce(list, elapsed, ms) {
        return list[Math.min(list.length - 1, Math.floor(elapsed / ms))];
    }

    /**
     * Picks the image of an animation that loops endlessly.
     * @param {string[]} list - Images of the animation.
     * @param {number} elapsed - Elapsed time in ms.
     * @param {number} ms - Duration of one image in ms.
     * @returns {string} The current image.
     */
    frameLoop(list, elapsed, ms) {
        return list[Math.floor(elapsed / ms) % list.length];
    }

    /**
     * Draws the image with its center at x and its bottom edge at y. Mirrored when otherDirection is set.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     * @param {HTMLImageElement} [img] - Image to draw (default: the main image).
     */
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

    /**
     * Draws the image with its center at x and y, optionally rotated, scaled and mirrored.
     * @param {CanvasRenderingContext2D} ctx - Drawing surface.
     * @param {HTMLImageElement} img - Image to draw.
     * @param {{angle?: number, scale?: number, flip?: boolean}} [options] - Rotation angle in radians, scale factor and mirroring.
     */
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
