# Ceros Ski Code Challenge Solution



The solution to the challenge have been deployed to:
https://ceros-ski-test.herokuapp.com

Or deploy it locally by running:
```
npm install
npm run dev
```

**How To Play**

* Use the arrow keys to turn the skier.
* The skier will crash if they hit an obstacle. Use the left/right keys to move away from the obstacle and then down
  to resume skiing. you can also use the space bar to jump smaller obstacles like rocks, but you can't jump over trees.
* At some point the rhino will appear, chasing the skier. It will inevitably catch the skier and eat them, ending the
  game.

# Solution Steps

1. Added the jump ramp to the obstacle list and defined the image.
2. Studied the Rhino animations cycle and replicated the same process for the Skier jump transition.
3. Updated the checkIfHitObstacle to check for Image name which contains the name JUMP_RAMP to avoid setting crashed to true when it's a JUMP_RAMP.
4. Added a check for when it's obstacle is a ROCK1 or ROCK2 which can be jumped this will check if STATE this equal to STATE_JUMPING then crashed will not be set to true.
5. Checks if it's already jumping to avoid jumping while it sill in the air.
