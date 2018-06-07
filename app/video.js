var vid, overlay, overlayCC, vidHeight, vidWidth;
document.addEventListener("DOMContentLoaded", function() {
  vid = document.getElementById('videoel');
  vidWidth = vid.width;
  vidHeight = vid.height;
  overlay = document.getElementById('overlay');
  overlayCC = overlay.getContext('2d');
  width = vid.offsetWidth;
  height = vid.offsetHeight;

  var constraints = {
    audio: true,
    video: true
  };

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
    recordButton.disabled = false;
    window.stream = stream;
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

  window.getCenterOfElement = function(el) {
    const offsetTop = el.offsetTop;
    const offsetLeft = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;
    return {
      'centerX': offsetLeft + width / 2,
      'centerY': offsetTop + height / 2
    };
  }

  function gumFail() {
    alert("There was some problem trying to fetch video from your webcam.");
  }

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
  // set up video
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia(constraints).then(gumSuccess).catch(gumFail);
  } else if (navigator.getUserMedia) {
    navigator.getUserMedia({video : true}, gumSuccess, gumFail);
  } else {
    gumFail();
  }

  vid.addEventListener('canplay', enablestart, false);

  function startVideo() {
    // start video
    vid.play();
    // start tracking
    ctrack.start(vid);
    trackingStarted = true;
    // start loop to draw face
    drawLoop();
  }
});
