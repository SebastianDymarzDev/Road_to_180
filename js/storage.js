const UNLOCKED_KEY = "road180_unlocked";

// localStorage kann gesperrt sein (z.B. im privaten Modus), dann gilt der Standardwert
function readStorage(key, fallback) {
    try {
        let value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (e) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) { }
}

// Höchstes freigeschaltetes Level (im Browser gespeichert)
function getUnlockedLevel() {
    return parseInt(readStorage(UNLOCKED_KEY, 1)) || 1;
}

function resetProgress() {
    writeStorage(UNLOCKED_KEY, 1);
}