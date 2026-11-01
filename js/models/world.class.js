class World {
    static LEVEL_WIDTH = 720 * 20; // Levellänge in px, hier einstellbar
    static CAMERA_OFFSET = 200;   // Bildschirm-x, an dem die Figur beim Scrollen bleibt

    layers = [];
    darts = [];
    items = [];
    enemies = [];
    projectiles = [];
    arenaActive = false;
    introStart = 0;
    INTRO_TIME = 2000;   // so lange steht der Bossname in der Mitte, danach fängt der Boss an
    NAME_FLY_TIME = 700; // so lange wandert der Name nach oben rechts
    NAME_SCALE = 0.5;    // Größe des Namens oben rechts (Original 360x120 px)

    // Anzahl der Items pro Level (zufällig verteilt)
    ITEM_COUNT = { coin: 40, dart: 6, drink: 4 };
    // Gegner pro Level: je 10 bis 30, zusammen höchstens 40 (zufällig)
    ENEMY_MIN = 10;
    ENEMY_MAX = 30;
    ENEMY_TOTAL_MAX = 40;
    cameraX = 0;
    running = true;

    constructor(canvas, keyboard, level = 1) {
        this.level = level;
        this.config = LEVELS[level];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.loseImg = new Image();
        this.loseImg.src = "img_small/assets/lose.webp";
        document.fonts.load('28px "Permanent Marker"');
        this.character = new Character(keyboard);
        this.hud = new Hud(this.character);
        this.boss = new Endboss(World.LEVEL_WIDTH - 110, this.config.boss);
        this.boss.onThrow = (x, y) =>
            this.projectiles.push(
                new BossProjectile(x, y, this.character.x, this.character.y - 100, this.boss.projectilePath(), this.config.boss.flight)
            );
        this.hud.setBoss(this.boss, this.config.boss);
        this.nameImg = new Image();
        this.nameImg.src = `img_small/level/level${level}/level${level}_endboss_name.webp`;
        this.winImg = new Image();
        this.winImg.src = "img_small/assets/win.webp";
        this.placeItems();
        this.placeEnemies();
        this.character.onThrow = (x, y, left, strong) => this.darts.push(new Dart(x, y, left, strong));
        this.updateInterval = setInterval(() => {
            this.darts.forEach((d) => d.move());
            this.darts = this.darts.filter((d) => !d.isGone() && !d.used);
            if (this.character.dead) {
                this.checkRestart(); // Gegner und Items stehen still
                return;
            }
            if (this.boss.dead && this.checkWin()) return;
            this.checkArena();
            this.boss.update();
            this.projectiles.forEach((m) => m.move());
            this.checkProjectileHits();
            this.projectiles = this.projectiles.filter((m) => !m.isGone() && !m.used);
            this.enemies.forEach((e) => e.update(this.character));
            this.checkItems();
            this.checkDartHits();
            this.checkEnemyContact();
            this.enemies = this.enemies.filter((e) => !e.removable);
        }, 1000 / 60);
        this.config.background.forEach((layer) => {
            let imgs = layer.sources.map((src) => {
                let img = new Image();
                img.src = src;
                return img;
            });
            this.layers.push({ imgs: imgs, y: layer.y, speed: layer.speed, dys: layer.dys || [] });
        });
        this.draw();
    }

    placeItems() {
        let minX = 300;
        let lowY = Character.GROUND_Y - 30;   // Bodenhöhe
        let highY = Character.GROUND_Y - 250; // mit Sprung erreichbar
        for (let type in this.ITEM_COUNT) {
            // Münzen liegen nicht in der Boss-Arena (letzter Bildschirm)
            let maxX = type === "coin" ? World.LEVEL_WIDTH - 720 : World.LEVEL_WIDTH - 150;
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

    // Am Levelende (Kamera ganz rechts) beginnt der Bosskampf
    checkArena() {
        let now = Date.now();
        if (!this.arenaActive && this.cameraX >= World.LEVEL_WIDTH - this.canvas.width) {
            this.arenaActive = true;
            this.introStart = now;
            this.hud.bossBarVisible = true;
            this.character.minX = this.cameraX + 40;    // kein Zurück mehr
            this.character.maxX = this.boss.x - 160;    // nicht in den Boss laufen
            this.enemies = [];                          // normale Gegner verschwinden
            this.character.locked = true;               // keine Steuerung während der Boss-Einblendung
        }
        if (this.arenaActive && !this.boss.active && !this.boss.dead && now - this.introStart > this.INTRO_TIME) {
            this.boss.start();
            this.character.locked = false;
        }
    }

    checkProjectileHits() {
        let box = this.character.getHitbox();
        this.projectiles.forEach((projectile) => {
            if (projectile.used || !this.overlaps(box, projectile.getHitbox())) return;
            this.character.takeDamage();
            projectile.used = true;
        });
    }

    // Der Bossname blendet in der Mitte ein und wandert dann nach oben rechts
    drawIntro() {
        if (!this.arenaActive || !this.nameImg.complete) return;
        let t = Date.now() - this.introStart;
        let img = this.nameImg;
        let w0 = 320;
        let h0 = (w0 * img.naturalHeight) / img.naturalWidth;
        let x0 = (this.canvas.width - w0) / 2;
        let y0 = 150;
        let w1 = img.naturalWidth * this.NAME_SCALE;
        let h1 = img.naturalHeight * this.NAME_SCALE;
        let x1 = this.canvas.width - w1 - 6;
        let y1 = Hud.Y;
        let k = Math.min(1, Math.max(0, (t - this.INTRO_TIME) / this.NAME_FLY_TIME));
        k = k * k * (3 - 2 * k); // weicher Start und Stopp
        let ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = Math.min(1, t / 300);
        ctx.drawImage(img, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, w0 + (w1 - w0) * k, h0 + (h1 - h0) * k);
        ctx.restore();
    }

    // Boss besiegt: Figur jubelt, nach 2 Sekunden erscheint das Sieg-Bild.
    // Gibt true zurück, wenn gerade ein anderes Level oder das Menü gestartet wurde.
    checkWin() {
        if (!this.character.won) {
            this.character.win();
            this.projectiles = [];
        }
        let pressed = this.keyboard.wasPressed("RESTART"); // immer abfragen, damit alte Tastendrücke verfallen
        if (!this.winVisible()) return false;
        if (!this.progressSaved) {
            this.progressSaved = true;
            unlockLevel(this.level + 1);
        }
        if (!pressed) return false;
        if (LEVELS[this.level + 1]) startLevel(this.level + 1);
        else leaveGame();
        return true;
    }

    winVisible() {
        return this.boss.dead && Date.now() - this.boss.stateStart > 2000;
    }

    drawWin() {
        if (!this.winVisible() || !this.winImg.complete) return;
        let ctx = this.ctx;
        let t = Date.now() - this.boss.stateStart - 2000;
        ctx.save();
        ctx.globalAlpha = Math.min(1, t / 500); // blendet weich ein
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let w = 440;
        let h = (w * this.winImg.naturalHeight) / this.winImg.naturalWidth;
        ctx.drawImage(this.winImg, (this.canvas.width - w) / 2, 70, w, h);
        let text = LEVELS[this.level + 1] ? `ENTER = Level ${this.level + 1}` : "ENTER = Menü";
        ctx.font = '28px "Permanent Marker"';
        ctx.textAlign = "center";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "black";
        ctx.strokeText(text, this.canvas.width / 2, 340);
        ctx.fillStyle = "#ffd23c";
        ctx.fillText(text, this.canvas.width / 2, 340);
        ctx.restore();
    }

    // Das Game-Over-Bild erscheint 1,5 Sekunden nach dem Tod
    loseVisible() {
        return this.character.dead && Date.now() - this.character.deathStart > 1500;
    }

    checkRestart() {
        let pressed = this.keyboard.wasPressed("RESTART"); // immer abfragen, damit alte Tastendrücke verfallen
        if (pressed && this.loseVisible()) restartLevel();
    }

    drawLose() {
        if (!this.loseVisible() || !this.loseImg.complete) return;
        let ctx = this.ctx;
        let t = Date.now() - this.character.deathStart - 1500;
        ctx.save();
        ctx.globalAlpha = Math.min(1, t / 500); // blendet weich ein
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let w = 440;
        let h = (w * this.loseImg.naturalHeight) / this.loseImg.naturalWidth;
        ctx.drawImage(this.loseImg, (this.canvas.width - w) / 2, 70, w, h);
        ctx.font = '28px "Permanent Marker"';
        ctx.textAlign = "center";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "black";
        ctx.strokeText("ENTER = Neustart", this.canvas.width / 2, 340);
        ctx.fillStyle = "#ffd23c";
        ctx.fillText("ENTER = Neustart", this.canvas.width / 2, 340);
        ctx.restore();
    }

    randomInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    placeEnemies() {
        let boards = this.randomInt(this.ENEMY_MIN, this.ENEMY_MAX);
        let arrows = this.randomInt(this.ENEMY_MIN, Math.min(this.ENEMY_MAX, this.ENEMY_TOTAL_MAX - boards));
        let minX = 900; // nicht direkt am Start
        let maxX = World.LEVEL_WIDTH - 1000;
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
            if (!dart.used && this.boss.active && !this.boss.dead && this.overlaps(box, this.boss.getHitbox())) {
                this.boss.hit(dart.damage);
                dart.used = true;
            }
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
        if (this.arenaActive) {
            this.cameraX = World.LEVEL_WIDTH - this.canvas.width; // in der Boss-Arena steht die Kamera fest
            return;
        }
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
            this.ctx.drawImage(img, x, layer.y + (layer.dys[n % layer.imgs.length] || 0), 720, 480);
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
        if (this.boss.x > this.cameraX - 150 && this.boss.x < this.cameraX + 870) this.boss.draw(this.ctx);
        this.character.draw(this.ctx);
        this.darts.forEach((d) => d.draw(this.ctx));
        this.projectiles.forEach((m) => m.draw(this.ctx));
        this.ctx.restore();
        this.hud.draw(this.ctx);
        this.drawIntro();
        this.drawWin();
        this.drawLose();

        requestAnimationFrame(() => this.draw());
    }

    stop() {
        this.running = false;
        this.character.stop();
        clearInterval(this.updateInterval);
    }
}