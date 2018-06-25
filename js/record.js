var aStream, recordedVideo, mediaRecorder, recordedBlobs, sourceBuffer, mediaSource;
var recordButton = document.querySelector('button#record');
var playButton = document.querySelector('button#play');
var downloadButton = document.querySelector('button#download');
var startButton = recordButton.querySelector('svg.start-recording');
var stopButton = recordButton.querySelector('svg.stop-recording');
var stopButton = recordButton.querySelector('svg.stop-recording');
var format = 'video/webm';
recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;

function setupRecording() {
  if (window.MediaSource) {
    recordedVideo = document.querySelector('video#recorded');
    recordButton = document.querySelector('button#record');
    playButton = document.querySelector('button#play');
    downloadButton = document.querySelector('button#download');
    recordButton.onclick = toggleRecording;
    playButton.onclick = play;
    downloadButton.onclick = download;

    mediaSource = new MediaSource();
    mediaSource.addEventListener('sourceopen', handleSourceOpen, false);

    recordedVideo.addEventListener('error', function(ev) {
      console.error('MediaRecording.recordedMedia.error()');
      alert('Your browser can not play\n\n' + recordedVideo.src
        + '\n\n media clip. event: ' + JSON.stringify(ev));
    }, true);
  }
  else {
    console.log("The Media Source Extensions API is not supported.")
  }
}

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer(format + 'codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
}

function toggleRecording() {
    if (stopButton.classList.contains('hide')) {
      startRecording();
  } else {
      stopRecording();
  }
  startButton.classList.toggle('hide');
  stopButton.classList.toggle('hide');
}

function startRecording() {
    recordedBlobs = [];
    var options = {mimeType: format + ';codecs=vp9'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = {mimeType:  format+ ';codecs=vp8'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: format};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: ''};
        }
      }
    }
    try {
      var stream = canvas.elt.captureStream(); // frames per second
      stream.addTrack(aStream.getAudioTracks()[0]);
      console.log('Started stream capture from canvas element: ', stream);
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      console.error('Exception while creating MediaRecorder: ' + e);
      alert('Exception while creating MediaRecorder: '
        + e + '. mimeType: ' + options.mimeType);
      return;
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10); // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  if (format !== 'image/gif') {
    console.log('Recorded Blobs: ', recordedBlobs);
  }
  var recordSection = document.getElementById('page2');
  recordSection.classList.remove('hide');
  recordedVideo.controls = true;
}

function play() {
  var superBuffer = new Blob(recordedBlobs, {type: format});
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  // workaround for non-seekable video taken from
  // https://bugs.chromium.org/p/chromium/issues/detail?id=642012#c23
  recordedVideo.addEventListener('loadedmetadata', function() {
    if (recordedVideo.duration === Infinity) {
      recordedVideo.currentTime = 1e101;
      recordedVideo.ontimeupdate = function() {
        recordedVideo.currentTime = 0;
        recordedVideo.ontimeupdate = function() {
          delete recordedVideo.ontimeupdate;
          recordedVideo.play();
        };
      };
    }
  });
}

function download() {
  var blob = new Blob(recordedBlobs, {type: format});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  var name = 'test' + format.substr(format.indexOf('/'), format.length);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}
