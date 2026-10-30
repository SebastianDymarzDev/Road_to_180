class Keyboard {
    // Hier ändern, wenn du die Belegung wechseln willst (event.code)
    static KEYS = {
        LEFT: ["KeyA"],
        RIGHT: ["KeyD"],
        DUCK: ["KeyS"],
        THROW: ["KeyF"],
        CHARGE: ["ShiftLeft"],
        JUMP: ["Space", "KeyW"],
    };

    pressed = {};

    constructor() {
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") e.preventDefault();
            this.pressed[e.code] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.pressed[e.code] = false;
        });
    }

    is(action) {
        return Keyboard.KEYS[action].some((code) => this.pressed[code]);
    }
}