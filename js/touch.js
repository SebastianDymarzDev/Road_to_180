// Bildschirm-Tasten für Touch-Geräte: jede Taste drückt eine Taste im Keyboard (Belegung: Keyboard.KEYS)
let chargeShown = false;

function initTouch() {
    document.querySelectorAll(".touch-btn").forEach((btn) => {
        btn.addEventListener("pointerdown", (e) => touchDown(e, btn));
        ["pointerup", "pointercancel"].forEach((type) => btn.addEventListener(type, () => touchUp(btn)));
        btn.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    // Tippen aufs Spielfeld ersetzt Enter (Weiter / Neustart)
    document.getElementById("canvas").addEventListener("pointerdown", () => {
        keyboard.press("Enter");
        keyboard.release("Enter");
    });
    setInterval(showCharged, 100);
}

function setTouchImage(btn, lit) {
    btn.querySelector("img").src = `img_small/assets/buttons/${btn.dataset.img}_0${lit ? 2 : 1}.webp`;
}

function touchDown(e, btn) {
    e.preventDefault();
    keyboard.press(btn.dataset.key);
    setTouchImage(btn, true);
}

function touchUp(btn) {
    keyboard.release(btn.dataset.key);
    setTouchImage(btn, btn.id === "touch-charge" && chargeShown);
}

// Aufladen-Taste leuchtet blau, solange der starke Wurf bereit ist
function showCharged() {
    let charged = !!(world && world.character.charged);
    if (charged === chargeShown) return;
    chargeShown = charged;
    setTouchImage(document.getElementById("touch-charge"), charged);
}

function preloadTouchImages() {
    document.querySelectorAll(".touch-btn").forEach(btn => {
        [1, 2].forEach(n => {
            new Image().src = `img_small/assets/buttons/${btn.dataset.img}_0${n}.webp`;
        });
    });
}