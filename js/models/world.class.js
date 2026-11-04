/**
 * The game world of a level: setup, game loop, placing enemies and items, boss arena and win/lose handling.
 * Drawing is inherited from WorldDrawing, collisions from WorldCollisions.
 */
class World extends WorldCollisions {
    static LEVEL_WIDTH = 720 * 20;
    static CAMERA_OFFSET = 200;

    layers = [];
    darts = [];
    items = [];
    enemies = [];
    projectiles = [];
    arenaActive = false;
    introStart = 0;
    INTRO_TIME = 2000;
    NAME_FLY_TIME = 700;
    NAME_SCALE = 0.5;

    ITEM_COUNT = { coin: 40, dart: 6, drink: 4 };
    ENEMY_MIN = 10;
    ENEMY_MAX = 30;
    ENEMY_TOTAL_MAX = 40;
    cameraX = 0;
    running = true;
    startTime = Date.now();
    LOGO_TIME = 3000;

    /**
     * @param {HTMLCanvasElement} canvas - Game field.
     * @param {Keyboard} keyboard - Input.
     * @param {number} [level] - Level number.
     */
    constructor(canvas, keyboard, level = 1) {
        super();
        this.level = level;
        this.config = LEVELS[level];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.loadOverlayImages();
        this.createActors();
        this.placeObjects();
        this.updateInterval = setInterval(() => this.update(), 1000 / 60);
        this.createLayers();
        this.draw();
    }

    /**
     * Loads the images for the level logo, boss name, win and lose screens.
     */
    loadOverlayImages() {
        this.loseImg = MovableObject.newImage("img_small/assets/lose.webp");
        this.nameImg = MovableObject.newImage(`img_small/level/level${this.level}/level${this.level}_endboss_name.webp`);
        this.winImg = MovableObject.newImage("img_small/assets/win.webp");
        this.logoImg = MovableObject.newImage(`img_small/level/level${this.level}/level${this.level}_logo.webp`);
        document.fonts.load('28px "Permanent Marker"');
    }

    /**
     * Creates character, displays and end boss and connects the throws with the world. The character is locked until the logo fade is over.
     */
    createActors() {
        let bossConfig = this.config.boss;
        this.character = new Character(this.keyboard);
        this.hud = new Hud(this.character);
        this.boss = new Endboss(World.LEVEL_WIDTH - 110, bossConfig);
        this.boss.onThrow = (x, y) => this.projectiles.push(this.newProjectile(x, y));
        this.character.locked = true;
        this.hud.setBoss(this.boss, bossConfig);
        this.character.onThrow = (x, y, left, strong) => this.darts.push(new Dart(x, y, left, strong));
    }

    /**
     * Creates a boss projectile that flies to the current position of the character.
     * @param {number} x - Start position.
     * @param {number} y - Start position.
     * @returns {BossProjectile} The projectile.
     */
    newProjectile(x, y) {
        let character = this.character;
        return new BossProjectile(x, y, character.x, character.y - 100, this.boss.projectilePath(), this.config.boss.flight);
    }

    /**
     * Loads the background layers of the level.
     */
    createLayers() {
        this.config.background.forEach((layer) => {
            let imgs = layer.sources.map((src) => MovableObject.newImage(src));
            this.layers.push({ imgs: imgs, y: layer.y, speed: layer.speed, dys: layer.dys || [] });
        });
    }

    /**
     * One game step (60 times per second): movements, collisions, win and restart.
     */
    update() {
        this.updateDarts();
        if (this.character.dead) return this.checkRestart();
        if (this.boss.dead && this.checkWin()) return;
        this.checkLogo();
        this.checkArena();
        this.boss.update();
        this.updateProjectiles();
        this.enemies.forEach((enemy) => enemy.update(this.character));
        this.checkItems();
        this.checkDartHits();
        this.checkEnemyContact();
        this.enemies = this.enemies.filter((enemy) => !enemy.removable);
    }

    /**
     * Moves the darts and removes used ones.
     */
    updateDarts() {
        this.darts.forEach((dart) => dart.move());
        this.darts = this.darts.filter((dart) => !dart.isGone() && !dart.used);
    }

    /**
     * Moves the boss projectiles, checks hits and removes used ones.
     */
    updateProjectiles() {
        this.projectiles.forEach((projectile) => projectile.move());
        this.checkProjectileHits();
        this.projectiles = this.projectiles.filter((projectile) => !projectile.isGone() && !projectile.used);
    }

    /**
     * Finds a random X position with a distance to the objects of the list (after at most 50 tries the last one is used).
     * @param {number} minX - Smallest allowed position.
     * @param {number} maxX - Largest allowed position.
     * @param {{x: number}[]} list - Objects already placed.
     * @param {number} gap - Minimum distance.
     * @returns {number} The position found.
     */
    freeX(minX, maxX, list, gap) {
        let x;
        let tries = 0;
        do {
            x = minX + Math.random() * (maxX - minX);
            tries++;
        } while (tries < 50 && list.some((other) => Math.abs(other.x - x) < gap));
        return x;
    }

    /**
     * Places all items and enemies of the level.
     */
    placeObjects() {
        this.placeItems();
        this.placeEnemies();
    }

    /**
     * Randomly distributes coins, darts and energy drinks in the level.
     */
    placeItems() {
        for (let type in this.ITEM_COUNT) {
            let maxX = type === "coin" ? World.LEVEL_WIDTH - 720 : World.LEVEL_WIDTH - 150;
            for (let i = 0; i < this.ITEM_COUNT[type]; i++) this.items.push(this.newItem(type, maxX));
        }
    }

    /**
     * Creates an item at a free position at a random height.
     * @param {"coin"|"dart"|"drink"} type - Kind of item.
     * @param {number} maxX - Largest allowed X position.
     * @returns {Item} The item.
     */
    newItem(type, maxX) {
        let lowY = Character.GROUND_Y - 30;
        let highY = Character.GROUND_Y - 250;
        let x = this.freeX(300, maxX, this.items, 70);
        return new Item(type, x, lowY - Math.random() * (lowY - highY));
    }

    /**
     * Releases the character as soon as the logo fade is over (unless the boss fight begins).
     */
    checkLogo() {
        let logoOver = Date.now() - this.startTime > this.LOGO_TIME;
        if (logoOver && !this.arenaActive) this.character.locked = false;
    }

    /**
     * Starts the boss arena at the end of the level and the fight after the intro.
     */
    checkArena() {
        let now = Date.now();
        if (!this.arenaActive && this.cameraX >= World.LEVEL_WIDTH - this.canvas.width) this.startArena(now);
        if (this.arenaActive && !this.boss.active && !this.boss.dead && now - this.introStart > this.INTRO_TIME) {
            this.boss.start();
            this.character.locked = false;
        }
    }

    /**
     * Begins the boss fight section: camera and walking area are fixed and the enemies disappear.
     * @param {number} now - Current time in ms.
     */
    startArena(now) {
        this.arenaActive = true;
        this.introStart = now;
        this.hud.bossBarVisible = true;
        this.character.minX = this.cameraX + 40;
        this.character.maxX = this.boss.x - 160;
        this.enemies = [];
        this.character.locked = true;
    }

    /**
     * Handles the win: saves the progress and on Enter goes to the next level or to the menu.
     * @returns {boolean} true if the level was left.
     */
    checkWin() {
        if (!this.character.won) this.startWin();
        let pressed = this.keyboard.wasPressed("RESTART");
        if (!this.winVisible()) return false;
        this.saveProgress();
        if (!pressed) return false;
        if (LEVELS[this.level + 1]) startLevel(this.level + 1);
        else leaveGame();
        return true;
    }

    /**
     * Starts the win: character cheers, projectiles disappear, win jingle plays.
     */
    startWin() {
        this.character.win();
        this.projectiles = [];
        Sound.play(LEVELS[this.level + 1] ? "win" : "badge");
    }

    /**
     * Unlocks the next level (only once per round).
     */
    saveProgress() {
        if (this.progressSaved) return;
        this.progressSaved = true;
        unlockLevel(this.level + 1);
    }

    /**
     * Restarts the level when Enter is pressed after losing.
     */
    checkRestart() {
        let pressed = this.keyboard.wasPressed("RESTART");
        if (pressed && this.loseVisible()) restartLevel();
    }

    /**
     * Returns a random integer.
     * @param {number} min - Smallest value (inclusive).
     * @param {number} max - Largest value (inclusive).
     * @returns {number} Random number.
     */
    randomInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    /**
     * Randomly distributes dartboards and flying arrows in the level (at most ENEMY_TOTAL_MAX in total).
     */
    placeEnemies() {
        let boards = this.randomInt(this.ENEMY_MIN, this.ENEMY_MAX);
        let arrows = this.randomInt(this.ENEMY_MIN, Math.min(this.ENEMY_MAX, this.ENEMY_TOTAL_MAX - boards));
        for (let i = 0; i < boards + arrows; i++) {
            let x = this.freeX(900, World.LEVEL_WIDTH - 1000, this.enemies, 200);
            this.enemies.push(i < boards ? new Dartboard(x) : this.newArrow(x));
        }
    }

    /**
     * Creates a flying arrow at a random height.
     * @param {number} x - Position in world coordinates.
     * @returns {FlyingArrow} The arrow.
     */
    newArrow(x) {
        let lowY = Character.GROUND_Y - 30;
        let highY = Character.GROUND_Y - 125;
        return new FlyingArrow(x, highY + Math.random() * (lowY - highY));
    }

    /**
     * Ends the game: drawing, timers and character.
     */
    stop() {
        this.running = false;
        this.character.stop();
        clearInterval(this.updateInterval);
    }
}
