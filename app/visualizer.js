function FunkyShape() {}

/*
FunkyShape init gives initial and offset values for
the perlin noise functions in update.
Giving different initial values ensures that
each funky shape follows its own funky path
*/

FunkyShape.prototype.init = function(xInc, yInc, xOff, yOff, radius) {
    this.xInc = xInc;
    this.yInc = yInc;
    this.xOff = xOff;
    this.yOff = yOff;
    this.radius = radius;
    this.xPos = 0;
    this.yPos = 0;
}
//updates the x, y, and radius values of the shape
FunkyShape.prototype.update = function(envelope) {
    this.xPos = noise(this.xOff) * width;
    this.yPos = noise(this.yOff) * height;
    this.xOff += this.xInc;
    this.yOff += this.yInc;
    this.sRadius = this.radius * envelope;
    return {
        "xPos": this.xPos,
        "yPos": this.yPos,
        "radius": this.sRadius
    };
}

//using our FunkyShape class
//to create a funkyCircle class
var funkyCircle = new FunkyShape();
//creating an empty array
var funkySquare = [];
//and populating it with 3 FunkyShapes
for (var i = 0; i < 3; i++) {
    funkySquare[i] = new FunkyShape();
}
var cap, canvas;

function setup() {
    //create a canvas width and height of the screen
    canvas = createCanvas(vidWidth, vidHeight);
    canvas.parent('container');
    cap = createCapture(VIDEO);
    cap.hide();

    //no fill
    fill(255);
    strokeWeight(1);
    rectMode(CENTER);
    //initializing our funky circle
    funkyCircle.init(0.01, 0.02, 0.0, 0.0, 40);
    //initializing our squares with random values
    //to ensure they don't follow the same path
    for (var i = 0; i < 3; i++) {
        var xInc = Math.random() / 10;
        var yInc = Math.random() / 10;
        funkySquare[i].init(xInc, yInc, 0, 0, 30);
    }
}
var phase = 0;
function draw() {
  if (trackingStarted) {
    image(cap, 0, 0, vidWidth, vidHeight);
    stroke(0);
    //drawing the kick wave at the bottom
    //it is composed of a simple sine wave that
    //changes in height with the kick envelope
    for (var i = 0; i < width; i++) {
      //scaling kickEnvelope value by 200
      //since default is 0-1
      var kickValue = kick.envelope.value * 200;
      //multiplying this value to scale the sine wave
      //depending on x position
      var yDot = Math.sin((i / 60) + phase) * kickValue;
      point(i, height -150 + yDot);
    }
      //increasing phase means that the kick wave will
      //not be standing and looks more dynamic
      phase += 1;
      //updating circle and square positions with
      //bass and bleep envelope values
      var circlePos = funkyCircle.update(bass.getLevelAtTime());
      //circlePos returns x and y positions as an object
      ellipse(circlePos.xPos, circlePos.yPos, circlePos.radius/10, circlePos.radius);
      stroke('red');
      for (var i = 0; i < 3; i++) {
          var squarePos = funkySquare[i].update(SYNTH.voices[i].getLevelAtTime());
          rect(squarePos.xPos, squarePos.yPos, squarePos.radius/10, squarePos.radius*3);
      }
  }
}
