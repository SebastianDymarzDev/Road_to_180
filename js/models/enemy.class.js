class Enemy extends MovableObject {
    constructor() {
        super().loadImage("img/enemy.png");
        this.x = 200 + Math.random() * 500;
        this.y = 100;
    }
}