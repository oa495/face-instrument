/* global clm, Tone, requestAnimFrame */
var ctrack, trackingStarted, bass, snare, kick, synth;
document.addEventListener("DOMContentLoaded", function() {
    var CUR_CHORD;

    var CHORD_MODE = false;
    var LEAD_MODE = true;
    var MINOR_MODE = false;

    /** Code for face tracking **/
    ctrack = new clm.tracker();
    ctrack.init();
    trackingStarted = false;
    var k = 5;
    var bucketSize = vidWidth / k;

    function normalizeFace(positions) {
      positions = positions.slice();

      var size = getSize(positions);

      for (var i = 0; i < positions.length; i++) {
        var p = [(positions[i][0] - size.minX) / size.deltaX,
                 (positions[i][1] - size.minY) / size.deltaY];

        positions[i] = p;

      }
      return positionsToFace(positions);
    }

    function positionsToFace(positions) {
        var face = { };

        face.upperMouth = positions.slice(59, 62) // slice is not inclusive
        face.lowerMouth = positions.slice(56, 59) // slice is not inclusive
        face.rightMouth = [positions[44]];
        face.leftMouth = [positions[50]];
        face.pupilLeft = [positions[27]];
        face.pupilRight = [positions[32]];

        face.eyebrowLeft = positions.slice(19, 23);
        face.eyebrowRight = positions.slice(15, 19);

        face.nose = positions.slice(34, 41);
        face.bridge = [positions[33], positions[41], positions[62]];
        face.upperLip = positions.slice(44, 51);
        face.lowerLip = positions.slice(50, 58);

        // the eye has the upper, the lower and the middle portions
        // Q: can each part can correspond to an instrument piece?
        face.eyeLeft = [];
        face.eyeRight = [];

        face.positions = positions;
        return face;
    }

    function setThreshold() {
      for (var part in face) {
        face[part].setThreshold();
      }
    }

    function SliderInstrument(part) {
      this.slider = true;
      this.deltaX = 0;
      this.deltaY = 0;

      this.setContainer = function(div) {
        this.$el = document.createElement("div");
        div.append(this.$el);
      };

      this.render = function() {
        this.$el.textContent = parseInt(this.deltaX*100) + ":" + parseInt(this.deltaY*100);
      };

      this.update = function(facePositions) {
        var bucketSize = vidWidth / k;
        let { centerX, centerY } = getCenterOfElement(vid);
        var avg = getAverage(facePositions[part]);
        this.deltaX = Math.floor(centerX - avg[0]);
        this.deltaY = Math.floor(centerY - avg[1]);


        var bucket = Math.floor(this.deltaX / bucketSize);
        if (bucket <= 0) {
          bucket = -bucket
        }

        OCTAVE = bucket || 2;
      };
    }

    var COLORS = {}

    function getRandomColor() {
      var colors = [
        [255, 106, 179],
        [255, 213, 92],
        [0, 251, 255],
        [241, 134, 12],
        [0, 197, 255],
        [255, 213, 92],
        [0, 142, 255],
        [142, 99, 255],
        [0, 244, 243],
        [211, 254, 61],
        [221, 255, 103]
      ];
      return colors[Math.floor(Math.random()*colors.length)];
    }

    function ToggleInstrument(p1, p2, minX, minY, options) {
      this.p1 = p1;
      this.p2 = p2;
      this.minX = minX;
      this.minY = minY;
      this.noteToPlay = options.note || 1
      this.duration = options.duration || '8n';
      // 1 = start of animation, 0 end/not animating
      this.animation = 0;
      var display_both = options.display_both;

      this.toggle = true

      this.debug = false;

      this.getNote = function() {
        var chord = teoria.chord(CUR_CHORD);
        var root = chord.notes()[0].name()
        var quality = chord.quality();
        if (quality.indexOf("dim") != -1) {
          quality = "minor";
        } else if (quality.indexOf("aug") != -1 || quality.indexOf("dom") != -1) {
          quality = "major";
        }


        var scale = teoria.scale(root, quality).scale;
        var interval = scale[this.noteToPlay % 7];
        var note = teoria.note(root);
        return note.interval(interval).name();
      };

      this.getColor = function() {
        if (!COLORS[this.noteToPlay]) {
          var colors = getRandomColor();
          COLORS[this.noteToPlay] = colors;
        } else {
          var colors = COLORS[this.noteToPlay];
        }
        var with_alpha = colors.concat([this.animation]);
        return "rgba(" + with_alpha.join(",") + ")";
      };

      this.activate = function() {
        if (this.active) {
          if (this.animation < 0.2) {
            this.animation = 1;
          }
          return;
        }

        this.active = true;
        this.animation = 1;
        // console.log("TRIGGERING TOGGLE FOR", this.p1, this.p2);

        if (faceIsStable) {
          var note = `${this.getNote()}${this.getOctave()}`
          if (LEAD_MODE) {
            console.log("TRIGGERING", note);
            synth.triggerAttackRelease(note, this.duration, Tone.now(), volume);
          }
        }
      }

      this.deactivate = function() {
        if (!this.active) {
          return;
        }
        // console.log("DEACTIVATING TOGGLE FOR", this.p1, this.p2);
        this.active = false;
        synth.triggerRelease([`${this.getNote()}${this.getOctave()}`]);
      }


      this.getOctave = function() {
        if (LEAD_MODE) {
          return 5;
        }

        return OCTAVE || 2;
      }

      this.setThreshold = function() {
        this.minX = this.deltaX || this.minX;
        this.minY = this.deltaY || this.minY;
      }

      this.checkDelta = function(face) {
        var pa1 = getAverage(face[this.p1]);
        var pa2 = getAverage(face[this.p2]);

        var deltaX = Math.abs(pa1[0] - pa2[0]);
        var deltaY = Math.abs(pa1[1] - pa2[1]);

        this.deltaX = deltaX;
        this.deltaY = deltaY;

        if (this.debug) {
          console.log("DELTA", p1, p2, deltaX, deltaY);
        }
        return (deltaY > this.minY && this.minY >= 0) || (deltaX > this.minX && this.minX >= 0);
      };

      this.setContainer = function(list) {
        this.$el = document.createElement("li");
        var button = document.createElement("button");
        var span = document.createElement("span");
        button.textContent = "Set ...";
        button.className = "hide";
        var self = this;
        button.addEventListener('click', function() {
          self.setThreshold();
        }, false);
        this.$el.append(span);
        this.$el.append(button);
        list.append(this.$el);
      };

      this.render = function() {
        var delta = this.$el.querySelector('span');
        var button = this.$el.querySelector('button');
        delta.textContent = this.p1 + ":" + this.p2 + " " +
          parseInt(this.deltaX*100) + "," + parseInt(this.deltaY*100);
        if (this.active) {
          this.$el.className = "active";
        } else {
          this.$el.className = "";
        }
      }

      this.update = function(face, normalizedFace) {
        if (this.animation > 0) {
          this.animation = this.animation / 1.05;
        }
        if (this.checkDelta(normalizedFace)) {
          this.activate();
        } else {
          this.deactivate();
        }
      }

      this.draw = function(face, canvas) {
        if (this.animation > .1) {
          var points = face[this.p2];
          if (display_both) {
            points = points.concat(face[this.p1]);
          }
          for (var p in points) {
            var x = points[p][0]
            var y = points[p][1]
            canvasContext = canvas.drawingContext;
            canvasContext.fillStyle = this.getColor();
            canvasContext.beginPath();
            canvasContext.arc(x, y, 20*this.animation, 0, Math.PI*2, true);
            canvasContext.closePath();
            canvasContext.fill();
          }
        }
      }
    }

    // CAN SWAP THESE TO SWITCH BETEWEN MONO AND POLY SYNTH
    const monosynth = new Tone.AMSynth().toMaster();
    const polysynth = new Tone.PolySynth(4, Tone.Synth).toMaster();
    const synth = new Tone.PolySynth(4, Tone.Synth).toMaster();
    window.SYNTH = synth;

    var OCTAVE = 3;
    var volume = 1;
    var face = {};

    // these numbers are relative to nose height. 1 = one nose height
    face.mouth = new ToggleInstrument('upperMouth', 'lowerMouth', -1, 0.65, { note: 1});
    face.smile = new ToggleInstrument('leftMouth', 'rightMouth', 1.40, -1, { note: 2, display_both: 1});
    face.pupilLeft = new ToggleInstrument('bridge', 'pupilLeft', 0.12, -1, { note: 3 });
    face.pupilRight = new ToggleInstrument('bridge', 'pupilRight', 0.12, -1, { note: 4 });
    face.eyebrowLeft = new ToggleInstrument('pupilLeft', 'eyebrowLeft', -1, 0.60, { note: 5});
    face.eyebrowRight = new ToggleInstrument('pupilRight', 'eyebrowRight', -1, 0.60, { note: 6});
    face.lip = new ToggleInstrument('lowerLip', 'upperLip', -1, 0.8, { note: 7});
    face.bridge = new SliderInstrument('bridge');


    var instruments = document.getElementById("instruments");
    var calibrate = document.getElementById('calibrate');
    calibrate.addEventListener('click', setThreshold, false);

    var progressionEl = document.getElementById("chord_progression");
    progressionEl.addEventListener("blur", function() {
      var chords = progressionEl.value.split(" ");
      if (chords && chords.length) {
        CHORDS = chords;
      } else {
        CHORDS = DEFAULT_CHORDS;
      }
      console.log("CHORD STR IS", chords);
    });

    var chordEl = document.getElementById('playing_chord');

    var modeEl = document.getElementById('music_mode');
    var modes = [ "LEAD", "CHORDS", "CHORDS (m)", "LEAD + CHORDS" ];
    var mode = 0;
    modeEl.addEventListener('click', function() {
      mode++;
      mode %= modes.length;
      modeEl.innerText = modes[mode];
      if (mode == 0) {
        LEAD_MODE = true;
        CHORD_MODE = false;
        MINOR_MODE = false;
      } else if (mode == 1) {
        LEAD_MODE = false;
        CHORD_MODE = true;

      } else if (mode == 2) {
        MINOR_MODE = true;

      } else if (mode == 3) {
        LEAD_MODE = true;
        CHORD_MODE = true;

      }




    });

    for (var f in face) { face[f].setContainer(instruments); }

    window.FACE = face;

    // detect face stability
    var prevSize;

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

    // returns the size of the face as a function of the nose bridge
    function getSize(positions) {

      var minX = positions[35][0];
      var maxX = positions[39][0];
      var minY = positions[33][1];
      var maxY = positions[62][1];

      return {
        minX : minX,
        maxX : maxX,
        minY : minY,
        maxY : maxY,
        deltaX: maxX - minX,
        deltaY: maxY - minY
      };
    }

    var POSITIONS;
    var STABLE_THRESHOLD = 20;

    var lastFew = [];

    var faceIsStable = false;
    setInterval(function() {
      if (!POSITIONS || !POSITIONS.length) {
        return;
      }

      faceIsStable = false;

      var curSize = getSize(POSITIONS);
      var curPos = getAverage(POSITIONS);

      lastFew.push([curSize.deltaX, curSize.deltaY]);
      var avg = getAverage(lastFew);

      while (lastFew.length > 15) {
        lastFew.shift();
      }

  //    console.log("AVG", avg[0], avg[1], curSize.deltaX, curSize.deltaY);

      if (Math.abs(curSize.deltaX - avg[0]) > STABLE_THRESHOLD) { return; }
      if (Math.abs(curSize.deltaY - avg[1]) > STABLE_THRESHOLD) { return; }

      faceIsStable = true;
    }, 100);

    setInterval(function() {
      if (!faceIsStable) {
        //console.log("FACE IS UNSTABLE");
      }
    }, 100);

    function drawMeters() {
      for (facePart in face) { face[facePart].render(); }
    }

    var chordMatrix = [
      [1,-8],
      [2,-7],
      [3,-6],
      [4,-5],
      [5,-4],
      [6,-3],
      [7,-2],
      [8,-1],
    ];

    function analyzeChord(face) {
      var mat = makeMatrix(face.length, 2);
      var facePart;
      var index = 0;

      var rowX = [];
      var rowY = [];
      for (var fp in face) {
        facePart = face[fp];
        if (facePart.toggle) {
          rowX.push(facePart.deltaX || 0);
          rowY.push(facePart.deltaY || 0);
        } else {
          rowX.push(0);
          rowY.push(0);
        }
        index++;
      }

      mat = [rowX, rowY];

      var ret = matrixMultiply(mat, chordMatrix);

      var chord1 = ret[0];
      var chord2 = ret[1];

      var bucket = 2;

      var chord1x = chord1[0];
      var chord1y = chord1[1];


      // the tonnetz is 4x3
      var tx = chord1x / bucket;
      var ty = chord1y / bucket;

      tx = (tx % 4 + 4) % 4;
      ty = (ty % 3 + 3) % 3;

      var rx = tx % 1.0;
      var ry = ty % 1.0;

      tx = Math.floor(tx);
      ty = Math.floor(ty);

      var chord = tonnetz[ty][tx];
      // TODO: flavor major or minor, but how?
      if (CHORD_MODE) {
        if (ry * (0.5) > rx && MINOR_MODE) {
          chord = chord + "m";
          console.log("MAKING MINOR COHRD", chord);
        }

        newChord(chord);
      }
    }


    // to simulate a tonnetz we will
    // use a 4x3 lattice, each square
    // is broken up into two triangles.
    // the upper left triangle and the bottom right
    var tonnetz = [
      [
        'Bb',
        'Db',
        'E',
        'G',
      ],
      [
        'F#',
        'A',
        'C',
        'Eb',
      ],
      [
        'D',
        'F',
        'Ab',
        'B',
      ],
    ];



    window.drawLoop = function() {
      requestAnimFrame(drawLoop);

      if (ctrack.getCurrentPosition()) {
        drawMeters();
        ctrack.draw(canvas);
        var positions = ctrack.getCurrentPosition();
        var faceWithPositions = positionsToFace(positions);
        var normalizedPositions = normalizeFace(positions);
        var faceHeight = positions[7][1] - positions[33][1];
        var distanceFromScreen = faceHeight / vidHeight;
        volume = distanceFromScreen.toFixed(2) * 4;

        POSITIONS = positions;

        for (facePart in face) {
          var ff = face[facePart];
          if (ff) {
            if (ff.draw) ff.draw(faceWithPositions, canvas);
            ff.update(faceWithPositions, normalizedPositions);
          }
        }

        analyzeChord(face);
      } else {
        POSITIONS = null;
      }
    }

  	window.makeLoops = function() {
        var vol = new Tone.Volume(-12);

  			//DRUMS//
  			//and a compressor
  			var drumCompress = new Tone.Compressor({
  				"threshold" : -30,
  				"ratio" : 6,
  				"attack" : 0.3,
  				"release" : 0.1
  			}).toMaster();
  			var distortion = new Tone.Distortion({
  				"distortion" : 0.4,
  				"wet" : 0.4
  			});
  			//hats
  			var hats = new Tone.Player({
  				"url" : "./audio/505/hh.[mp3|ogg]",
  				"volume" : -10,
  				"retrigger" : true,
  				"fadeOut" : 0.05
  			}).chain(distortion, drumCompress, vol);
  			var hatsLoop = new Tone.Loop({
  				"callback" : function(time){
  					hats.start(time).stop(time + 0.05);
  				},
  				"interval" : "16n",
  				"probability" : 0.8
  			}).start("1m");
  			//SNARE PART
  			snare = new Tone.Player({
  				"url" : "./audio/505/snare.[mp3|ogg]",
  				"retrigger" : true,
  				"fadeOut" : 0.1
  			}).chain(distortion, drumCompress, vol);
  			var snarePart = new Tone.Sequence(function(time, velocity){
  				snare.volume.value = Tone.gainToDb(velocity);
  				snare.start(time).stop(time + 0.1);
  			}, [null, 1, null, [1, 0.3]]).start(0);
  			kick = new Tone.MembraneSynth({
  				"pitchDecay" : 0.01,
  				"octaves" : 6,
  				"oscillator" : {
  					"type" : "square4"
  				},
  				"envelope" : {
  					"attack" : 0.001,
  					"decay" : 0.2,
  					"sustain" : 0
  				}
  			}).connect(drumCompress);
  			var kickPart = new Tone.Sequence(function(time, probability){
  				if (Math.random() < probability){
  					kick.triggerAttack("C1", time);
  				}
  			}, [1, [1, [null, 0.3]], 1, [1, [null, 0.5]], 1, 1, 1, [1, [null, 0.8]]], "2n").start(0);

  			// BASS
  			bass = new Tone.FMSynth({
  				"harmonicity" : 1,
  				"modulationIndex" : 3.5,
  				"carrier" : {
  					"oscillator" : {
  						"type" : "custom",
  						"partials" : [0, 1, 0, 2]
  					},
  					"envelope" : {
  						"attack" : 0.08,
  						"decay" : 0.3,
  						"sustain" : 0,
  					},
  				},
  				"modulator" : {
  					"oscillator" : {
  						"type" : "square"
  					},
  					"envelope" : {
  						"attack" : 0.05,
  						"decay" : 0.2,
  						"sustain" : 0.3,
  						"release" : 0.01
  					},
  				}
  			}).toMaster();

        // VOLUME for the bass part is lowered so we can hear
        // the main notes
//        bass.volume.value = -10;

        function makeSequence(chord, cb) {
          var notes = teoria.chord(chord).notes();
          var part = new Tone.Sequence(function(time, note){
            //console.log("TIME", time, event);
            cb && cb(note.name() + OCTAVE);
          }, notes, "8n");

          return part;
        }

        function playBass(note) {
          bass.triggerAttackRelease(note);
          for (var part in face) {
            if (face[part].active) {
              face[part].animation = 1;
            }
          }
        }

        function swapParts(oldPart, newPart) {
          oldPart.stop();
          newPart.start(0);
        }


        function newChord(chord) {
          if (chord == CUR_CHORD) {
            return;
          }
          console.log("SWITCHING TO CHORD", chord);

          chordEl.innerHTML = chord;

          var newPart = makeSequence(chord, playBass);
          swapParts(bassPart, newPart);
          bassPart = newPart;
          CUR_CHORD = chord;
        }

        var DEFAULT_CHORDS = [ "Em", "Gm", "A7", "Bdim", "D7" ];
        CHORDS = DEFAULT_CHORDS;

        var c = 0;
        setInterval(function() {
          if (!CHORD_MODE) {
            if (CHORDS[c]) {
              newChord(CHORDS[c]);
            }

            c = (c + 1) % (CHORDS.length)
          }
        }, 2000);


        Tone.Transport.start("+0.1");
        var bassPart = makeSequence("Am", playBass);
        bassPart.start(0);

        window.newChord = newChord;


  	}
});
