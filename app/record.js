var recordButton;
document.addEventListener("DOMContentLoaded", function() {
  if (window.MediaSource) {
    var recordedVideo = document.querySelector('video#recorded');
    var mediaRecorder;
    var recordedBlobs;
    var sourceBuffer;
    recordButton = document.querySelector('button#record');
    var playButton = document.querySelector('button#play');
    var downloadButton = document.querySelector('button#download');
    recordButton.onclick = toggleRecording;
    playButton.onclick = play;
    downloadButton.onclick = download;

    var mediaSource = new MediaSource();
    mediaSource.addEventListener('sourceopen', handleSourceOpen, false);

    function handleSourceOpen(event) {
      console.log('MediaSource opened');
      sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
      console.log('Source buffer: ', sourceBuffer);
    }

    recordedVideo.addEventListener('error', function(ev) {
      console.error('MediaRecording.recordedMedia.error()');
      alert('Your browser can not play\n\n' + recordedVideo.src
        + '\n\n media clip. event: ' + JSON.stringify(ev));
    }, true);

    function handleDataAvailable(event) {
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    }

    function handleStop(event) {
      console.log('Recorder stopped: ', event);
    }

    function toggleRecording() {
      if (recordButton.textContent === 'Start Recording') {
        startRecording();
      } else {
        stopRecording();
        recordButton.textContent = 'Start Recording';
        playButton.disabled = false;
        downloadButton.disabled = false;
      }
    }

    function startRecording() {
      recordedBlobs = [];
      var options = {mimeType: 'video/webm;codecs=vp9'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: 'video/webm;codecs=vp8'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: 'video/webm'};
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: ''};
          }
        }
      }
      try {
        mediaRecorder = new MediaRecorder(window.stream, options);
      } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        alert('Exception while creating MediaRecorder: '
          + e + '. mimeType: ' + options.mimeType);
        return;
      }

      console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
      recordButton.textContent = 'Stop Recording';
      playButton.disabled = true;
      downloadButton.disabled = true;
      mediaRecorder.onstop = handleStop;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start(10); // collect 10ms of data
      console.log('MediaRecorder started', mediaRecorder);
    m}

    function stopRecording() {
      mediaRecorder.stop();
      console.log('Recorded Blobs: ', recordedBlobs);
      recordedVideo.classList.remove('hide');
      recordedVideo.controls = true;
    }

    function play() {
      var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
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
      var blob = new Blob(recordedBlobs, {type: 'video/webm'});
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'test.webm';
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  }
  else {
    console.log("The Media Source Extensions API is not supported.")
  }
});
