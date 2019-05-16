class Snake {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.context = this.canvas.getContext('2d');
  }
}

const snakeGame = new Snake();
window.onload = snakeGame.init();
