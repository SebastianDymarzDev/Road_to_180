/**
 * Collision part of the game world: hits of darts and boss projectiles, enemy contact and collecting items.
 * Uses the state that the class World provides (character, boss, enemies, darts, ...).
 */
class WorldCollisions extends WorldDrawing {
    /**
     * Checks whether boss projectiles hit the character.
     */
    checkProjectileHits() {
        let box = this.character.getHitbox();
        this.projectiles.forEach((projectile) => {
            if (projectile.used || !this.overlaps(box, projectile.getHitbox())) return;
            if (this.character.takeDamage()) Sound.play(this.config.boss.sounds.hitPlayer);
            projectile.used = true;
        });
    }

    /**
     * Checks for every dart whether it hits an enemy or the boss.
     */
    checkDartHits() {
        this.darts.forEach((dart) => {
            if (!dart.img.complete) return;
            let box = dart.getHitbox();
            this.enemies.forEach((enemy) => this.dartHitsEnemy(dart, box, enemy));
            if (!dart.used) this.dartHitsBoss(dart, box);
        });
    }

    /**
     * Handles a dart hitting an enemy.
     * @param {Dart} dart - The dart.
     * @param {{x: number, y: number, w: number, h: number}} box - Hit area of the dart.
     * @param {Enemy} enemy - The enemy.
     */
    dartHitsEnemy(dart, box, enemy) {
        if (dart.used || enemy.dying || !this.overlaps(box, enemy.getHitbox())) return;
        enemy.hit(dart.damage);
        Sound.play("hitBoard");
        dart.used = true;
    }

    /**
     * Handles a dart hitting the boss (not while it is invulnerable; the dart then passes through).
     * @param {Dart} dart - The dart.
     * @param {{x: number, y: number, w: number, h: number}} box - Hit area of the dart.
     */
    dartHitsBoss(dart, box) {
        if (!this.boss.active || this.boss.dead || this.boss.isInvulnerable()) return;
        if (!this.overlaps(box, this.boss.getHitbox())) return;
        this.boss.hit(dart.damage);
        Sound.play(this.config.boss.sounds.hitBoss);
        dart.used = true;
    }

    /**
     * Checks whether the character touches an enemy.
     */
    checkEnemyContact() {
        let box = this.character.getHitbox();
        this.enemies.forEach((enemy) => {
            if (enemy.dying || !this.overlaps(box, enemy.getHitbox())) return;
            this.contact(enemy, box);
        });
    }

    /**
     * Handles the contact: from above the character defeats the enemy and hops, otherwise it takes damage.
     * @param {Enemy} enemy - The touched enemy.
     * @param {{x: number, y: number, w: number, h: number}} box - Hit area of the character.
     */
    contact(enemy, box) {
        let c = this.character;
        let feet = box.y + box.h;
        let falling = c.speedY < 0;
        if (falling && feet <= enemy.getHitbox().y + 30) {
            enemy.die("top");
            Sound.play("stomp");
            c.bounce();
        } else if (c.takeDamage()) {
            Sound.play("hitHuman");
        }
    }

    /**
     * Checks whether two rectangles overlap.
     * @param {{x: number, y: number, w: number, h: number}} a - First rectangle.
     * @param {{x: number, y: number, w: number, h: number}} b - Second rectangle.
     * @returns {boolean} true if they overlap.
     */
    overlaps(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    /**
     * Lets the character collect items it touches.
     */
    checkItems() {
        let box = this.character.getHitbox();
        this.items = this.items.filter((item) => {
            if (!item.img.complete || !this.overlaps(box, item.getHitbox())) return true;
            return !this.collect(item.type);
        });
    }

    /**
     * Applies an item. Darts and energy drinks are only picked up when needed.
     * @param {"coin"|"dart"|"drink"} type - Kind of item.
     * @returns {boolean} true if the item was collected.
     */
    collect(type) {
        let c = this.character;
        if (type === "coin") { c.coins++; Sound.play("coin"); return true; }
        if (type === "dart" && c.darts < c.maxDarts) { c.darts++; Sound.play("arrow"); return true; }
        if (type === "drink" && c.health < c.maxHealth) { c.health++; Sound.play("energy"); return true; }
        return false;
    }
}
