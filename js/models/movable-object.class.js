class MovableObject {
    x = 0;
    y = 0;
    speedY = 0;
    gravity = 0.6;
    otherDirection = false;
    img;
    imageCache = {};
    currentImage = 0;

    loadImage(path) {
        this.img = new Image();
        this.img.src = path;
    }

    loadImages(paths) {
        paths.forEach((path) => {
            let img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }

    playAnimation(paths) {
        let i = this.currentImage % paths.length;
        this.img = this.imageCache[paths[i]];
        this.currentImage++;
    }

    // y = Fusslinie. Das Bild wird mit seiner Unterkante darauf gesetzt.
    draw(ctx) {
        if (!this.img || !this.img.complete) return;
        let w = this.img.naturalWidth;
        let h = this.img.naturalHeight;
        ctx.save();
        if (this.otherDirection) {
            ctx.translate(this.x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(this.img, -w / 2, this.y - h);
        } else {
            ctx.drawImage(this.img, this.x - w / 2, this.y - h);
        }
        ctx.restore();
    }
}