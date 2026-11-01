// Hintergrund-Ebenen eines Levels. y2 und y3 verschieben Ebene 2 und 3 nach unten.
// speed: 0 = steht, 1 = bewegt sich mit der Figur, dazwischen = Parallax
function levelBackground(n, y2, y3) {
    let dir = `img_small/level/level${n}/level${n}`;
    return [
        { sources: [`${dir}_layer1.webp`], y: 0, speed: 0 },
        { sources: [`${dir}_layer2_1.webp`, `${dir}_layer2_2.webp`], y: y2, speed: 0.5 },
        { sources: [`${dir}_layer3_1.webp`, `${dir}_layer3_2.webp`], y: y3, speed: 1 },
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
        },
    },
    2: {
        background: levelBackground(2, 40, 100),
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
        },
    },
};