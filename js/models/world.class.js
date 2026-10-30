class World {
    static LEVEL_WIDTH = 720 * 5; // Levellänge in px, hier einstellbar
    static CAMERA_OFFSET = 300;   // Bildschirm-x, an dem die Figur beim Scrollen bleibt

    // speed: 0 = steht, 1 = bewegt sich mit der Figur, dazwischen = Parallax
    // sources werden abwechselnd hintereinander gekachelt
    BACKGROUND = [
        { sources: ["img_small/level/level1/level1_layer1.webp"], y: 0, speed: 0 },
        {
            sources: [
                "img_small/level/level1/level1_layer2_1.webp",
                "img_small/level/level1/level1_layer2_2.webp",
            ],
            y: 40,
            speed: 0.5,
        },
        {
            sources: [
                "img_small/level/level1/level1_layer3_1.webp",
                "img_small/level/level1/level1_layer3_2.webp",
            ],
            y: 100,
            speed: 1,
        },
    ];
    layers = [];
    darts = [];
    cameraX = 0;
    running = true;

    constructor(canvas, keyboard) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.character = new Character(keyboard);
        this.character.onThrow = (x, y, left) => this.darts.push(new Dart(x, y, left));
        this.updateInterval = setInterval(() => {
            this.darts.forEach((d) => d.move());
            this.darts = this.darts.filter((d) => !d.isGone());
        }, 1000 / 60);
        this.BACKGROUND.forEach((layer) => {
            let imgs = layer.sources.map((src) => {
                let img = new Image();
                img.src = src;
                return img;
            });
            this.layers.push({ imgs: imgs, y: layer.y, speed: layer.speed });
        });
        this.draw();
    }

    updateCamera() {
        let target = this.character.x - World.CAMERA_OFFSET;
        let max = World.LEVEL_WIDTH - this.canvas.width;
        this.cameraX = Math.max(0, Math.min(max, target));
    }

    drawLayer(layer) {
        let offset = this.cameraX * layer.speed;
        let first = Math.floor(offset / 720);
        for (let n = first; n <= first + 1; n++) {
            let img = layer.imgs[n % layer.imgs.length];
            if (!img.complete) continue;
            let x = Math.round(n * 720 - offset);
            this.ctx.drawImage(img, x, layer.y, 720, 480);
        }
    }

    draw() {
        if (!this.running) return;
        this.updateCamera();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.layers.forEach((layer) => this.drawLayer(layer));

        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);
        this.character.draw(this.ctx);
        this.darts.forEach((d) => d.draw(this.ctx));
        this.ctx.restore();

        requestAnimationFrame(() => this.draw());
    }

    stop() {
        this.running = false;
        this.character.stop();
        clearInterval(this.updateInterval);
    }
}