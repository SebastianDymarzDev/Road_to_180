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

    constructor() {
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") e.preventDefault();
            if (e.code === "Enter" && document.getElementById("menu").classList.contains("playing")) e.preventDefault();
            this.pressed[e.code] = true;
            if (!e.repeat) this.pressedOnce[e.code] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.pressed[e.code] = false;
        });
    }

    // true, wenn die Taste seit der letzten Abfrage gedrückt wurde (verbraucht den Tastendruck)
    wasPressed(action) {
        let codes = Keyboard.KEYS[action];
        let hit = codes.some((code) => this.pressedOnce[code]);
        codes.forEach((code) => (this.pressedOnce[code] = false));
        return hit;
    }

    is(action) {
        return Keyboard.KEYS[action].some((code) => this.pressed[code]);
    }
}