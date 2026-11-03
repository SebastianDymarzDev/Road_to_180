class Keyboard {
    // Hier ändern, wenn du die Belegung wechseln willst (event.code)
    static KEYS = {
        LEFT: ["KeyA", "ArrowLeft"],
        RIGHT: ["KeyD", "ArrowRight"],
        DUCK: ["KeyS", "ArrowDown"],
        THROW: ["Space", "KeyF"],
        CHARGE: ["ShiftLeft", "ShiftRight", "AltLeft", "AltRight"],
        JUMP: ["KeyW", "ArrowUp"],
        RESTART: ["Enter"],
    };

    // Tasten, die der Browser sonst selbst nutzt (Scrollen, Alt = Menüleiste)
    static BLOCKED = ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "AltLeft", "AltRight"];

    pressed = {};
    pressedOnce = {}; // Tastendruck seit der letzten Abfrage (auch sehr kurze)
    lastInput = Date.now(); // Zeitpunkt des letzten Tastendrucks

    constructor() {
        window.addEventListener("keydown", (e) => {
            if (Keyboard.BLOCKED.includes(e.code)) e.preventDefault(); // Browser-Standardverhalten verhindern
            if (e.code === "Enter" && document.getElementById("menu").classList.contains("playing")) e.preventDefault();
            this.press(e.code, e.repeat);
        });
        window.addEventListener("keyup", (e) => this.release(e.code));
        window.addEventListener("blur", () => (this.pressed = {}));
    }

    // Taste drücken (Tastatur und Bildschirm-Tasten). Halten zählt nur einmal für wasPressed.
    press(code, isRepeat = false) {
        this.pressed[code] = true;
        this.lastInput = Date.now();
        if (!isRepeat) this.pressedOnce[code] = true;
    }

    release(code) {
        this.pressed[code] = false;
    }

    // true, wenn die Taste seit der letzten Abfrage gedrückt wurde (verbraucht den Tastendruck)
    wasPressed(action) {
        let codes = Keyboard.KEYS[action];
        let hit = codes.some((code) => this.pressedOnce[code]);
        codes.forEach((code) => (this.pressedOnce[code] = false));
        return hit;
    }

    // Millisekunden ohne Taste (0, solange eine Taste gehalten wird)
    idleTime() {
        if (Object.values(this.pressed).some((v) => v)) return 0;
        return Date.now() - this.lastInput;
    }

    is(action) {
        return Keyboard.KEYS[action].some((code) => this.pressed[code]);
    }
}