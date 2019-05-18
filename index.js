Array.prototype.last = function() {
  return this[this.length - 1];
};

Direction = Object.freeze({
  "NO_DIRECTION": 0,
  "UP": 1,
  "RIGHT": 2,
  "DOWN": 3,
  "LEFT": 4,
});

Key = Object.freeze({
  "UP": 38,
  "RIGHT": 39,
  "DOWN": 40,
  "LEFT": 37,
  "PAUSE": 80,
  "RESET": 82
});

GameStatus = Object.freeze({
  "READY": 0,
  "PAUSED": 1,
  "UNPAUSED": 2,
  "OVER": 3,
});

var ENTITY_MARGIN = 4;
var FOOD_MARGIN = 4;
var WALL_MARGIN = 4;
var SNAKE_MARGIN = 4;

class Entity {
  constructor(x, y, color, direction=Direction.NO_DIRECTION) {
    this.coords = [[x, y]];
    this.color = color;
    this.scene = null;
    this.marginX = ENTITY_MARGIN;
    this.marginY = ENTITY_MARGIN;
    this.direction = direction
  }

  _drawUnit(x, y) {
    this.scene._context.fillStyle = this.color;
    this.scene._context.fillRect(
      this.marginX + x, this.marginY + y,
      this.scene.stepSizeX - this.marginX, this.scene.stepSizeY - this.marginY
    );
  }

  draw() {
    for (var i = this.coords.length - 1; i >= 0; i--) {
      this._drawUnit(this.coords[i][0], this.coords[i][1]);
    }
  }

  update() {
    console.error('You must implement that method!');
  }
}

class Food extends Entity {
  constructor(x, y, color='yellow', direction=Direction.NO_DIRECTION) {
    super(x, y, color, FOOD_MARGIN, FOOD_MARGIN, direction);
  }
  special() {
    this.scene.snake.coords.push(this.coords[0]);
    console.log(this);
    return;
  }
}

class Wall extends Entity {
  constructor(x, y, color='black', direction=Direction.NO_DIRECTION) {
    super(x, y, color, WALL_MARGIN, WALL_MARGIN, direction);
  }
}

class Snake extends Entity {
  constructor(x, y, color='red', direction=Direction.NO_DIRECTION) {
    super(x, y, color, SNAKE_MARGIN, SNAKE_MARGIN, direction);
  }

  update(feed=false) {
    let x, y;
    const head = this.coords.last();
    if (this.direction == Direction.NO_DIRECTION) {
      return;
    } else if (this.direction == Direction.UP) {
      x = head[0];
      y = head[1] - this.scene.stepSizeY;
      if (y < 0) y = this.scene.alignedHeight() - this.scene.stepSizeY;
    } else if (this.direction == Direction.RIGHT) {
      x = head[0] + this.scene.stepSizeX;
      y = head[1];
      if (x >= this.scene.alignedWidth()) x = 0;
    } else if (this.direction == Direction.DOWN) {
      x = head[0];
      y = head[1] + this.scene.stepSizeY;
      if (y >= this.scene.alignedHeight()) y = 0;
    } else if (this.direction == Direction.LEFT) {
      x = head[0] - this.scene.stepSizeX;
      y = head[1];
      if (x < 0) x = this.scene.alignedWidth() - this.scene.stepSizeX;
    }
    this.coords.push([x, y]);
    this.scene._directionCaptured = false;
    if (!feed) this.coords.shift();
  }

  biteYourself() {
    let head = this.coords.last();
    let coord;
    do {
      coord = this.coords.shift();
      this.scene.wall.coords.push(coord);
    } while (!this.scene._sameCoord(head, coord));
  }
}


class Game {
  constructor() {
    this._canvas = document.getElementById('canvas');
    this._context = this._canvas.getContext('2d');
    this._canvas.width = document.body.clientWidth;
    this._canvas.height = document.body.clientHeight;
    document.body.addEventListener('keydown', this.captureKey.bind(this));
    this.clearCanvas();

    this.stepSizeX = 64;
    this.stepSizeY = 64;

    this.gameSpeed = 0;
    this.status = GameStatus.READY;

    this.score = 0;
    this.foodCount = 3;

    this.snake = new Snake();
    this.snake.scene = this;
    this.foods = [];
    this.wall = new Wall();
    this.wall.scene = this;

    this.boardColor = 'blue';


    this._initialGameSpeed = 8;
    this.resetGame();
    this._directionCaptured = false;
  }

  captureKey(event) {
    const { keyCode } = event;
    if (keyCode == Key.RESET) {
      this.resetGame();
      return;
    }

    if (this.status == GameStatus.OVER) return;

    if (keyCode == Key.PAUSE) {
      if (this.status == GameStatus.UNPAUSED) {
        this.pauseGame();
      } else if (this.status == GameStatus.PAUSED) {
        this.unpauseGame();
      }
      return;
    }

    if (this.status == GameStatus.PAUSED) return;
    if (this._directionCaptured) return;

    if (keyCode == Key.UP && this.snake.direction !== Direction.DOWN) {
      this._directionCaptured = true;
      this.snake.direction = Direction.UP;
    } else if (keyCode == Key.RIGHT && this.snake.direction !== Direction.LEFT) {
      this._directionCaptured = true;
      this.snake.direction = Direction.RIGHT;
    } else if (keyCode == Key.DOWN && this.snake.direction !== Direction.UP) {
      this._directionCaptured = true;
      this.snake.direction = Direction.DOWN;
    } else if (keyCode == Key.LEFT && this.snake.direction !== Direction.RIGHT) {
      this._directionCaptured = true;
      this.snake.direction = Direction.LEFT;
    }
  }

  startGame() {
  }

  unpauseGame() {
    if (this.status == GameStatus.OVER) return;
    this.status= GameStatus.UNPAUSED;
    this.tick()
  }

  pauseGame() {
    this.status = GameStatus.PAUSED;
    clearInterval(this._interval);
  }

  endGame() {
    clearInterval(this._interval)
  }

  resetGame() {
    this._resetWall()
    this._resetSnake();
    this._resetFoods();
    this._resetValues();
    clearInterval(this._interval);
    this._interval = setInterval(this.tick.bind(this), 1000 / this.gameSpeed);
    this.status = GameStatus.READY;
  }

  _resetSnake() {
    this.snake.coords = []
    const initialPositionX = Math.floor(this.alignedWidth() / this.stepSizeX / 2) * this.stepSizeX;
    const initialPositionY = Math.floor(this.alignedHeight() / this.stepSizeY / 2) * this.stepSizeY;
    this.snake.coords.push([initialPositionX, initialPositionY]);
    this.snake.direction = Direction.NO_DIRECTION;
  }

  _resetWall() {
    this.wall.coords = [];
  }

  _resetFoods() {
    this.foods = [];
    for (let i = 0; i < this.foodCount; i++) {
      this.generateValidFood();
    }
  }

  _resetValues() {
    this.score = 0;
    this.status = GameStatus.READY;
    this.setGameSpeed(this._initialGameSpeed);
  }

  setGameSpeed(value) {
    this.gameSpeed = value;
    clearInterval(this._interval);
    this._interval = setInterval(this.tick.bind(this), 1000 / this.gameSpeed);
  }

  drawFoods() {
    for (var i = this.foods.length - 1; i >= 0; i--) {
      this.foods[i].draw();
    }
  }

  alignedWidth() {
    return Math.floor(this._canvas.width / this.stepSizeX) * this.stepSizeX;
  }

  alignedHeight() {
    return Math.floor(this._canvas.height / this.stepSizeY) * this.stepSizeY;
  }

  generateValidFood() {
    let food = this.generateFood();
    while (!this.isFoodValid(food)) {
      food = this.generateFood();
    }
    food.scene = this;
    this.foods.push(food);
  }

  generateFood() {
    const horizontalStepCount = Math.floor(this._canvas.width / this.stepSizeX);
    const verticalStepCount = Math.floor(this._canvas.height / this.stepSizeY);

    const x = Math.floor(Math.random() * horizontalStepCount) * this.stepSizeX;
    const y = Math.floor(Math.random() * verticalStepCount) * this.stepSizeY;

    let newFood = new Food(x, y);
    return newFood;
  }

  removeFood(index) {
    this.foods.splice(index, 1);
  }

  isFoodValid(food) {
    for (let i = 0; i < this.foods.length; i++) {
      if (this.foods[i].coords[0][0] == food.coords[0][0]
          && this.foods[i].coords[0][0] == food.coords[0][0]) {
        return false;
      }
    }
    for (var i = this.snake.coords.length - 1; i >= 0; i--) {
      if (this._sameCoord(this.snake.coords[i], food.coords[0])) {
        return false;
      }
    }
    for (var i = this.wall.coords.length - 1; i >= 0; i--) {
      if (this._sameCoord(this.wall.coords[i], food.coords[0]))
        return false;
    }
    return true;
  }

  detectSnakeCrash() {
    let snakeHead = this.snake.coords.last()
    for (var i = this.wall.coords.length - 1; i >= 0; i--) {
      if (this._sameCoord(this.wall.coords[i], snakeHead)) {
        this.endGame();
        return;
      }
    }
    for (var i = this.foods.length - 1; i >= 0; i--) {
      if (this._sameCoord(this.foods[i].coords[0], snakeHead)) {
        this.foods[i].special();
        this.removeFood(i);
        this.generateValidFood();
        return;
      }
    }
    for (var i = this.snake.coords.length - 2; i >= 0; i--) {
      if (this._sameCoord(this.snake.coords[i], snakeHead)) {
        console.log(this.snake.coords, snakeHead);
        return this.snake.biteYourself();
      }
    }
  }

  _sameCoord(coord1, coord2) {
    return coord1[0] == coord2[0] && coord1[1] == coord2[1];
  }

  clearCanvas(color) {
    if (color == null) {
      color = this.boardColor;
    }
    this._context.fillStyle = color;
    this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
  }

  tick() {
    this.clearCanvas(this.boardColor);
    this.drawFoods();
    this.wall.draw();
    this.snake.draw();

    this.detectSnakeCrash();

    this.snake.update();
    if (this.status == GameStatus.OVER) {
      this.endGame()
    }
  }
}

const snakeGame = new Game();
window.onload = snakeGame.startGame();
