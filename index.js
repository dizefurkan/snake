Array.prototype.last = function() {
  return this[this.length - 1];
};

Direction = Object.freeze({
  NO_DIRECTION: 0,
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
  LEFT: 4
});

Key = Object.freeze({
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  LEFT: 37,
  PAUSE: 80,
  RESET: 82
});

GameStatus = Object.freeze({
  READY: 0,
  PAUSED: 1,
  UNPAUSED: 2,
  OVER: 3,
});

FoodType = Object.freeze({
  NORMAL: 0,
  SURPRISE: 1,
  WALL_CLEANER: 2,
  SHORTENER: 3,
  MULTIPLIER: 4,
  GHOST: 5,
  FOOD_INCREASE: 6,
  SPEED_UP: 7,
  SLOW_DOWN: 8,
});

FoodColorMapping = {
  [FoodType.NORMAL]: '#FFFFFF',
  [FoodType.SURPRISE]: '#C92464',
  [FoodType.WALL_CLEANER]: 'maroon',
  [FoodType.SHORTENER]: 'tomato',
  [FoodType.MULTIPLIER]: 'yellow',
  [FoodType.GHOST]: 'fuchsia',
  [FoodType.FOOD_INCREASE]: 'aqua',
  [FoodType.SPEED_UP]: 'navy',
  [FoodType.SLOW_DOWN]: 'olive'
}

var INITIAL_GAME_SPEED = 16;
var BOARD_COLOR = '#550527';
var SNAKE_COLOR = '#FAA613'
var SNAKE_DEAD_COLOR = 'gray';
var WALL_COLOR = 'lightgray';
var STEP_SIZE = 32;

var ENTITY_MARGIN = 0;
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

  _getColor() {
    return this.color;
  }

  _drawUnit(x, y) {
    this.scene._context.fillStyle = this._getColor();
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
  constructor(x, y, value=1, type=FoodType.NORMAL, direction=Direction.NO_DIRECTION) {
    super(x, y, null, direction);
    this.type = type;
    this.value = value;
    this.marginX = FOOD_MARGIN;
    this.marginY = FOOD_MARGIN;
  }

  _getColor() {
    return FoodColorMapping[this.type];
  }

  effect() {
    if(this.type == FoodType.NORMAL) {
      this.scene.snake.coords.push(this.coords[0]);
      this.scene.score += this.value * this.scene.multiplier;
    } else if (this.type == FoodType.SURPRISE) {
      this.type = Food.pickRandomFoodType();
      this.effect();
    } else if (this.type == FoodType.SHORTENER) {
      this.scene.snake.coords.shift();
      this.scene.score += this.value * this.scene.multiplier;
    } else if (this.type == FoodType.WALL_CLEANER) {
      this.scene.snake.coords.push(this.coords[0]);
      this.scene.score += this.value * this.scene.multiplier;
      if (this.scene.wall.coords.length > 0) {
        let indexToPop = Math.floor(Math.random() * this.scene.wall.coords.length);
        this.scene.wall.coords.splice(indexToPop, 1);
      }
    } else if (this.type == FoodType.SHORTENER) {
      this.scene.snake.coords.shift();
      this.scene.score += this.value * this.scene.multiplier;
    } else if (this.type == FoodType.MULTIPLIER) {
      this.scene.snake.coords.push(this.coords[0]);
      this.scene.multiplier += 1;
    } else if (this.type == FoodType.GHOST) {
    } else if (this.type == FoodType.FOOD_INCREASE) {
      this.scene.snake.coords.push(this.coords[0]);
      this.scene.foodCount = Math.min(this.scene.foodCount + 1, this.scene._maxFoodCount);
      this.scene._resetFoods();
    } else if (this.type == FoodType.SPEED_UP) {
      this.scene.snake.coords.push(this.coords[0]);
      this.scene.setGameSpeed(this.scene.gameSpeed * 2);
      this.scene.score += this.value * this.scene.multiplier;
    } else if (this.type == FoodType.SLOW_DOWN) {
      this.scene.snake.coords.push(this.coords[0]);
      this.scene.setGameSpeed(Math.max(Math.floor(this.scene.gameSpeed / 2), 1));
      this.scene.score += this.value * this.scene.multiplier;
    }
  }
  static pickRandomFoodType() {
    let foodTypeList = Object.keys(FoodType);
    return FoodType[foodTypeList[Math.floor(Math.random() * foodTypeList.length)]];
  }
}

class Wall extends Entity {
  constructor(x, y, color=WALL_COLOR, direction=Direction.NO_DIRECTION) {
    super(x, y, color, WALL_MARGIN, WALL_MARGIN, direction);
    this.marginX = WALL_MARGIN;
    this.marginY = WALL_MARGIN;
  }
}

class Snake extends Entity {
  constructor(x, y, color=SNAKE_COLOR, deadcolor=SNAKE_DEAD_COLOR, direction=Direction.NO_DIRECTION) {
    super(x, y, color, direction);
    this.marginX = WALL_MARGIN;
    this.marginY = WALL_MARGIN;
    this.deadcolor = deadcolor;
    this.nextDirection = Direction.NO_DIRECTION;
  }

  _getColor() {
    return this.scene.status == GameStatus.OVER ? this.deadcolor : this.color;
  }

  update(feed=false) {
    let x, y;
    const head = this.coords.last();
    this.direction = this.nextDirection;
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
    if (!feed) this.coords.shift();
  }

  biteYourself() {
    let head = this.coords.last();

    let coord = [head[0] + 1, head[1] + 1];
    while (!this.scene._sameCoord(head, coord) && this.coords.length > 1) {
      coord = this.coords.shift();
      this.scene.wall.coords.push(coord);
    }
    this.scene.wall.coords.pop();
  }
}


class Game {
  constructor(stepSize=STEP_SIZE) {
    this._canvas = document.getElementById('canvas');
    this._context = this._canvas.getContext('2d');
    this._canvas.width = document.body.clientWidth;
    this._canvas.height = document.body.clientHeight;
    document.body.addEventListener('keydown', this.captureKey.bind(this));
    this.clearCanvas();

    this.stepSizeX = stepSize;
    this.stepSizeY = stepSize;

    this.gameSpeed = 0;
    this.status = GameStatus.READY;

    this.score = 0;
    this.multiplier = 1;
    this.foodCount = 1;

    this.snake = new Snake();
    this.snake.scene = this;
    this.foods = [];
    this.wall = new Wall();
    this.wall.scene = this;

    this.boardColor = BOARD_COLOR;


    this._initialGameSpeed = INITIAL_GAME_SPEED;
    this._maxFoodCount = 10;
    this._foodBeforeSpecialFood = 10
    this._foodTick = 1;
    this.resetGame();
  }

  captureKey(event) {
    const { keyCode } = event;
    if (keyCode == Key.RESET) {
      this.resetGame();
      return;
    } else if (this.status == GameStatus.OVER) {
      return;
    } else if (keyCode == Key.PAUSE) {
      this.togglePause();
      return;
    }
    if (this.status == GameStatus.PAUSED || this.status == GameStatus.OVER) {
      return
    } else if (keyCode == Key.UP && this.snake.direction !== Direction.DOWN) {
      this.snake.nextDirection = Direction.UP;
    } else if (keyCode == Key.RIGHT && this.snake.direction !== Direction.LEFT) {
      this.snake.nextDirection = Direction.RIGHT;
    } else if (keyCode == Key.DOWN && this.snake.direction !== Direction.UP) {
      this.snake.nextDirection = Direction.DOWN;
    } else if (keyCode == Key.LEFT && this.snake.direction !== Direction.RIGHT) {
      this.snake.nextDirection = Direction.LEFT;
    }
    if (this.status == GameStatus.READY) {
      this.status = GameStatus.UNPAUSED;
    }
  }

  togglePause() {
    if (this._interval) {
      clearInterval(this._interval);
    }
    if (this.status == GameStatus.PAUSED) {
      this.status = GameStatus.UNPAUSED;
      this._interval = setInterval(this.tick.bind(this), 1000 / this.gameSpeed);
    } else if (this.status == GameStatus.UNPAUSED) {
      this.status = GameStatus.PAUSED;
    }
  }

  resetGame() {
    this._resetWall()
    this._resetSnake();
    this._resetFoods();
    this._resetValues();
    this.status = GameStatus.READY;
  }

  _resetSnake() {
    this.snake.coords = []
    const initialPositionX = Math.floor(this.alignedWidth() / this.stepSizeX / 2) * this.stepSizeX;
    const initialPositionY = Math.floor(this.alignedHeight() / this.stepSizeY / 2) * this.stepSizeY;
    this.snake.coords.push([initialPositionX, initialPositionY]);
    this.snake.direction = Direction.NO_DIRECTION;
    this.snake.nextDirection = Direction.NO_DIRECTION;
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
    this._foodTick = 0;
    this.foodCount = 1;
    this.status = GameStatus.READY;
    this.setGameSpeed(this._initialGameSpeed);
  }

  setGameSpeed(value) {
    this.gameSpeed = value;
    clearInterval(this._interval);
    this._interval = setInterval(this.tick.bind(this), 1000 / this.gameSpeed);
  }

  setFoodCount(value) {
    this.foodCount = min(value, this._maxFoodCount);
    this._resetFoods();
  }

  drawFoods() {
    for (var i = this.foods.length - 1; i >= 0; i--) {
      this.foods[i].draw();
    }
  }

  horizontalStepCount() {
    return Math.floor(this._canvas.width / this.stepSizeX);
  }

  verticalStepCount() {
    return Math.floor(this._canvas.height / this.stepSizeY);
  }

  alignedWidth() {
    return this.horizontalStepCount() * this.stepSizeX;
  }

  alignedHeight() {
    return this.verticalStepCount() * this.stepSizeY;
  }

  generateValidFood(type = FoodType.NORMAL) {
    let food = this.generateFood();
    while (!this.isFoodValid(food)) {
      food = this.generateFood();
    }
    food.scene = this;
    food.type = type;
    this.foods.push(food);
  }

  generateFood(type=FoodType.NORMAL) {
    const x = Math.floor(Math.random() * this.horizontalStepCount()) * this.stepSizeX;
    const y = Math.floor(Math.random() * this.verticalStepCount()) * this.stepSizeY;

    let newFood = new Food(x, y, 1, type=FoodType.NORMAL);
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
        this.status = GameStatus.OVER;
        return;
      }
    }
    for (var i = this.foods.length - 1; i >= 0; i--) {
      if (this._sameCoord(this.foods[i].coords[0], snakeHead)) {
        this.foods[i].effect();
        this.removeFood(i);
        this._foodTick = (this._foodTick + 1) % this._foodBeforeSpecialFood;
        let foodTypeForNewFood;
        if (this._foodTick == 0) {
          foodTypeForNewFood = Food.pickRandomFoodType();
        } else {
          foodTypeForNewFood = FoodType.NORMAL;
        }
        this.generateValidFood(foodTypeForNewFood);
        return;
      }
    }
    for (var i = this.snake.coords.length - 2; i >= 0; i--) {
      if (this._sameCoord(this.snake.coords[i], snakeHead)) {
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

  drawScore() {
    this._context.fillStyle = "rgba(255, 255, 255, 0.3)";
    this._context.font = "64px Monospace";
    this._context.textAlign = "center";
    this._context.fillText("Score: " + this.score, canvas.width/2, canvas.height/2);
  }

  tick() {
    this.clearCanvas(this.boardColor);
    this.drawFoods();
    this.wall.draw();
    this.snake.draw();

    this.detectSnakeCrash();
    if (this.status == GameStatus.OVER) {
      clearInterval(this._interval);
      this.snake.draw();
    }
    this.drawScore();
    this.snake.update();
  }
}

const snakeGame = new Game();
