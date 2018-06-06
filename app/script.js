/* global clm, Tone, requestAnimFrame */
document.addEventListener("DOMContentLoaded", function() {
  var vid = document.getElementById('videoel');
  var vidWidth = vid.width;
  var vidHeight = vid.height;
  var overlay = document.getElementById('overlay');
  var overlayCC = overlay.getContext('2d');

  /* Setup of video/webcam and checking for webGL support */
  function enablestart() {
    var startbutton = document.getElementById('startbutton');
    startbutton.value = "start";
    startbutton.disabled = null;
    startbutton.addEventListener("click", startVideo);
  }


  function adjustVideoProportions() {
    // resize overlay and video if proportions of video are not 4:3
    // keep same height, just change width
    var proportion = vid.videoWidth/vid.videoHeight;
    vidWidth = Math.round(vidHeight * proportion);
    vid.width = vidWidth;
    overlay.width = vidWidth;
  }

  // gum = get user media
  function gumSuccess(stream) {
    // add camera stream if getUserMedia succeeded
    if ("srcObject" in vid) {
      vid.srcObject = stream;
    } else {
      vid.src = (window.URL && window.URL.createObjectURL(stream));
    }
    vid.onloadedmetadata = function() {
      adjustVideoProportions();
      vid.play();
    }
    vid.onresize = function() {
      adjustVideoProportions();
      if (trackingStarted) {
        ctrack.stop();
        ctrack.reset();
        ctrack.start(vid);
      }
    }
  }

  function gumFail() {
    document.getElementById('gum').className = "hide";
    document.getElementById('nogum').className = "nohide";
    alert("There was some problem trying to fetch video from your webcam.");
  }

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
  // set up video
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({video : true}).then(gumSuccess).catch(gumFail);
  } else if (navigator.getUserMedia) {
    navigator.getUserMedia({video : true}, gumSuccess, gumFail);
  } else {
    gumFail();
  }

  vid.addEventListener('canplay', enablestart, false);

  /** Code for face tracking **/
  var ctrack = new clm.tracker();
  ctrack.init();
  var trackingStarted = false;

  function startVideo() {
    // start video
    vid.play();
    // start tracking
    ctrack.start(vid);
    trackingStarted = true;
    // start loop to draw face
    drawLoop();
  }

  // TODO: normalize face positions so that they are scaled proportionally to
  // the center of mass of the face. maybe this would help with the recognized face
  // jumping around
  function positionsToFace(positions) {
      var face = { };

      var avg = getAverage(positions);
      var variance = getVariance(positions, avg);

      face.upperMouth = positions.slice(59, 62) // slice is not inclusive
      face.lowerMouth = positions.slice(56, 59) // slice is not inclusive
      face.pupilLeft = [positions[27]];
      face.pupilRight = [positions[32]];

      face.eyebrowLeft = positions.slice(19, 23);
      face.eyebrowRight = positions.slice(15, 19);

      face.nose = positions.slice(34, 41);
      face.bridge = [positions[33], positions[41], positions[60]];
      face.upperLip = positions.slice(44, 51);
      face.lowerLip = positions.slice(50, 58);

      // the eye has the upper, the lower and the middle portions
      // Q: can each part can correspond to an instrument piece?
      face.eyeLeft = [];
      face.eyeRight = [];



      return face;

  }

  function getVariance(points, avg) {
    // do we make variance a single number or two numbers?
    var xSse = 0;
    var ySse = 0;
    for (var p in points) {
        xSse += Math.pow(points[p][0] - avg[0], 2)
        ySse += Math.pow(points[p][1] - avg[1], 2)

    }

    xSse /= points.length;
    ySse /= points.length;

    return [xSse, ySse];

  }

  function getAverage(points) {
    if (points.length == 1) {
      return points[0];
    }

    var x = 0;
    var y = 0;

    for (var n in points) {
      x += points[n][0];
      y += points[n][1];
    }

    x /= points.length;
    y /= points.length;

    return [x,y];

  }

  var prevFace = {};
  function calcDeltas(face, center) {
    var faceDelta = {};

    if (prevFace) {
      for (var field in face) {
          if (!prevFace[field]) {
              continue;
          }
          // each part of face is actually an array.
          // maybe we should take the center of mass for each face
          // position

          var f = getAverage(face[field]);


          faceDelta[field] = [center[0] - f[0], center[1] - f[1]];

      }

    }
    prevFace = face;

    return faceDelta;

  }

  function SliderInstrument() {

  }

  function ToggleInstrument(p1, p2, minX, minY) {
    this.p1 = p1;
    this.p2 = p2;
    this.minX = minX;
    this.minY = minY;
    var shouldPlay = false;
    var noteToPlay = 'f';
    var octave = 2;

    this.getNote = function() {
      return noteToPlay;
    };

    this.activate = function() {
      if (this.active) {
        return;
      }

      this.active = true;
      console.log("TRIGGERING SYNTH FOR", p1, p2);
      synth.triggerAttackRelease(`${this.getNote()}${this.getOctave()}`);

    }

    this.deactivate = function() {
      if (!this.active) {
        return;
      }

      console.log("DEACTIVATING SYNTH FOR", p1, p2);

      this.active = false;
    }

    this.getOctave = function() {
      return octave;
    }

    this.checkDelta = function(face) {
      var pa1 = getAverage(face[p1]);
      var pa2 = getAverage(face[p2]);


      var deltaX = Math.abs(pa1[0] - pa2[0]);
      var deltaY = Math.abs(pa1[1] - pa2[1]);

      return (deltaY > this.minY && this.minY >= 0) || (deltaX > this.minX && this.minX >= 0);
    };
  }

  const synth = new Tone.AMSynth().toMaster();

  var face = {};
  face.mouth = new ToggleInstrument('upperMouth', 'lowerMouth', -1, 20);
  face.pupil = new ToggleInstrument('pupilLeft', 'pupilRight', 2, -1);
  face.eyebrowLeft = new ToggleInstrument('eyebrowLeft', 'pupilLeft', -1, 10);
  face.eyebrowRight = new ToggleInstrument('eyebrowRight', 'pupilRight', -1, 10);
//  face.nose = new ToggleInstrument('nose', -1, 10);
//  face.bridge = new ToggleInstrument('bridge', -1, 10);
  face.lip = new ToggleInstrument('upperLip', 'lowerLip', -1, 10);


  function drawLoop() {
    requestAnimFrame(drawLoop);
    overlayCC.clearRect(0, 0, vidWidth, vidHeight);
    if (ctrack.getCurrentPosition()) {
      ctrack.draw(overlay);
      var positions = ctrack.getCurrentPosition();
      var faceWithPositions = positionsToFace(positions, face);
      for (facePart in face) {
        var ff = face[facePart];
        if (ff.checkDelta(faceWithPositions)) {
          ff.activate();
        } else {
          ff.deactivate();
        }
      }
    }
  }
});
