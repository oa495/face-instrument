/* Setup of video/webcam and checking for webGL support */
function enablestart() {
  var startbutton = document.getElementById("start");
  var loadingIcon = startbutton.querySelector('svg.loading');
  loadingIcon.classList.add('hide');
  var playIcon = startbutton.querySelector('svg.play');
  playIcon.classList.remove('hide');
  startbutton.disabled = false;
  startbutton.addEventListener("click", startVideo);
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

function initAudioStream() {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
    aStream = stream;
  });
}


function startVideo() {
  initAudioStream();
  // start tracking
  ctrack.start(vid);
  trackingStarted = true;
  var calibrateButtons = document.querySelectorAll('#instruments button');
  for (var i = 0; i < calibrateButtons.length; i++) {
    removeClass(calibrateButtons[i], 'hide');
  }
  var calibrateButton = document.getElementById('calibrate');
  removeClass(calibrateButton, 'hide');
  calibrateButton.disabled = null;

  // start loop to draw face
  drawLoop();
  // start music
  makeLoops();
}

function removeClass(el, c) {
  if (el) el.className = el.className.replace(new RegExp('(?:^|s)' + c + '(?!S)'), '');
}
