const SOUNDS = {
    menuMusic: { file: "game_loop.mp3", volume: 0.35, loop: true },
    gameMusic: { file: "road_to_180_loop.mp3", volume: 0.07, loop: true },
    walk: { file: "walk.wav", volume: 0.3, loop: true },
    snoring: { file: "snoring.mp3", volume: 0.4, loop: true },
    arrow: { file: "arrow.mp3", volume: 0.6 },
    button: { file: "button.mp3", volume: 0.6 },
    levelStart: { file: "level_start_3.0.mp3", volume: 0.6 },
    jump: { file: "jump.mp3", volume: 0.5 },
    land: { file: "land_ground.mp3", volume: 0.5 },
    coin: { file: "coin.mp3", volume: 0.6 },
    energy: { file: "energy.mp3", volume: 0.6 },
    charge: { file: "charge_short.mp3", volume: 0.6 },
    throw: { file: "throw_arrow.wav", volume: 0.6 },
    throwMug: { file: "throw_mug.mp3", volume: 0.6 },
    hitBoard: { file: "arrow_hit_board.mp3", volume: 0.6 },
    hitHuman: { file: "arrow_hit_human.mp3", volume: 0.6 },
    mugHit: { file: "beer_mug_hit.mp3", volume: 0.6 },
    stomp: { file: "board_hit.wav", volume: 0.6 },
    gameOver: { file: "game_over.mp3", volume: 0.7 },
    win: { file: "win.wav", volume: 0.7 },
    badge: { file: "clear_game_badge.mp3", volume: 0.7 },
};

/**
 * Central sound management: volume, muting, music and effects.
 */
class Sound {
    static muted = readStorage("road180_muted", "0") === "1";
    static musicVolume = Sound.readVolume("road180_music");
    static fxVolume = Sound.readVolume("road180_fx");
    static audios = {};
    static wanted = new Set();

    /**
     * Reads a saved volume from storage.
     * @param {string} key - Storage key (e.g. "road180_music").
     * @returns {number} Volume from 0 to 1 (1 if nothing or an invalid value is saved).
     */
    static readVolume(key) {
        let value = parseFloat(readStorage(key, 1));
        return isNaN(value) ? 1 : Math.min(1, Math.max(0, value));
    }

    /**
     * Calculates the effective volume of a sound (value from SOUNDS times the music or effects slider).
     * @param {string} name - Name of the sound in SOUNDS.
     * @returns {number} Volume from 0 to 1.
     */
    static volumeOf(name) {
        let slider = name.endsWith("Music") ? Sound.musicVolume : Sound.fxVolume;
        return SOUNDS[name].volume * slider;
    }

    /**
     * Sets and saves the volume for music or effects and applies it to all loaded sounds.
     * @param {"music"|"fx"} type - Music or effects.
     * @param {number} value - Slider value from 0 to 1.
     */
    static setVolume(type, value) {
        if (type === "music") Sound.musicVolume = value;
        else Sound.fxVolume = value;
        writeStorage("road180_" + type, value);
        Object.keys(Sound.audios).forEach((name) => (Sound.audios[name].volume = Sound.volumeOf(name)));
    }

    /**
     * Returns the audio object of a sound and creates it on the first call.
     * @param {string} name - Name of the sound in SOUNDS.
     * @returns {HTMLAudioElement} The audio object of this sound.
     */
    static audio(name) {
        if (!Sound.audios[name]) {
            let config = SOUNDS[name];
            let element = new Audio("audio/" + config.file);
            element.volume = Sound.volumeOf(name);
            element.loop = !!config.loop;
            Sound.audios[name] = element;
        }
        return Sound.audios[name];
    }

    /**
     * Preloads all sounds so they are ready to play immediately.
     */
    static preload() {
        Object.keys(SOUNDS).forEach((name) => Sound.audio(name).load());
    }

    /**
     * Creates a copy of the sound so the same effect can play several times at once.
     * @param {string} name - Name of the sound in SOUNDS.
     * @returns {HTMLAudioElement} Copy with the matching volume.
     */
    static clone(name) {
        let copy = Sound.audio(name).cloneNode();
        copy.volume = Sound.volumeOf(name);
        return copy;
    }

    /**
     * Plays an effect once (does nothing while muted).
     * @param {string} name - Name of the sound in SOUNDS.
     */
    static play(name) {
        if (Sound.muted) return;
        Sound.clone(name).play().catch(() => {});
    }

    /**
     * Plays a sound and calls the function afterwards. The callback also runs when muted and on errors.
     * @param {string} name - Name of the sound in SOUNDS.
     * @param {Function} callback - Called after the sound has ended.
     */
    static playThen(name, callback) {
        if (Sound.muted) return callback();
        let copy = Sound.clone(name);
        copy.addEventListener("ended", callback, { once: true });
        copy.addEventListener("error", callback, { once: true });
        copy.play().catch(callback);
    }

    /**
     * Starts a sound as a continuous loop as soon as sound is on.
     * @param {string} name - Name of a sound with loop: true.
     */
    static start(name) {
        Sound.wanted.add(name);
        Sound.refresh();
    }

    /**
     * Stops a looping sound. Music jumps back to the beginning.
     * @param {string} name - Name of a sound with loop: true.
     */
    static stop(name) {
        Sound.wanted.delete(name);
        Sound.refresh();
        let element = Sound.audio(name);
        if (name.endsWith("Music")) element.currentTime = 0;
    }

    /**
     * Syncs all looping sounds with the wanted state: they play when wanted and not muted.
     */
    static refresh() {
        Object.keys(SOUNDS).forEach((name) => {
            if (!SOUNDS[name].loop) return;
            let element = Sound.audio(name);
            let should = Sound.wanted.has(name) && !Sound.muted;
            if (should && element.paused) element.play().catch(() => {});
            else if (!should && !element.paused) element.pause();
        });
    }

    /**
     * Turns sound on or off, saves the setting and updates the button.
     */
    static toggleMute() {
        Sound.muted = !Sound.muted;
        writeStorage("road180_muted", Sound.muted ? "1" : "0");
        Sound.refresh();
        Sound.updateButton();
    }

    /**
     * Sets the icon of the sound button to match the muted state.
     */
    static updateButton() {
        let img = document.getElementById("mute-img");
        if (img) img.src = "img_small/assets/buttons/" + (Sound.muted ? "sound_off" : "sound_on") + ".webp";
    }

    /**
     * Sets up sound control: music may start after the first input, M toggles sound, every button click plays the click sound.
     */
    static unlockOnFirstInput() {
        Sound.updateButton();
        let unlock = () => Sound.refresh();
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyM" && !e.repeat) Sound.toggleMute();
        });
        document.addEventListener("click", (e) => {
            if (e.target.closest("button")) Sound.play("button");
        });
    }
}
