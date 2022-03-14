/**
 * The skier is the entity controlled by the player in the game. The skier skis down the hill, can move at different
 * angles, and crashes into obstacles they run into. If caught by the rhino, the skier will get eaten and die.
 */

import {IMAGE_NAMES, DIAGONAL_SPEED_REDUCER, KEYS, ANIMATION_FRAME_SPEED_MS} from "../Constants";
import {Entity} from "./Entity";
import {intersectTwoRects, Rect} from "../Core/Utils";
import {Animation} from "../Core/Animation";

/**
 * The skier starts running at this speed. Saved in case speed needs to be reset at any point.
 * @type {number}
 */
const STARTING_SPEED = 10;

/**
 * The different states the skier can be in.
 * @type {string}
 */
const STATE_SKIING = "skiing";
const STATE_CRASHED = "crashed";
const STATE_DEAD = "dead";
const STATE_JUMPING = "jumping";

/**
 * The different directions the skier can be facing.
 * @type {number}
 */
const DIRECTION_LEFT = 0;
const DIRECTION_LEFT_DOWN = 1;
const DIRECTION_DOWN = 2;
const DIRECTION_RIGHT_DOWN = 3;
const DIRECTION_RIGHT = 4;

/**
 * Mapping of the image to display for the skier based upon which direction they're facing.
 * @type {{number: string}}
 */
const DIRECTION_IMAGES = {
  [DIRECTION_LEFT]: IMAGE_NAMES.SKIER_LEFT,
  [DIRECTION_LEFT_DOWN]: IMAGE_NAMES.SKIER_LEFTDOWN,
  [DIRECTION_DOWN]: IMAGE_NAMES.SKIER_DOWN,
  [DIRECTION_RIGHT_DOWN]: IMAGE_NAMES.SKIER_RIGHTDOWN,
  [DIRECTION_RIGHT]: IMAGE_NAMES.SKIER_RIGHT
};

/**
 * Mapping of the image to display for the skier state when in jump state.
 * @type {(string)[]}
 */
const JUMP_IMAGES = [
  IMAGE_NAMES.SKIER_DOWN,
  IMAGE_NAMES.SKIER_JUMP1,
  IMAGE_NAMES.SKIER_JUMP2,
  IMAGE_NAMES.SKIER_JUMP3,
  IMAGE_NAMES.SKIER_JUMP4
];

export class Skier extends Entity {
  /**
   * The name of the current image being displayed for the skier.
   * @type {string}
   */
  imageName = IMAGE_NAMES.SKIER_DOWN;
  
  /**
   * What state the skier is currently in.
   * @type {string}
   */
  state = STATE_SKIING;
  
  /**
   * Stores all of the animations available for the different jump states of the skier.
   * @type {Animation[]}
   */
  
  animations = [];
  /**
   * What direction the skier is currently facing.
   * @type {number}
   */
  direction = DIRECTION_DOWN;
  
  /**
   * How fast the skier is currently moving in the game world.
   * @type {number}
   */
  speed = STARTING_SPEED;
  
  /**
   * Stored reference to the ObstacleManager
   * @type {ObstacleManager}
   */
  
  obstacleManager = null;
  /**
   * The animation that the Skier is currently using. Typically matches the state the Skier is in.
   * @type {Animation}
   */
  curAnimation = null;
  
  /**
   * The current frame of the current animation the Skier is on.
   * @type {number}
   */
  curAnimationFrame = 0;
  
  /**
   * Current game time set form game time class.
   * @type {number}
   */
  gameTime = 0
  /**
   * The time in ms of the last frame change. Used to provide a consistent framerate.
   * @type {number}
   */
  curAnimationFrameTime = Date.now();
  
  /**
   * Init the skier.
   *
   * @param {number} x
   * @param {number} y
   * @param {ImageManager} imageManager
   * @param {ObstacleManager} obstacleManager
   * @param {Canvas} canvas
   */
  constructor(x, y, imageManager, obstacleManager, canvas) {
    super(x, y, imageManager, canvas);
    this.setupAnimations();
    this.setAnimation()
    this.obstacleManager = obstacleManager;
  }
  
  /**
   * Is the skier currently in the crashed state
   *
   * @returns {boolean}
   */
  isCrashed() {
    return this.state === STATE_CRASHED;
  }
  
  /**
   * Create and store the animations. These also reinitialize Animation to get it ready after the first one is completed
   *
   */
  setupAnimations() {
    this.animations[STATE_JUMPING] = new Animation(
      JUMP_IMAGES,
      false,
      () => {
       this.jumpCompleted()
      }
    );
  }
  
  /**
   * This is called when jump animation is completed. reset the state of jump animation,
   * sets state to SKIING and set the correct direction of the Skier.
   *
   */
  jumpCompleted () {
    this.setAnimation();
    this.state = STATE_SKIING
    this.setDirectionalImage()
  }
  /**
   * Is the skier currently in the skiing state
   *
   * @returns {boolean}
   */
  isSkiing() {
    return this.state === STATE_SKIING;
  }
  
  /**
   * Is the skier currently in the jumping state
   *
   * @returns {boolean}
   */
  isJumping() {
    return this.state === STATE_JUMPING;
  }
  
  /**
   * Set the current animation, reset to the beginning of the animation and set the proper image to display.
   */
  setAnimation() {
    this.curAnimation = this.animations[STATE_JUMPING];
    if (!this.curAnimation) {
      return;
    }
    this.curAnimationFrame = 0;
    const animateImages = this.curAnimation.getImages();
    this.imageName = animateImages[this.curAnimationFrame];
  }
  
  /**
   * Is the skier currently in the dead state
   *
   * @returns {boolean}
   */
  isDead() {
    return this.state === STATE_DEAD;
  }
  
  /**
   * Set the current direction the skier is facing and update the image accordingly
   *
   * @param {number} direction
   */
  setDirection(direction) {
    this.direction = direction;
    this.setDirectionalImage();
  }
  
  /**
   * Advance to the next frame in the current animation if enough time has elapsed since the previous frame.
   *
   * @param {number} gameTime
   */
  animate(gameTime) {
    if (!this.curAnimation) {
      return;
    }
    this.move(this.direction)
    if (gameTime - this.curAnimationFrameTime > ANIMATION_FRAME_SPEED_MS) {
      this.nextAnimationFrame(gameTime);
    }
  }
  
  /**
   * Set the skier's image based upon the direction they're facing.
   */
  setDirectionalImage() {
    this.imageName = DIRECTION_IMAGES[this.direction];
  }
  
  /**
   * Increase the current animation frame and update the image based upon the sequence of images for the animation.
   * If the animation isn't looping, then finish the animation instead. These implementations will be abstracted into a class much later
   *
   * @param {number} gameTime
   */
  nextAnimationFrame(gameTime) {
    const animationImages = this.curAnimation.getImages();
    this.curAnimationFrameTime = gameTime;
    this.curAnimationFrame++;
    if (this.curAnimationFrame >= animationImages.length) {
      if (!this.curAnimation.getLooping()) {
        this.finishAnimation();
        return;
      }
      
      this.curAnimationFrame = 0;
    }
    
    this.imageName = animationImages[this.curAnimationFrame];
  }
  
  /**
   * The current animation wasn't looping, so finish it by clearing out the current animation and firing the callback.
   */
  finishAnimation() {
    const animationCallback = this.curAnimation.getCallback();
    this.curAnimation = null;
    
    animationCallback.apply();
  }
  
  /**
   * Move the skier and check to see if they've hit an obstacle. The skier only moves in the skiing state.
   */
  update(gameTime) {
    this.gameTime = gameTime
    if (this.isSkiing()) {
      this.move();
      this.checkIfHitObstacle();
    }
    if (this.isJumping()) {
      this.animate(gameTime);
    }
  }
  
  /**
   * Draw the skier if they aren't dead
   */
  draw() {
    if (this.isDead()) {
      return;
    }
    
    super.draw();
  }
  
  /**
   * Move the skier based upon the direction they're currently facing. These handles frame update movement.
   */
  move() {
    switch (this.direction) {
      case DIRECTION_LEFT_DOWN:
        this.moveSkierLeftDown();
        break;
      case DIRECTION_DOWN:
        this.moveSkierDown();
        break;
      case DIRECTION_RIGHT_DOWN:
        this.moveSkierRightDown();
        break;
      case DIRECTION_LEFT:
      case DIRECTION_RIGHT:
        // Specifically calling out that we don't move the skier each frame if they're facing completely horizontal.
        break;
    }
  }
  
  /**
   * Move the skier left. Since completely horizontal movement isn't frame based, just move incrementally based upon
   * the starting speed.
   */
  moveSkierLeft() {
    this.x -= STARTING_SPEED;
  }
  
  /**
   * Move the skier diagonally left in equal amounts down and to the left. Use the current speed, reduced by the scale
   * of a right triangle hypotenuse to ensure consistent traveling speed at an angle.
   */
  moveSkierLeftDown() {
    this.x -= this.speed / DIAGONAL_SPEED_REDUCER;
    this.y += this.speed / DIAGONAL_SPEED_REDUCER;
  }
  
  /**
   * Move the skier down at the speed they're traveling.
   */
  moveSkierDown() {
    this.y += this.speed;
  }
  
  /**
   * Move the skier diagonally right in equal amounts down and to the right. Use the current speed, reduced by the scale
   * of a right triangle hypotenuse to ensure consistent traveling speed at an angle.
   */
  moveSkierRightDown() {
    this.x += this.speed / DIAGONAL_SPEED_REDUCER;
    this.y += this.speed / DIAGONAL_SPEED_REDUCER;
  }
  
  /**
   * Move the skier right. Since completely horizontal movement isn't frame based, just move incrementally based upon
   * the starting speed.
   */
  moveSkierRight() {
    this.x += STARTING_SPEED;
  }
  
  /**
   * Move the skier up. Since moving up isn't frame based, just move incrementally based upon
   * the starting speed.
   */
  moveSkierUp() {
    this.y -= STARTING_SPEED;
  }
  
  /**
   * Handle keyboard input. If the skier is dead, don't handle any input.
   *
   * @param {string} inputKey
   * @returns {boolean}
   */
  handleInput(inputKey) {
    if (this.isDead()) {
      return false;
    }
    
    let handled = true;
    switch (inputKey) {
      case KEYS.LEFT:
        this.turnLeft();
        break;
      case KEYS.RIGHT:
        this.turnRight();
        break;
      case KEYS.UP:
        this.turnUp();
        break;
      case KEYS.DOWN:
        this.turnDown();
        break;
      case KEYS.SPACE_BAR:
        // this.jumpUp()
        break;
      default:
        handled = false;
    }
    
    return handled;
  }
  
  /**
   * Turn the skier left. If they're already completely facing left, move them left. Otherwise, change their direction
   * one step left. If they're in the crashed state, then first recover them from the crash.
   */
  turnLeft() {
    if (this.isCrashed()) {
      this.recoverFromCrash(DIRECTION_LEFT);
    }
    
    if (this.direction === DIRECTION_LEFT) {
      this.moveSkierLeft();
    } else {
      this.setDirection(this.direction - 1);
    }
  }
  
  /**
   * Turn the skier right. If they're already completely facing right, move them right. Otherwise, change their direction
   * one step right. If they're in the crashed state, then first recover them from the crash.
   */
  turnRight() {
    if (this.isCrashed()) {
      this.recoverFromCrash(DIRECTION_RIGHT);
    }
    
    if (this.direction === DIRECTION_RIGHT) {
      this.moveSkierRight();
    } else {
      this.setDirection(this.direction + 1);
    }
  }
  
  /**
   * Turn the skier up which basically means if they're facing left or right, then move them up a bit in the game world.
   * If they're in the crashed state, do nothing as you can't move up if you're crashed.
   */
  turnUp() {
    if (this.isCrashed()) {
      return;
    }
    
    if (this.direction === DIRECTION_LEFT || this.direction === DIRECTION_RIGHT) {
      this.moveSkierUp();
    }
  }
  
  /**
   * Turn the skier to face straight down. If they're crashed don't do anything to require them to move left or right
   * to escape an obstacle before skiing down again.
   */
  turnDown() {
    if (this.isCrashed()) {
      return;
    }
    
    this.setDirection(DIRECTION_DOWN);
  }
  
  /**
   * Jump Up to escape obstacle.
   * If they're in the crashed state, do nothing as you can't move up if you're crashed.
   */
  jumpUp() {
    if (this.isCrashed()) {
      return;
    }
    this.animate()
    // this.setDirection(DIRECTION_DOWN);
  }
  
  /**
   * The skier has a bit different bounds calculating than a normal entity to make the collision with obstacles more
   * natural. We want te skier to end up in the obstacle rather than right above it when crashed, so move the bottom
   * boundary up.
   *
   * @returns {Rect}
   */
  getBounds() {
    const image = this.imageManager.getImage(this.imageName);
    return new Rect(
      this.x - image.width / 2,
      this.y - image.height / 2,
      this.x + image.width / 2,
      this.y - image.height / 4
    );
  }
  
  /**
   * Go through all the obstacles in the game and see if the skier collides with any of them. If so, crash the skier.
   */
  checkIfHitObstacle() {
    const skierBounds = this.getBounds();
    
    const collision = this.obstacleManager.getObstacles().find((obstacle) => {
      const obstacleBounds = obstacle.getBounds();
      const intersectingWithTwoRects = intersectTwoRects(skierBounds, obstacleBounds)
      console.log("Here", this.state)
      if (intersectingWithTwoRects && obstacle.imageName === IMAGE_NAMES.JUMP_RAMP && this.state !== STATE_JUMPING) {
        this.state = STATE_JUMPING;
        return false
      }
      return intersectingWithTwoRects;
    });
    
    if (collision) {
      this.crash();
    }
  }
  
  /**
   * Crash the skier. Set the state to crashed, set the speed to zero cause you can't move when crashed and update the
   * image.
   */
  crash() {
    this.state = STATE_CRASHED;
    this.speed = 0;
    this.imageName = IMAGE_NAMES.SKIER_CRASH;
  }
  
  jump() {
    this.state = STATE_JUMPING
    this.speed = 20
    
  }
  
  /**
   * Change the skier back to the skiing state, get them moving again at the starting speed and set them facing
   * whichever direction they're recovering to.
   *
   * @param {number} newDirection
   */
  recoverFromCrash(newDirection) {
    this.state = STATE_SKIING;
    this.speed = STARTING_SPEED;
    this.setDirection(newDirection);
  }
  
  /**
   * Kill the skier by putting them into the "dead" state and stopping their movement.
   */
  die() {
    this.state = STATE_DEAD;
    this.speed = 0;
  }
}
