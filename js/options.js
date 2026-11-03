// Beschriftung der Tasten, in der Reihenfolge der Anzeige (Belegung steht in Keyboard.KEYS)
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

function initOptions() {
    Sound.unlockOnFirstInput();
    Sound.start("menuMusic");
    setupSlider("music", null);
    setupSlider("fx", "coin"); // beim Loslassen kurz zur Probe abspielen
    showControls();
    showProgress();
}

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

function keyName(code) {
    return KEY_NAMES[code] || code.replace("Key", "");
}

function showControls() {
    let rows = Object.keys(CONTROL_LABELS).map((action) => {
        let keys = [...new Set(Keyboard.KEYS[action].map(keyName))].join(" oder ");
        return `<tr><td>${CONTROL_LABELS[action]}</td><td>${keys}</td></tr>`;
    });
    rows.push("<tr><td>Ton an / aus</td><td>M</td></tr>");
    document.getElementById("controls").innerHTML = rows.join("");
}

function showProgress() {
    document.getElementById("unlocked").textContent = getUnlockedLevel();
}

function openResetDialog() {
    document.getElementById("reset-dialog").showModal();
}

function closeResetDialog() {
    document.getElementById("reset-dialog").close();
}

function confirmReset() {
    resetProgress();
    showProgress();
    closeResetDialog();
}