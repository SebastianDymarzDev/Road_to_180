const UNLOCKED_KEY = "road180_unlocked";

/**
 * Reads a value from local storage. If storage is unavailable or empty, the fallback is returned.
 * @param {string} key - Storage key.
 * @param {*} fallback - Fallback value.
 * @returns {*} Saved value or fallback.
 */
function readStorage(key, fallback) {
    try {
        let value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (e) {
        return fallback;
    }
}

/**
 * Writes a value to local storage. Errors (e.g. blocked storage) are ignored.
 * @param {string} key - Storage key.
 * @param {*} value - Value to save.
 */
function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) { }
}

/**
 * Reads the highest unlocked level.
 * @returns {number} Level number (at least 1).
 */
function getUnlockedLevel() {
    return parseInt(readStorage(UNLOCKED_KEY, 1)) || 1;
}

/**
 * Resets the progress to level 1.
 */
function resetProgress() {
    writeStorage(UNLOCKED_KEY, 1);
}