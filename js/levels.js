// Hintergrund-Ebenen eines Levels. y2 und y3 verschieben Ebene 2 und 3 nach unten.
// speed: 0 = steht, 1 = bewegt sich mit der Figur, dazwischen = Parallax
function levelBackground(n, y2, y3, dys3 = []) {
    let dir = `img_small/level/level${n}/level${n}`;
    return [
        { sources: [`${dir}_layer1.webp`], y: 0, speed: 0 },
        { sources: [`${dir}_layer2_1.webp`, `${dir}_layer2_2.webp`], y: y2, speed: 0.5 },
        { sources: [`${dir}_layer3_1.webp`, `${dir}_layer3_2.webp`], y: y3, speed: 1, dys: dys3 },
    ];
}

// Einstellungen pro Level. Neues Level = neuer Eintrag.
// boss.scale: muss zum Faktor BOSS_MULT in resize_images.py passen
const LEVELS = {
    1: {
        background: levelBackground(1, 40, 100),
        boss: {
            folder: "level1",
            prefix: "pub_landlord",
            throwName: "throw_frame",
            frames: { idle: 2, angry: 2, throw: 2, hit: 2, die: 4 },
            projectile: "beer_mug_projectile",
            bar: "healthbar_level1/boss_healthbar_level1",
            barCount: 6,
            health: 5,
            scale: 1.1,
            hitbox: { w: 90, h: 180 },
            hand: { x: 85, y: 125 },
            flight: { gravity: 0.35, lift: 8, rotation: "spin" },
        },
    },
    2: {
        background: levelBackground(2, 40, 100, [0, -64]),
        boss: {
            folder: "level2",
            prefix: "district_boss",
            throwName: "throw",
            frames: { idle: 4, angry: 2, throw: 3, hit: 1, die: 4 },
            projectile: "district_boss_projectile",
            bar: "healthbar_level2-4/boss_healthbar_level2-4",
            barCount: 6,
            health: 5,
            scale: 1.0,
            hitbox: { w: 95, h: 160 },
            hand: { x: 85, y: 125 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
        },
    },
    3: {
         background: levelBackground(3, 40, 70, [0, -30]),
        boss: {
            folder: "level3",
            prefix: "state_boss",
            throwName: "throw",
            frames: { idle: 2, angry: 2, throw: 4, hit: 2, die: 4 },
            projectile: "state_boss_projectile",
            bar: "healthbar_level2-4/boss_healthbar_level2-4",
            barCount: 6,
            health: 5,
            scale: 1.0,
            hitbox: { w: 70, h: 185 },
            hand: { x: 70, y: 135 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
        },
    },
    4: {
        background: levelBackground(4, 40, 80, [0, -19]),
        boss: {
            folder: "level4",
            prefix: "world_boss",
            throwName: "throw",
            frames: { idle: 4, angry: 2, throw: 4, hit: 2, die: 4 },
            projectile: "world_boss_projectile",
            bar: "healthbar_level2-4/boss_healthbar_level2-4",
            barCount: 6,
            health: 5,
            scale: 1.0,
            hitbox: { w: 95, h: 180 },
            hand: { x: 85, y: 130 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
        },
    },
    5: {
        background: levelBackground(5, 40, 177, [0, -14]),
        boss: {
            folder: "level5",
            prefix: "180_boss",
            throwName: "throw",
            frames: { idle: 3, angry: 3, throw: 3, hit: 2, die: 3 },
            projectile: "180_boss_projectile",
            bar: "healthbar_level5/boss_healthbar_level5",
            barCount: 11,
            health: 10,
            angryAt: [6, 2],                        // Phase 1 ab 6 Leben, Phase 2 ab 2 Leben
            pauses: [2500, 1800, 1000],             // Wurfpause: ruhig, Phase 1, Phase 2
            angryFrames: [[0, 1], [1, 2]],          // welche Wütend-Bilder (Phase 1, Phase 2)
            scale: 1.5,
            hitbox: { w: 120, h: 145 },
            hand: { x: 90, y: 120 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
        },
    },
};