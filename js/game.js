let canvas;
let world;
let keyboard = new Keyboard();

function init() {
    canvas = document.getElementById("canvas");
    world = new World(canvas, keyboard);
}

function showMenu() {
    setTimeout(() => {
        document.getElementById("menu").classList.add("compact");
    }, 1500);
}

function showLevelSelect() {
    document.getElementById("menu").classList.add("levels");
}

function hideLevelSelect() {
    document.getElementById("menu").classList.remove("levels");
}

function startLevel(level) {
    let menu = document.getElementById("menu");
    menu.classList.remove("levels");
    menu.classList.add("playing");
    if (world) world.stop();
    init();
}

function leaveGame() {
    document.getElementById("menu").classList.remove("playing");
    if (world) { world.stop(); world = null; }
}