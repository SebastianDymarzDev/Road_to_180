const CONTROL_LABELS = {
    LEFT: "Nach links laufen",
    RIGHT: "Nach rechts laufen",
    JUMP: "Springen",
    DUCK: "Ducken",
    THROW: "Dart werfen",
    CHARGE: "Wurf aufladen (einmal drücken, bei vollen Darts)",
    RESTART: "Weiter / Neustart",
};

const KEY_NAMES = {
    Space: "Leertaste",
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    AltLeft: "Alt",
    AltRight: "Alt Gr",
    Enter: "Enter",
    ArrowLeft: "Pfeil links",
    ArrowRight: "Pfeil rechts",
    ArrowUp: "Pfeil hoch",
    ArrowDown: "Pfeil runter",
};

/**
 * Sets up the options page: sound, sliders, controls list and progress.
 */
function initOptions() {
    Sound.unlockOnFirstInput();
    Sound.start("menuMusic");
    setupSlider("music", null);
    setupSlider("fx", "coin");
    showControls();
    showProgress();
}

/**
 * Connects a volume slider with the sound system and shows its value.
 * @param {"music"|"fx"} type - Music or effects.
 * @param {string|null} sample - Sound played as a preview after releasing the slider (or null).
 */
function setupSlider(type, sample) {
    let slider = document.getElementById(type + "-volume");
    let label = document.getElementById(type + "-value");
    let current = type === "music" ? Sound.musicVolume : Sound.fxVolume;
    slider.value = Math.round(current * 100);
    label.textContent = slider.value + " %";
    slider.oninput = () => {
        label.textContent = slider.value + " %";
        Sound.setVolume(type, slider.value / 100);
    };
    if (sample) slider.onchange = () => Sound.play(sample);
}

/**
 * Returns the readable name of a key.
 * @param {string} code - Key code (e.g. "ArrowLeft", "KeyA").
 * @returns {string} Name of the key (e.g. "Pfeil links", "A").
 */
function keyName(code) {
    return KEY_NAMES[code] || code.replace("Key", "");
}

/**
 * Fills the table with the key bindings.
 */
function showControls() {
    let rows = Object.keys(CONTROL_LABELS).map((action) => {
        let keys = [...new Set(Keyboard.KEYS[action].map(keyName))].join(" oder ");
        return `<tr><td>${CONTROL_LABELS[action]}</td><td>${keys}</td></tr>`;
    });
    rows.push("<tr><td>Ton an / aus</td><td>M</td></tr>");
    document.getElementById("controls").innerHTML = rows.join("");
}

/**
 * Shows the highest unlocked level.
 */
function showProgress() {
    document.getElementById("unlocked").textContent = getUnlockedLevel();
}

/**
 * Opens the dialog for resetting the progress.
 */
function openResetDialog() {
    document.getElementById("reset-dialog").showModal();
}

/**
 * Closes the dialog for resetting the progress.
 */
function closeResetDialog() {
    document.getElementById("reset-dialog").close();
}

/**
 * Resets the progress, updates the display and closes the dialog.
 */
function confirmReset() {
    resetProgress();
    showProgress();
    closeResetDialog();
}