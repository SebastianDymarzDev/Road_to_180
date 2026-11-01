let canvas;
let world;
let keyboard = new Keyboard();
let currentLevel = 1;

function init() {
    canvas = document.getElementById("canvas");
    world = new World(canvas, keyboard, currentLevel);
}

// Höchstes freigeschaltetes Level (im Browser gespeichert)
function getUnlockedLevel() {
    try {
        return parseInt(localStorage.getItem("road180_unlocked")) || 1;
    } catch (e) {
        return 1;
    }
}

// Schaltet ein Level frei, aber nur wenn es in levels.js existiert
function unlockLevel(level) {
    if (!LEVELS[level] || level <= getUnlockedLevel()) return;
    try {
        localStorage.setItem("road180_unlocked", level);
    } catch (e) {}
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
    init();
}

function restartLevel() {
    startLevel(currentLevel);
}

function leaveGame() {
    document.getElementById("menu").classList.remove("playing");
    if (world) { world.stop(); world = null; }
}