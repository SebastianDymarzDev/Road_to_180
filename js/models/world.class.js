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
    startTime = Date.now();
    LOGO_TIME = 3000;    // so lange ist das Level-Logo zu sehen (mit Ein- und Ausblenden)

    constructor(canvas, keyboard, level = 1) {
        this.level = level;
        this.config = LEVELS[level];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.loadOverlayImages();
        this.createActors();
        this.placeItems();
        this.placeEnemies();
        this.updateInterval = setInterval(() => this.update(), 1000 / 60);
        this.createLayers();
        this.draw();
    }

    loadOverlayImages() {
        this.loseImg = MovableObject.newImage("img_small/assets/lose.webp");
        this.nameImg = MovableObject.newImage(`img_small/level/level${this.level}/level${this.level}_endboss_name.webp`);
        this.winImg = MovableObject.newImage("img_small/assets/win.webp");
        this.logoImg = MovableObject.newImage(`img_small/level/level${this.level}/level${this.level}_logo.webp`);
        document.fonts.load('28px "Permanent Marker"');
    }

    createActors() {
        let bossConfig = this.config.boss;
        this.character = new Character(this.keyboard);
        this.hud = new Hud(this.character);
        this.boss = new Endboss(World.LEVEL_WIDTH - 110, bossConfig);
        this.boss.onThrow = (x, y) => this.projectiles.push(this.newProjectile(x, y));
        this.character.locked = true; // steht still, solange das Level-Logo zu sehen ist
        this.hud.setBoss(this.boss, bossConfig);
        this.character.onThrow = (x, y, left, strong) => this.darts.push(new Dart(x, y, left, strong));
    }

    newProjectile(x, y) {
        let c = this.character;
        return new BossProjectile(x, y, c.x, c.y - 100, this.boss.projectilePath(), this.config.boss.flight);
    }

    createLayers() {
        this.config.background.forEach((layer) => {
            let imgs = layer.sources.map((src) => MovableObject.newImage(src));
            this.layers.push({ imgs: imgs, y: layer.y, speed: layer.speed, dys: layer.dys || [] });
        });
    }

    update() {
        this.updateDarts();
        if (this.character.dead) return this.checkRestart(); // Gegner und Items stehen still
        if (this.boss.dead && this.checkWin()) return;
        this.checkLogo();
        this.checkArena();
        this.boss.update();
        this.updateProjectiles();
        this.enemies.forEach((e) => e.update(this.character));
        this.checkItems();
        this.checkDartHits();
        this.checkEnemyContact();
        this.enemies = this.enemies.filter((e) => !e.removable);
    }

    updateDarts() {
        this.darts.forEach((d) => d.move());
        this.darts = this.darts.filter((d) => !d.isGone() && !d.used);
    }

    updateProjectiles() {
        this.projectiles.forEach((m) => m.move());
        this.checkProjectileHits();
        this.projectiles = this.projectiles.filter((m) => !m.isGone() && !m.used);
    }

    // zufälliges x mit Abstand zu den Objekten in list (höchstens 50 Versuche)
    freeX(minX, maxX, list, gap) {
        let x;
        let tries = 0;
        do {
            x = minX + Math.random() * (maxX - minX);
            tries++;
        } while (tries < 50 && list.some((o) => Math.abs(o.x - x) < gap));
        return x;
    }

    placeItems() {
        for (let type in this.ITEM_COUNT) {
            // Münzen liegen nicht in der Boss-Arena (letzter Bildschirm)
            let maxX = type === "coin" ? World.LEVEL_WIDTH - 720 : World.LEVEL_WIDTH - 150;
            for (let i = 0; i < this.ITEM_COUNT[type]; i++) this.items.push(this.newItem(type, maxX));
        }
    }

    newItem(type, maxX) {
        let lowY = Character.GROUND_Y - 30;   // Bodenhöhe
        let highY = Character.GROUND_Y - 250; // mit Sprung erreichbar
        let x = this.freeX(300, maxX, this.items, 70);
        return new Item(type, x, lowY - Math.random() * (lowY - highY));
    }

    checkLogo() {
        let logoOver = Date.now() - this.startTime > this.LOGO_TIME;
        if (logoOver && !this.arenaActive) this.character.locked = false;
    }

    // Am Levelende (Kamera ganz rechts) beginnt der Bosskampf
    checkArena() {
        let now = Date.now();
        if (!this.arenaActive && this.cameraX >= World.LEVEL_WIDTH - this.canvas.width) this.startArena(now);
        if (this.arenaActive && !this.boss.active && !this.boss.dead && now - this.introStart > this.INTRO_TIME) {
            this.boss.start();
            this.character.locked = false;
        }
    }

    startArena(now) {
        this.arenaActive = true;
        this.introStart = now;
        this.hud.bossBarVisible = true;
        this.character.minX = this.cameraX + 40;    // kein Zurück mehr
        this.character.maxX = this.boss.x - 160;    // nicht in den Boss laufen
        this.enemies = [];                          // normale Gegner verschwinden
        this.character.locked = true;               // keine Steuerung während der Boss-Einblendung
    }

    checkProjectileHits() {
        let box = this.character.getHitbox();
        this.projectiles.forEach((projectile) => {
            if (projectile.used || !this.overlaps(box, projectile.getHitbox())) return;
            if (this.character.takeDamage()) Sound.play(this.config.boss.sounds.hitPlayer);
            projectile.used = true;
        });
    }

    // Level-Logo groß in der Mitte: blendet ein, bleibt stehen und blendet wieder aus
    drawLevelLogo() {
        let t = Date.now() - this.startTime;
        if (t > this.LOGO_TIME || !this.logoImg.complete) return;
        let w = 480;
        let h = (w * this.logoImg.naturalHeight) / this.logoImg.naturalWidth;
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(1, t / 500, (this.LOGO_TIME - t) / 500);
        this.ctx.drawImage(this.logoImg, (this.canvas.width - w) / 2, 90, w, h);
        this.ctx.restore();
    }

    // Der Bossname blendet in der Mitte ein und wandert dann nach oben rechts
    drawIntro() {
        if (!this.arenaActive || !this.nameImg.complete) return;
        let t = Date.now() - this.introStart;
        let k = Math.min(1, Math.max(0, (t - this.INTRO_TIME) / this.NAME_FLY_TIME));
        k = k * k * (3 - 2 * k); // weicher Start und Stopp
        let a = this.nameStart();
        let b = this.nameEnd();
        let mix = (from, to) => from + (to - from) * k;
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(1, t / 300);
        this.ctx.drawImage(this.nameImg, mix(a.x, b.x), mix(a.y, b.y), mix(a.w, b.w), mix(a.h, b.h));
        this.ctx.restore();
    }

    // Name in der Mitte (320 px breit)
    nameStart() {
        let w = 320;
        return { x: (this.canvas.width - w) / 2, y: 150, w: w, h: (w * this.nameImg.naturalHeight) / this.nameImg.naturalWidth };
    }

    // Name oben rechts
    nameEnd() {
        let w = this.nameImg.naturalWidth * this.NAME_SCALE;
        return { x: this.canvas.width - w - 6, y: Hud.Y, w: w, h: this.nameImg.naturalHeight * this.NAME_SCALE };
    }

    // Boss besiegt: Figur jubelt, nach 2 Sekunden erscheint das Sieg-Bild.
    // Gibt true zurück, wenn gerade ein anderes Level oder das Menü gestartet wurde.
    checkWin() {
        if (!this.character.won) this.startWin();
        let pressed = this.keyboard.wasPressed("RESTART"); // immer abfragen, damit alte Tastendrücke verfallen
        if (!this.winVisible()) return false;
        this.saveProgress();
        if (!pressed) return false;
        if (LEVELS[this.level + 1]) startLevel(this.level + 1);
        else leaveGame();
        return true;
    }

    startWin() {
        this.character.win();
        this.projectiles = [];
        Sound.play(LEVELS[this.level + 1] ? "win" : "badge");
    }

    saveProgress() {
        if (this.progressSaved) return;
        this.progressSaved = true;
        unlockLevel(this.level + 1);
    }

    winVisible() {
        return this.boss.dead && Date.now() - this.boss.stateStart > 2000;
    }

    drawWin() {
        if (!this.winVisible() || !this.winImg.complete) return;
        let text = LEVELS[this.level + 1] ? `ENTER = Level ${this.level + 1}` : "ENTER = Menü";
        this.drawOverlay(this.winImg, Date.now() - this.boss.stateStart - 2000, text);
    }

    // dunkler Schleier, Bild und Text; blendet über 500 ms ein
    drawOverlay(img, since, text) {
        let ctx = this.ctx;
        let w = 440;
        ctx.save();
        ctx.globalAlpha = Math.min(1, since / 500);
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(img, (this.canvas.width - w) / 2, 70, w, (w * img.naturalHeight) / img.naturalWidth);
        this.drawOverlayText(text);
        ctx.restore();
    }

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
        this.drawOverlay(this.loseImg, Date.now() - this.character.deathStart - 1500, "ENTER = Neustart");
    }

    randomInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    placeEnemies() {
        let boards = this.randomInt(this.ENEMY_MIN, this.ENEMY_MAX);
        let arrows = this.randomInt(this.ENEMY_MIN, Math.min(this.ENEMY_MAX, this.ENEMY_TOTAL_MAX - boards));
        for (let i = 0; i < boards + arrows; i++) {
            let x = this.freeX(900, World.LEVEL_WIDTH - 1000, this.enemies, 200); // nicht direkt am Start
            this.enemies.push(i < boards ? new Dartboard(x) : this.newArrow(x));
        }
    }

    newArrow(x) {
        let lowY = Character.GROUND_Y - 30;   // tief: darüber springen
        let highY = Character.GROUND_Y - 125; // hoch: drunter wegducken
        return new FlyingArrow(x, highY + Math.random() * (lowY - highY));
    }

    // Dart trifft Gegner
    checkDartHits() {
        this.darts.forEach((dart) => {
            if (!dart.img.complete) return;
            let box = dart.getHitbox();
            this.enemies.forEach((enemy) => this.dartHitsEnemy(dart, box, enemy));
            if (!dart.used) this.dartHitsBoss(dart, box);
        });
    }

    dartHitsEnemy(dart, box, enemy) {
        if (dart.used || enemy.dying || !this.overlaps(box, enemy.getHitbox())) return;
        enemy.hit(dart.damage);
        Sound.play("hitBoard");
        dart.used = true;
    }

    dartHitsBoss(dart, box) {
        if (!this.boss.active || this.boss.dead || !this.overlaps(box, this.boss.getHitbox())) return;
        this.boss.hit(dart.damage);
        Sound.play(this.config.boss.sounds.hitBoss);
        dart.used = true;
    }

    // Figur berührt Gegner: von oben draufgesprungen = Gegner besiegt, sonst Schaden
    checkEnemyContact() {
        let box = this.character.getHitbox();
        this.enemies.forEach((enemy) => {
            if (enemy.dying || !this.overlaps(box, enemy.getHitbox())) return;
            this.contact(enemy, box);
        });
    }

    contact(enemy, box) {
        let c = this.character;
        let feet = box.y + box.h;
        let falling = c.speedY < 0;
        if (falling && feet <= enemy.getHitbox().y + 30) {
            enemy.die("top");
            Sound.play("stomp");
            c.bounce();
        } else if (c.takeDamage()) {
            Sound.play("hitHuman");
        }
    }

    overlaps(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    checkItems() {
        let box = this.character.getHitbox();
        this.items = this.items.filter((item) => {
            if (!item.img.complete || !this.overlaps(box, item.getHitbox())) return true;
            return !this.collect(item.type);
        });
    }

    // true, wenn das Item eingesammelt wurde (volle Leiste: Item bleibt liegen)
    collect(type) {
        let c = this.character;
        if (type === "coin") { c.coins++; Sound.play("coin"); return true; }
        if (type === "dart" && c.darts < c.maxDarts) { c.darts++; Sound.play("arrow"); return true; }
        if (type === "drink" && c.health < c.maxHealth) { c.health++; Sound.play("energy"); return true; }
        return false;
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
        this.drawEntities();
        this.hud.draw(this.ctx);
        this.drawIntro();
        this.drawLevelLogo();
        this.drawWin();
        this.drawLose();
        requestAnimationFrame(() => this.draw());
    }

    drawEntities() {
        let ctx = this.ctx;
        ctx.save();
        ctx.translate(-this.cameraX, 0);
        this.drawVisible(this.items, 60, 780);    // nur sichtbare Items
        this.drawVisible(this.enemies, 150, 870); // nur sichtbare Gegner
        this.drawVisible([this.boss], 150, 870);
        this.character.draw(ctx);
        this.darts.forEach((d) => d.draw(ctx));
        this.projectiles.forEach((m) => m.draw(ctx));
        ctx.restore();
    }

    drawVisible(list, left, right) {
        list.forEach((o) => {
            if (o.x > this.cameraX - left && o.x < this.cameraX + right) o.draw(this.ctx);
        });
    }

    stop() {
        this.running = false;
        this.character.stop();
        clearInterval(this.updateInterval);
    }
}
