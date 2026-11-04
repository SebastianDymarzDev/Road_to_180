/**
 * Manages keyboard input (including the touch buttons) and queries actions instead of single keys.
 */
class Keyboard {
    static KEYS = {
        LEFT: ["KeyA", "ArrowLeft"],
        RIGHT: ["KeyD", "ArrowRight"],
        DUCK: ["KeyS", "ArrowDown"],
        THROW: ["Space", "KeyF"],
        CHARGE: ["ShiftLeft", "ShiftRight", "AltLeft", "AltRight"],
        JUMP: ["KeyW", "ArrowUp"],
        RESTART: ["Enter"],
    };

    static BLOCKED = ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "AltLeft", "AltRight"];

    pressed = {};
    pressedOnce = {};
    lastInput = Date.now();

    /**
     * Registers the keyboard events. Game keys prevent the page from scrolling. When the window loses focus, all pressed keys are released.
     */
    constructor() {
        window.addEventListener("keydown", (e) => {
            if (Keyboard.BLOCKED.includes(e.code)) e.preventDefault();
            if (e.code === "Enter" && document.getElementById("menu").classList.contains("playing")) e.preventDefault();
            this.press(e.code, e.repeat);
        });
        window.addEventListener("keyup", (e) => this.release(e.code));
        window.addEventListener("blur", () => (this.pressed = {}));
    }

    /**
     * Remembers a pressed key. Also used by the touch buttons.
     * @param {string} code - Key code (e.g. "Space").
     * @param {boolean} [isRepeat] - true for automatic repetition of a held key.
     */
    press(code, isRepeat = false) {
        this.pressed[code] = true;
        this.lastInput = Date.now();
        if (!isRepeat) this.pressedOnce[code] = true;
    }

    /**
     * Remembers that a key was released.
     * @param {string} code - Key code.
     */
    release(code) {
        this.pressed[code] = false;
    }

    /**
     * Checks whether a key of an action was newly pressed and resets the memory.
     * @param {string} action - Action from Keyboard.KEYS (e.g. "CHARGE").
     * @returns {boolean} true if newly pressed since the last query.
     */
    wasPressed(action) {
        let codes = Keyboard.KEYS[action];
        let hit = codes.some((code) => this.pressedOnce[code]);
        codes.forEach((code) => (this.pressedOnce[code] = false));
        return hit;
    }

    /**
     * Returns the time without input. While a key is held it is 0.
     * @returns {number} Time in ms.
     */
    idleTime() {
        if (Object.values(this.pressed).some((isDown) => isDown)) return 0;
        return Date.now() - this.lastInput;
    }

    /**
     * Checks whether a key of the action is currently held.
     * @param {string} action - Action from Keyboard.KEYS (e.g. "LEFT").
     * @returns {boolean} true if pressed.
     */
    is(action) {
        return Keyboard.KEYS[action].some((code) => this.pressed[code]);
    }
}