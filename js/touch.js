let chargeShown = false;

/**
 * Sets up the touch controls: on-screen buttons, tapping the game field as Enter and the display of the charged throw.
 */
function initTouch() {
    document.querySelectorAll(".touch-btn").forEach((btn) => {
        btn.addEventListener("pointerdown", (e) => touchDown(e, btn));
        ["pointerup", "pointercancel"].forEach((type) => btn.addEventListener(type, () => touchUp(btn)));
        btn.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    document.getElementById("canvas").addEventListener("pointerdown", () => {
        keyboard.press("Enter");
        keyboard.release("Enter");
    });
    setInterval(showCharged, 100);
}

/**
 * Sets the image of a touch button to normal or lit.
 * @param {HTMLElement} btn - The touch button.
 * @param {boolean} lit - true for the pressed image.
 */
function setTouchImage(btn, lit) {
    btn.querySelector("img").src = `img_small/assets/buttons/${btn.dataset.img}_0${lit ? 2 : 1}.webp`;
}

/**
 * Handles pressing a touch button as a key press.
 * @param {PointerEvent} e - The pointer event.
 * @param {HTMLElement} btn - The pressed button.
 */
function touchDown(e, btn) {
    e.preventDefault();
    keyboard.press(btn.dataset.key);
    setTouchImage(btn, true);
}

/**
 * Handles releasing a touch button as a key release.
 * @param {HTMLElement} btn - The released button.
 */
function touchUp(btn) {
    keyboard.release(btn.dataset.key);
    setTouchImage(btn, btn.id === "touch-charge" && chargeShown);
}

/**
 * Lights up the charge button while the throw is charged.
 */
function showCharged() {
    let charged = !!(world && world.character.charged);
    if (charged === chargeShown) return;
    chargeShown = charged;
    setTouchImage(document.getElementById("touch-charge"), charged);
}

/**
 * Preloads the images of all touch buttons so nothing loads on the first press.
 */
function preloadTouchImages() {
    document.querySelectorAll(".touch-btn").forEach(btn => {
        [1, 2].forEach(n => {
            new Image().src = `img_small/assets/buttons/${btn.dataset.img}_0${n}.webp`;
        });
    });
}