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
            health: 10,
            angryAt: [4],
            pauses: [2200, 1400],
            scale: 1.1,
            hitbox: { width: 90, height: 180 },
            hand: { x: 85, y: 125 },
            flight: { gravity: 0.35, lift: 8, rotation: "spin" },
            sounds: { throw: "throwMug", hitPlayer: "mugHit", hitBoss: "hitHuman" },
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
            health: 10,
            angryAt: [4],
            pauses: [2000, 1300],
            scale: 1.0,
            hitbox: { width: 95, height: 160 },
            hand: { x: 85, y: 125 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
            sounds: { throw: "throw", hitPlayer: "hitHuman", hitBoss: "hitHuman" },
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
            health: 10,
            angryAt: [4],
            pauses: [1900, 1200],
            scale: 1.0,
            hitbox: { width: 70, height: 185 },
            hand: { x: 70, y: 135 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
            sounds: { throw: "throw", hitPlayer: "hitHuman", hitBoss: "hitHuman" },
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
            health: 10,
            angryAt: [4],
            pauses: [1800, 1100],
            scale: 1.0,
            hitbox: { width: 95, height: 180 },
            hand: { x: 85, y: 130 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
            sounds: { throw: "throw", hitPlayer: "hitHuman", hitBoss: "hitHuman" },
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
            health: 20,
            angryAt: [12, 4],
            pauses: [1800, 1300, 800],
            angryFrames: [[0, 1], [1, 2]],
            scale: 1.5,
            hitbox: { width: 120, height: 145 },
            hand: { x: 90, y: 120 },
            flight: { gravity: 0.1, lift: 2.5, rotation: "aim" },
            sounds: { throw: "throw", hitPlayer: "hitHuman", hitBoss: "hitBoard" },
        },
    },
};

/**
 * Builds the three background layers of a level. y2 and y3 move layers 2 and 3 downwards. speed: 0 = fixed, 1 = moves with the character, in between = parallax.
 * @param {number} n - Level number.
 * @param {number} y2 - Vertical offset of layer 2.
 * @param {number} y3 - Vertical offset of layer 3.
 * @param {number[]} [dys3] - Additional offset per image of layer 3.
 * @returns {{sources: string[], y: number, speed: number, dys?: number[]}[]} The layers from back to front.
 */
function levelBackground(n, y2, y3, dys3 = []) {
    let dir = `img_small/level/level${n}/level${n}`;
    return [
        { sources: [`${dir}_layer1.webp`], y: 0, speed: 0 },
        { sources: [`${dir}_layer2_1.webp`, `${dir}_layer2_2.webp`], y: y2, speed: 0.5 },
        { sources: [`${dir}_layer3_1.webp`, `${dir}_layer3_2.webp`], y: y3, speed: 1, dys: dys3 },
    ];
}
