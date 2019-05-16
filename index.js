Array.prototype.last = function() {
  return this[this.length - 1];
};

class Game {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.context = this.canvas.getContext('2d');
    this.direction = 0;
    document.body.addEventListener('keydown', this.captureDirection.bind(this));
    this.clearCanvas();
    this.stepSizeX = 16;
    this.stepSizeY = 16;
    this.snakeColor = 'red';
    this.boardColor = 'blue';
    this.foodColor = 'yellow';
    this.gameSpeed = 12;
    this.isRunning = false;
    this.interval = null;
    this.marginX = 2;
    this.marginY = 2;
    this.score = 0;
    this.snake = [];
    this.resetGame();
    this.foodCount = 3;
    this.foods = [];
    for (let i = 0; i < this.foodCount; i++) {
      this.generateValidFood();
    }
    this._directionCaptured = false;
  }

  captureDirection(event) {
    const { keyCode } = event;
    if (keyCode == 80) {
      if (this.isRunning) this.stopGame();
      else this.startGame();
    }

    if (!this.isRunning) return;
    if (this._directionCaptured) return;

    if (keyCode == 38 && this.direction !== 2) {
      this._directionCaptured = true;
      this.direction = 0;
    } else if (keyCode == 39 && this.direction !== 3) {
      this._directionCaptured = true;
      this.direction = 1;
    } else if (keyCode == 40 && this.direction !== 0) {
      this._directionCaptured = true;
      this.direction = 2;
    } else if (keyCode == 37 && this.direction !== 1) {
      this._directionCaptured = true;
      this.direction = 3;
    }
  }

  startGame() {
    this.isRunning = true;
    this.interval = setInterval(this.tick.bind(this), 1000 / this.gameSpeed);
  }

  stopGame() {
    this.isRunning = false;
    clearInterval(this.interval);
  }

  resetGame() {
    this.snake = [];
    const initialPositionX = Math.floor(this.alignedWidth() / this.stepSizeX / 2) * this.stepSizeX;
    const initialPositionY = Math.floor(this.alignedHeight() / this.stepSizeY / 2) * this.stepSizeY; 
    this.snake.push([initialPositionX, initialPositionY]);
    this.score = 0;
  }

  drawStep(x, y, color) {
    this.context.fillStyle = color;
    this.context.fillRect(this.marginX + x, this.marginY + y, this.stepSizeX - this.marginX, this.stepSizeY - this.marginY);
  }

  drawSnake() {
    for (let i = 0; i < this.snake.length; i++) {
      this.drawStep(this.snake[i][0], this.snake[i][1], this.snakeColor);
    }
  }

  drawFoods() {
   for (let i = 0; i < this.foods.length; i++) {
      this.drawStep(this.foods[i][0], this.foods[i][1], this.foodColor);
    } 
  }

  alignedWidth() {
    return Math.floor(this.canvas.width / this.stepSizeX) * this.stepSizeX;
  }

  alignedHeight() {
    return Math.floor(this.canvas.height / this.stepSizeY) * this.stepSizeY;
  }

  updateSnake(feed = false) {
    let x, y;
    const head = this.snake.last();
    if (this.direction == 0) {
      x = head[0];
      y = head[1] - this.stepSizeY;
      if (y < 0) y = this.alignedHeight();
    } else if (this.direction == 1) {
      x = head[0] + this.stepSizeX;
      y = head[1];
      if (x > this.alignedWidth()) x = 0;
    } else if (this.direction == 2) {
      x = head[0];
      y = head[1] + this.stepSizeY;
      if (y > this.alignedHeight()) y = 0;
    } else if (this.direction == 3) {
      x = head[0] - this.stepSizeX;
      y = head[1];
      if (x < 0) x = this.alignedWidth();
    }
    this.snake.push([x, y]);
    this._directionCaptured = false;
    if (feed == null) this.snake.shift();
  }

  gotFood() {
    const head = this.snake.last();
    for (let i = 0; i < this.foods.length; i++) {
      if (this.foods[i][0] == head[0] && this.foods[i][1] == head[1]) {
        return i;
      }
    }
    return null;
  }

  generateValidFood() {
    let food = this.generateFood();
    while (!this.isFoodValid(food)) {
      food = this.generateFood();
    }
    this.foods.push(food);
  }

  generateFood() {
    const horizontalStepCount = Math.floor(this.canvas.width / this.stepSizeX);
    const verticalStepCount = Math.floor(this.canvas.height / this.stepSizeY);

    const x = Math.floor(Math.random() * horizontalStepCount) * this.stepSizeX;
    const y = Math.floor(Math.random() * verticalStepCount) * this.stepSizeY;

    return [x, y];
  }

  removeFood(index) {
    this.foods.splice(index, 1)
  }

  isFoodValid(food) {
    for (let i = 0; i < this.foods.length; i++) {
      if (this.foods[i][0] == food[0] && this.foods[i][1] == food[1]) {
        return false;
      }
    }
    return true;
  }

  clearCanvas(color = '#ccc') {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  tick() {
    this.clearCanvas(this.boardColor);
    this.drawSnake();
    this.drawFoods();
    const gotFood = this.gotFood();
    if (gotFood !== null) {
      this.score = this.score + 1;
      console.log(this.score);
      this.removeFood(gotFood);
      this.generateValidFood();
    }
    this.updateSnake(gotFood);
  }
}

const snakeGame = new Game();
window.onload = snakeGame.startGame();
