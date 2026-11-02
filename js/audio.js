// Alle Sounds des Spiels. Datei oder Lautstärke (0 bis 1) kannst du hier ändern.
// loop: true = läuft in Dauerschleife (Musik, Schritte)
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

class Sound {
    static muted = Sound.readMuted();
    static audios = {};        // geladene Audio-Objekte
    static wanted = new Set(); // Schleifen, die gerade laufen sollen

    static readMuted() {
        try {
            return localStorage.getItem("road180_muted") === "1";
        } catch (e) {
            return false;
        }
    }

    static audio(name) {
        if (!Sound.audios[name]) {
            let s = SOUNDS[name];
            let a = new Audio("audio/" + s.file);
            a.volume = s.volume;
            a.loop = !!s.loop;
            Sound.audios[name] = a;
        }
        return Sound.audios[name];
    }

    // Lädt alle Sounds vor, damit sie ohne Verzögerung starten
    static preload() {
        Object.keys(SOUNDS).forEach((name) => Sound.audio(name).load());
    }

    // Einmaliger Sound. Eine Kopie erlaubt, dass sich Sounds überlappen.
    static play(name) {
        if (Sound.muted) return;
        let a = Sound.audio(name).cloneNode();
        a.volume = SOUNDS[name].volume;
        a.play().catch(() => {});
    }

    // Spielt einen Sound und ruft danach callback auf (sofort, wenn kein Ton möglich ist)
    static playThen(name, callback) {
        if (Sound.muted) return callback();
        let a = Sound.audio(name).cloneNode();
        a.volume = SOUNDS[name].volume;
        a.addEventListener("ended", callback, { once: true });
        a.addEventListener("error", callback, { once: true });
        a.play().catch(callback);
    }

    // Schleife starten (Musik, Schritte)
    static start(name) {
        Sound.wanted.add(name);
        Sound.refresh();
    }

    static stop(name) {
        Sound.wanted.delete(name);
        Sound.refresh();
        let a = Sound.audio(name);
        if (name.endsWith("Music")) a.currentTime = 0; // Musik beginnt beim nächsten Mal von vorn
    }

    // Spielt oder pausiert alle Schleifen passend zu "wanted" und "muted"
    static refresh() {
        Object.keys(SOUNDS).forEach((name) => {
            if (!SOUNDS[name].loop) return;
            let a = Sound.audio(name);
            let should = Sound.wanted.has(name) && !Sound.muted;
            if (should && a.paused) a.play().catch(() => {});
            else if (!should && !a.paused) a.pause();
        });
    }

    static toggleMute() {
        Sound.muted = !Sound.muted;
        try {
            localStorage.setItem("road180_muted", Sound.muted ? "1" : "0");
        } catch (e) {}
        Sound.refresh();
        Sound.updateButton();
    }

    // Zeigt auf dem Mute-Button, ob der Ton an oder aus ist
    static updateButton() {
        let img = document.getElementById("mute-img");
        if (img) img.src = "img_small/assets/buttons/" + (Sound.muted ? "sound_on" : "sound_off") + ".webp";
    }

    // Browser erlauben Ton erst nach dem ersten Klick oder Tastendruck
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