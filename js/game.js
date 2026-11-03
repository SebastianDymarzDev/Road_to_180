let canvas;
let world;
let keyboard = new Keyboard();
let currentLevel = 1;
let levelRun = 0; // zählt Levelstarts, damit eine alte Startmusik-Weiterleitung verfällt

function init() {
    canvas = document.getElementById("canvas");
    world = new World(canvas, keyboard, currentLevel);
}

// Schaltet ein Level frei, aber nur wenn es in levels.js existiert
function unlockLevel(level) {
    if (!LEVELS[level] || level <= getUnlockedLevel()) return;
    writeStorage(UNLOCKED_KEY, level);
}

// Badges im Level-Menü: freigeschaltete Level sind anklickbar, die anderen dunkel
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

function showMenu() {
    updateLevelButtons();
    Sound.unlockOnFirstInput();
    Sound.preload();
    initTouch();
    preloadTouchImages();
    Sound.start("menuMusic");
    setTimeout(() => {
        document.getElementById("menu").classList.add("compact");
    }, 1500);
}

function showLevelSelect() {
    updateLevelButtons();
    document.getElementById("menu").classList.add("levels");
}

function hideLevelSelect() {
    document.getElementById("menu").classList.remove("levels");
}

function startLevel(level) {
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

// Spielmusik beginnt erst, wenn die Startmusik zu Ende ist
function startGameMusicAfterJingle() {
    let run = ++levelRun;
    Sound.playThen("levelStart", () => {
        if (run === levelRun && world && !world.character.dead && !world.character.won) Sound.start("gameMusic");
    });
}

function restartLevel() {
    startLevel(currentLevel);
}

// Spielfeld im Vollbild ein- oder ausschalten (Esc beendet das Vollbild)
function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.getElementById("canvas").requestFullscreen();
}

function leaveGame() {
    if (document.fullscreenElement) document.exitFullscreen();
    document.getElementById("menu").classList.remove("playing");
    if (world) { world.stop(); world = null; }
    levelRun++; // alte Startmusik darf keine Spielmusik mehr starten
    Sound.stop("gameMusic");
    Sound.start("menuMusic");
}
