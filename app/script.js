/* global clm, Tone, requestAnimFrame */
document.addEventListener("DOMContentLoaded", function() {
  var vid = document.getElementById('videoel');
  var vid_width = vid.width;
  var vid_height = vid.height;
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
    vid_width = Math.round(vid_height * proportion);
    vid.width = vid_width;
    overlay.width = vid_width;
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
            
      face.upper_mouth = positions.slice(59, 62) // slice is not inclusive
      face.lower_mouth = positions.slice(56, 59) // slice is not inclusive
      face.pupil_left = positions[27];
      face.pupil_right = positions[32]
    
      face.eyebrow_left = positions.slice(19, 23);
      face.eyebrow_right = positions.slice(15, 19);
    
      face.nose = positions.slice(34, 41);
      face.bridge = [positions[33], positions[41], positions[60]];
      face.upper_lip = positions.slice(44, 51);
      face.lower_lip = positions.slice(50, 58);
    
      // the eye has the upper, the lower and the middle portions
      // Q: can each part can correspond to an instrument piece?
      face.eye_left = [];
      face.eye_right = [];
    
      
    
      return face;
    
  }
  
  function getVariance(points, avg) {
    // do we make variance a single number or two numbers?
    var x_sse = 0;
    var y_sse = 0;
    for (var p in points) {
        x_sse += Math.pow(points[p][0] - avg[0], 2)
        y_sse += Math.pow(points[p][1] - avg[1], 2)
      
    }
    
    x_sse /= points.length;
    y_sse /= points.length;
    
    return [x_sse, y_sse];
    
  }
  
  function getAverage(points) {
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
  
  var synth = new Tone.AMSynth().toMaster();
  
  setInterval(function() {
    // synth.trigerAttackRelease("f4", "2n", "2n");
    
    // console.log("MAKING A NOISE");

    synth.triggerAttackRelease("f4", "4n", "8n");
    
    return true;

    
  }, 1000)



  function drawLoop() {
    requestAnimFrame(drawLoop);
    overlayCC.clearRect(0, 0, vid_width, vid_height);
    if (ctrack.getCurrentPosition()) {
      ctrack.draw(overlay);
      var positions = ctrack.getCurrentPosition();
      var upper_mouth = positions[57][1];
      var lower_mouth = positions[60][1];      
          
      
      var distance = Math.abs(upper_mouth - lower_mouth);
      if (distance > 10) {
        console.log("TRIGGERING SYNTH");
        synth.triggerAttackRelease('C4', '8n');
      }
    }
  }
});



//