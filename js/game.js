let canvas;
let world;
let keyboard = new Keyboard();
let currentLevel = 1;
let levelRun = 0;

/**
 * Creates the canvas reference and the world for the current level.
 */
function init() {
    canvas = document.getElementById("canvas");
    world = new World(canvas, keyboard, currentLevel);
}

/**
 * Unlocks a level if it exists and is not unlocked yet.
 * @param {number} level - Level number.
 */
function unlockLevel(level) {
    if (!LEVELS[level] || level <= getUnlockedLevel()) return;
    writeStorage(UNLOCKED_KEY, level);
}

/**
 * Enables or locks the level buttons according to the progress.
 */
function updateLevelButtons() {
    let unlocked = getUnlockedLevel();
    document.querySelectorAll(".level-btn").forEach((btn, i) => {
        let level = i + 1;
        let open = level <= unlocked && LEVELS[level];
        btn.classList.toggle("locked", !open);
        btn.disabled = !open;
        btn.onclick = open ? () => startLevel(level) : null;
    });
}

/**
 * Sets up the main menu: buttons, sound, touch controls and music. After 1.5 seconds the menu shrinks.
 */
function showMenu() {
    updateLevelButtons();
    Sound.unlockOnFirstInput();
    Sound.preload();
    initTouch();
    preloadTouchImages();
    disableTransitionsOnResize();
    Sound.start("menuMusic");
    setTimeout(() => {
        document.getElementById("menu").classList.add("compact");
    }, 1500);
}

/**
 * Disables all transitions while the window is being resized, so the layout follows immediately.
 */
function disableTransitionsOnResize() {
    let timer;
    window.addEventListener("resize", () => {
        document.body.classList.add("resizing");
        clearTimeout(timer);
        timer = setTimeout(() => document.body.classList.remove("resizing"), 100);
    });
}

/**
 * Shows the level selection.
 */
function showLevelSelect() {
    updateLevelButtons();
    document.getElementById("menu").classList.add("levels");
}

/**
 * Hides the level selection again.
 */
function hideLevelSelect() {
    document.getElementById("menu").classList.remove("levels");
}

/**
 * Starts a level: hides the menu, rebuilds the world and starts the music.
 * @param {number} level - Level number.
 */
function startLevel(level) {
    if (isSmallTouchDevice()) enterImmersive();
    currentLevel = level;
    let menu = document.getElementById("menu");
    menu.classList.remove("levels");
    menu.classList.add("playing");
    if (world) world.stop();
    Sound.stop("menuMusic");
    Sound.stop("gameMusic");
    startGameMusicAfterJingle();
    init();
}

/**
 * Checks whether the device is a touch device whose screen is smaller than the game field.
 * @returns {boolean} true if the game should fill the whole screen.
 */
function isSmallTouchDevice() {
    return matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 480;
}

/**
 * Switches to the full-screen layout and requests fullscreen (this only works right after a tap).
 */
function enterImmersive() {
    let menu = document.getElementById("menu");
    menu.classList.add("immersive");
    if (!document.fullscreenElement && menu.requestFullscreen) menu.requestFullscreen().catch(() => {});
}

/**
 * Plays the level start jingle and then starts the game music if the round is still running.
 */
function startGameMusicAfterJingle() {
    let run = ++levelRun;
    Sound.playThen("levelStart", () => {
        if (run === levelRun && world && !world.character.dead && !world.character.won) Sound.start("gameMusic");
    });
}

/**
 * Restarts the current level.
 */
function restartLevel() {
    startLevel(currentLevel);
}

/**
 * Switches the game field between fullscreen and window.
 */
function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.getElementById("canvas").requestFullscreen();
}

/**
 * Leaves the game and returns to the menu (exits fullscreen, stops the world, switches the music).
 */
function leaveGame() {
    if (document.fullscreenElement) document.exitFullscreen();
    document.getElementById("menu").classList.remove("playing", "immersive");
    if (world) { world.stop(); world = null; }
    levelRun++;
    Sound.stop("gameMusic");
    Sound.start("menuMusic");
}
