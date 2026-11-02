class Keyboard {
    // Hier ändern, wenn du die Belegung wechseln willst (event.code)
    static KEYS = {
        LEFT: ["KeyA"],
        RIGHT: ["KeyD"],
        DUCK: ["KeyS"],
        THROW: ["KeyF"],
        CHARGE: ["ShiftLeft"],
        JUMP: ["Space", "KeyW"],
        RESTART: ["Enter"],
    };

    pressed = {};
    pressedOnce = {}; // Tastendruck seit der letzten Abfrage (auch sehr kurze)
    lastInput = Date.now(); // Zeitpunkt des letzten Tastendrucks

    constructor() {
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") e.preventDefault();
            if (e.code === "Enter" && document.getElementById("menu").classList.contains("playing")) e.preventDefault();
            this.pressed[e.code] = true;
            this.lastInput = Date.now();
            if (!e.repeat) this.pressedOnce[e.code] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.pressed[e.code] = false;
        });
        window.addEventListener("blur", () => (this.pressed = {}));
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