class World {
    static LEVEL_WIDTH = 720 * 20; // Levellänge in px, hier einstellbar
    static CAMERA_OFFSET = 200;   // Bildschirm-x, an dem die Figur beim Scrollen bleibt

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
    items = [];
    enemies = [];

    // Anzahl der Items pro Level (zufällig verteilt)
    ITEM_COUNT = { coin: 40, dart: 6, drink: 4 };
    // Gegner pro Level: je 10 bis 30, zusammen höchstens 40 (zufällig)
    ENEMY_MIN = 10;
    ENEMY_MAX = 30;
    ENEMY_TOTAL_MAX = 40;
    cameraX = 0;
    running = true;

    constructor(canvas, keyboard) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.character = new Character(keyboard);
        this.hud = new Hud(this.character);
        this.placeItems();
        this.placeEnemies();
        this.character.onThrow = (x, y, left, strong) => this.darts.push(new Dart(x, y, left, strong));
        this.updateInterval = setInterval(() => {
            this.darts.forEach((d) => d.move());
            this.darts = this.darts.filter((d) => !d.isGone() && !d.used);
            this.enemies.forEach((e) => e.update(this.character));
            this.checkItems();
            this.checkDartHits();
            this.checkEnemyContact();
            this.enemies = this.enemies.filter((e) => !e.removable);
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

    placeItems() {
        let minX = 300;
        let maxX = World.LEVEL_WIDTH - 150;
        let lowY = Character.GROUND_Y - 30;   // Bodenhöhe
        let highY = Character.GROUND_Y - 250; // mit Sprung erreichbar
        for (let type in this.ITEM_COUNT) {
            for (let i = 0; i < this.ITEM_COUNT[type]; i++) {
                let x, y;
                let tries = 0;
                do {
                    x = minX + Math.random() * (maxX - minX);
                    y = lowY - Math.random() * (lowY - highY);
                    tries++;
                } while (tries < 50 && this.items.some((it) => Math.abs(it.x - x) < 70));
                this.items.push(new Item(type, x, y));
            }
        }
    }

    randomInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    placeEnemies() {
        let boards = this.randomInt(this.ENEMY_MIN, this.ENEMY_MAX);
        let arrows = this.randomInt(this.ENEMY_MIN, Math.min(this.ENEMY_MAX, this.ENEMY_TOTAL_MAX - boards));
        let minX = 900; // nicht direkt am Start
        let maxX = World.LEVEL_WIDTH - 300;
        let lowY = Character.GROUND_Y - 30;   // tief: darüber springen
        let highY = Character.GROUND_Y - 125; // hoch: drunter wegducken
        let total = boards + arrows;
        for (let i = 0; i < total; i++) {
            let x;
            let tries = 0;
            do {
                x = minX + Math.random() * (maxX - minX);
                tries++;
            } while (tries < 50 && this.enemies.some((e) => Math.abs(e.x - x) < 200));
            if (i < boards) {
                this.enemies.push(new Dartboard(x));
            } else {
                this.enemies.push(new FlyingArrow(x, highY + Math.random() * (lowY - highY)));
            }
        }
    }

    // Dart trifft Gegner
    checkDartHits() {
        this.darts.forEach((dart) => {
            if (!dart.img.complete) return;
            let box = dart.getHitbox();
            this.enemies.forEach((enemy) => {
                if (dart.used || enemy.dying || !this.overlaps(box, enemy.getHitbox())) return;
                enemy.hit(dart.damage);
                dart.used = true;
            });
        });
    }

    // Figur berührt Gegner: von oben draufgesprungen = Gegner besiegt, sonst Schaden
    checkEnemyContact() {
        let c = this.character;
        let box = c.getHitbox();
        this.enemies.forEach((enemy) => {
            if (enemy.dying || !this.overlaps(box, enemy.getHitbox())) return;
            let feet = box.y + box.h;
            let falling = c.speedY < 0;
            if (falling && feet <= enemy.getHitbox().y + 30) {
                enemy.die("top");
                c.bounce();
            } else {
                c.takeDamage();
            }
        });
    }

    overlaps(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    checkItems() {
        let c = this.character;
        let box = c.getHitbox();
        this.items = this.items.filter((item) => {
            if (!item.img.complete || !this.overlaps(box, item.getHitbox())) return true;
            if (item.type === "coin") {
                c.coins++;
            } else if (item.type === "dart") {
                if (c.darts >= c.maxDarts) return true; // Leiste voll: Item bleibt liegen
                c.darts++;
            } else if (item.type === "drink") {
                if (c.health >= c.maxHealth) return true; // Leben voll: Item bleibt liegen
                c.health++;
            }
            return false;
        });
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
        this.items.forEach((it) => {
            if (it.x > this.cameraX - 60 && it.x < this.cameraX + 780) it.draw(this.ctx); // nur sichtbare Items
        });
        this.enemies.forEach((e) => {
            if (e.x > this.cameraX - 150 && e.x < this.cameraX + 870) e.draw(this.ctx); // nur sichtbare Gegner
        });
        this.character.draw(this.ctx);
        this.darts.forEach((d) => d.draw(this.ctx));
        this.ctx.restore();
        this.hud.draw(this.ctx);

        requestAnimationFrame(() => this.draw());
    }

    stop() {
        this.running = false;
        this.character.stop();
        clearInterval(this.updateInterval);
    }
}