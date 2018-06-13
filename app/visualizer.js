var vid, canvas, vidHeight, vidWidth, cap, myp5, width, height;
document.addEventListener("DOMContentLoaded", function() {
  var s = function( p ) {
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
        this.xPos = p.noise(this.xOff) * vidWidth;
        this.yPos = p.noise(this.yOff) * vidHeight;
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

    p.setup = function() {
      cap = p.createCapture(function() {
        vid = cap.elt;
        vid.addEventListener('canplay', enablestart, false);
        canvas = p.createCanvas((0.6 * p.windowWidth), 600);
        vid.id = 'videoel';
        vid.muted = true;
        height = vid.offsetHeight;
        width = vid.offsetWidth;
        setupRecording();
      });
      cap.size((0.6 * p.windowWidth), 600);
      vidWidth = cap.width;
      vidHeight = cap.height;

      //no fill
      p.fill(255);
      p.strokeWeight(1);
      p.rectMode(p.CENTER);
      //initializing our funky circle
      funkyCircle.init(0.01, 0.02, 0.0, 0.0, 40);
      //initializing our squares with random values
      //to ensure they don't follow the same path
      for (var i = 0; i < 3; i++) {
          var xInc = Math.random() / 10;
          var yInc = Math.random() / 10;
          funkySquare[i].init(xInc, yInc, 0, 0, 30);
      }
    };

    p.windowResized = function () {
      ctrack.stop();
      ctrack.reset();
      ctrack.start(vid);
      vid.width = Math.round(0.6 * p5.windowWidth);
      p.resizeCanvas(vid.offsetWidth, vid.offsetHeight);
    };

    var phase = 0;
    p.draw = function() {
      if (trackingStarted) {
        p.image(cap, 0, 0, vid.offsetWidth, vid.offsetHeight);
        p.stroke(0);
        //drawing the kick wave at the bottom
        //it is composed of a simple sine wave that
        //changes in height with the kick envelope
        for (var i = 0; i < vidWidth; i++) {
          //scaling kickEnvelope value by 200
          //since default is 0-1
          var kickValue = kick.envelope.value * 200;
          //multiplying this value to scale the sine wave
          //depending on x position
          var yDot = Math.sin((i / 60) + phase) * kickValue;
          p.point(i, vidHeight -150 + yDot);
        }
        //increasing phase means that the kick wave will
        //not be standing and looks more dynamic
        phase += 1;
        //updating circle and square positions with
        //bass and bleep envelope values
        var circlePos = funkyCircle.update(bass.getLevelAtTime());
        //circlePos returns x and y positions as an object
        p.ellipse(circlePos.xPos, circlePos.yPos, circlePos.radius/5, circlePos.radius);
        p.stroke('red');
        for (var i = 0; i < 3; i++) {
            var squarePos = funkySquare[i].update(SYNTH.voices[i].getLevelAtTime() * 5);
            p.rect(squarePos.xPos, squarePos.yPos, squarePos.radius/10, squarePos.radius);
        }
      }
    }
  };
  myp5 = new p5(s, window.document.querySelector('.webcam'));
});
