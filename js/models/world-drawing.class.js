/**
 * Drawing part of the game world: camera, background layers, objects, level logo, boss intro and win/lose screens.
 * Uses the state that the class World provides (canvas, ctx, character, boss, enemies, ...).
 */
class WorldDrawing {
    /**
     * Makes the camera follow the character. In the boss arena it stays fixed at the end of the level.
     */
    updateCamera() {
        if (this.arenaActive) {
            this.cameraX = World.LEVEL_WIDTH - this.canvas.width;
            return;
        }
        let target = this.character.x - World.CAMERA_OFFSET;
        let max = World.LEVEL_WIDTH - this.canvas.width;
        this.cameraX = Math.max(0, Math.min(max, target));
    }

    /**
     * Draws a background layer (two images next to each other, with parallax).
     * @param {{imgs: HTMLImageElement[], y: number, speed: number, dys: number[]}} layer - The layer.
     */
    drawLayer(layer) {
        let offset = this.cameraX * layer.speed;
        let first = Math.floor(offset / 720);
        for (let index = first; index <= first + 1; index++) {
            let img = layer.imgs[index % layer.imgs.length];
            if (!img.complete) continue;
            let x = Math.round(index * 720 - offset);
            this.ctx.drawImage(img, x, layer.y + (layer.dys[index % layer.imgs.length] || 0), 720, 480);
        }
    }

    /**
     * Draws one frame of the game and schedules the next one.
     */
    draw() {
        if (!this.running) return;
        this.updateCamera();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.layers.forEach((layer) => this.drawLayer(layer));
        this.drawEntities();
        this.hud.draw(this.ctx);
        this.drawIntro();
        this.drawLevelLogo();
        this.drawWin();
        this.drawLose();
        requestAnimationFrame(() => this.draw());
    }

    /**
     * Draws all objects of the world relative to the camera.
     */
    drawEntities() {
        let ctx = this.ctx;
        ctx.save();
        ctx.translate(-this.cameraX, 0);
        this.drawVisible(this.items, 60, 780);
        this.drawVisible(this.enemies, 150, 870);
        this.drawVisible([this.boss], 150, 870);
        this.character.draw(ctx);
        this.darts.forEach((dart) => dart.draw(ctx));
        this.projectiles.forEach((projectile) => projectile.draw(ctx));
        ctx.restore();
    }

    /**
     * Draws only the objects inside the visible area (plus a margin).
     * @param {{x: number, draw: function(CanvasRenderingContext2D): void}[]} list - Objects.
     * @param {number} left - Margin to the left of the view.
     * @param {number} right - Margin to the right of the view (measured from the left edge).
     */
    drawVisible(list, left, right) {
        list.forEach((object) => {
            if (object.x > this.cameraX - left && object.x < this.cameraX + right) object.draw(this.ctx);
        });
    }

    /**
     * Fades the level logo in and out, large in the center, at the start of the level.
     */
    drawLevelLogo() {
        let elapsed = Date.now() - this.startTime;
        if (elapsed > this.LOGO_TIME || !this.logoImg.complete) return;
        let width = 480;
        let height = (width * this.logoImg.naturalHeight) / this.logoImg.naturalWidth;
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(1, elapsed / 500, (this.LOGO_TIME - elapsed) / 500);
        this.ctx.drawImage(this.logoImg, (this.canvas.width - width) / 2, 90, width, height);
        this.ctx.restore();
    }

    /**
     * Shows the name of the end boss in the center and lets it fly to the top right.
     */
    drawIntro() {
        if (!this.arenaActive || !this.nameImg.complete) return;
        let elapsed = Date.now() - this.introStart;
        let progress = Math.min(1, Math.max(0, (elapsed - this.INTRO_TIME) / this.NAME_FLY_TIME));
        progress = progress * progress * (3 - 2 * progress);
        let start = this.nameStart();
        let end = this.nameEnd();
        let mix = (from, to) => from + (to - from) * progress;
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(1, elapsed / 300);
        this.ctx.drawImage(this.nameImg, mix(start.x, end.x), mix(start.y, end.y), mix(start.width, end.width), mix(start.height, end.height));
        this.ctx.restore();
    }

    /**
     * Returns position and size of the boss name in the center.
     * @returns {{x: number, y: number, width: number, height: number}} Rectangle on the game field.
     */
    nameStart() {
        let width = 320;
        return { x: (this.canvas.width - width) / 2, y: 150, width, height: (width * this.nameImg.naturalHeight) / this.nameImg.naturalWidth };
    }

    /**
     * Returns position and size of the boss name at the top right.
     * @returns {{x: number, y: number, width: number, height: number}} Rectangle on the game field.
     */
    nameEnd() {
        let width = this.nameImg.naturalWidth * this.NAME_SCALE;
        return { x: this.canvas.width - width - 6, y: Hud.Y, width, height: this.nameImg.naturalHeight * this.NAME_SCALE };
    }

    /**
     * Checks whether the win screen should appear (2 seconds after the boss died).
     * @returns {boolean} true if visible.
     */
    winVisible() {
        return this.boss.dead && Date.now() - this.boss.stateStart > 2000;
    }

    /**
     * Draws the win screen with a hint for the next action.
     */
    drawWin() {
        if (!this.winVisible() || !this.winImg.complete) return;
        let text = LEVELS[this.level + 1] ? `${this.confirmKey()} = Level ${this.level + 1}` : `${this.confirmKey()} = Menü`;
        this.drawOverlay(this.winImg, Date.now() - this.boss.stateStart - 2000, text);
    }

    /**
     * Returns the name of the confirm action: "TIPPEN" on touch devices, otherwise "ENTER".
     * @returns {string} Text for the display.
     */
    confirmKey() {
        return matchMedia("(pointer: coarse)").matches ? "TIPPEN" : "ENTER";
    }

    /**
     * Draws a screen (win or lose) with a darkened background and text.
     * @param {HTMLImageElement} img - Image of the screen.
     * @param {number} since - Time since it appeared in ms (for the fade-in).
     * @param {string} text - Text below the image.
     */
    drawOverlay(img, since, text) {
        let ctx = this.ctx;
        let width = 440;
        ctx.save();
        ctx.globalAlpha = Math.min(1, since / 500);
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(img, (this.canvas.width - width) / 2, 70, width, (width * img.naturalHeight) / img.naturalWidth);
        this.drawOverlayText(text);
        ctx.restore();
    }

    /**
     * Draws the text of the screen with an outline.
     * @param {string} text - Text to draw.
     */
    drawOverlayText(text) {
        let ctx = this.ctx;
        ctx.font = '28px "Permanent Marker"';
        ctx.textAlign = "center";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "black";
        ctx.strokeText(text, this.canvas.width / 2, 340);
        ctx.fillStyle = "#ffd23c";
        ctx.fillText(text, this.canvas.width / 2, 340);
    }

    /**
     * Checks whether the lose screen should appear (1.5 seconds after the character died).
     * @returns {boolean} true if visible.
     */
    loseVisible() {
        return this.character.dead && Date.now() - this.character.deathStart > 1500;
    }

    /**
     * Draws the lose screen with a hint for the restart.
     */
    drawLose() {
        if (!this.loseVisible() || !this.loseImg.complete) return;
        this.drawOverlay(this.loseImg, Date.now() - this.character.deathStart - 1500, `${this.confirmKey()} = Neustart`);
    }
}
