import {loader, autoDetectRenderer} from 'pixi.js';
import {remove as _remove} from 'lodash/array';
import levels from '../data/levels.json';
import Stage from './Stage';
import sound from './Sound';
import levelCreator from '../libs/levelCreator.js';
import utils from '../libs/utils';
import 'regenerator-runtime/runtime';
import EasySeeSo from 'seeso/easy-seeso.js';
import {UserStatusOption} from 'seeso/dist/seeso';

let LICENSE_KEY = localStorage.getItem('licence');
const USER_ID = 'user id';
let decodedURI;

const MAX_X = 800;
const MAX_Y = 600;


const BLUE_SKY_COLOR = 0x64b0ff;
const PINK_SKY_COLOR = 0xfbb4d4;
const SUCCESS_RATIO = 0.6;
const BOTTOM_LINK_STYLE = {
  fontFamily: 'Arial',
  fontSize: '15px',
  align: 'left',
  fill: 'white'
};

class Game {
  /**
   * Game Constructor
   * @param opts
   * @param {String} opts.spritesheet Path to the spritesheet file that PIXI's loader should load
   * @returns {Game}
   */
  constructor(opts) {
    this.spritesheet = opts.spritesheet;
    this.loader = loader;
    this.renderer =  autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: BLUE_SKY_COLOR
    });
    this.levelIndex = 0;
    this.maxScore = 0;
    this.timePaused = 0;
    this.muted = false;
    this.paused = false;
    this.activeSounds = [];
    this.instructioned = false;
    this.license = false;

    this.waveEnding = false;
    this.quackingSoundId = null;
    this.levels = levels.normal;
    this.eyetracker = new EasySeeSo();
    return this;
  }

  get ducksMissed() {
    return this.ducksMissedVal ? this.ducksMissedVal : 0;
  }

  set ducksMissed(val) {
    this.ducksMissedVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'ducksMissed')) {
        this.stage.hud.createTextureBasedCounter('ducksMissed', {
          texture: 'hud/score-live/0.png',
          spritesheet: this.spritesheet,
          location: Stage.missedDuckStatusBoxLocation(),
          rowMax: 20,
          max: 20
        });
      }

      this.stage.hud.ducksMissed = val;
    }
  }

  get ducksShot() {
    return this.ducksShotVal ? this.ducksShotVal : 0;
  }

  set ducksShot(val) {
    this.ducksShotVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'ducksShot')) {
        this.stage.hud.createTextureBasedCounter('ducksShot', {
          texture: 'hud/score-dead/0.png',
          spritesheet: this.spritesheet,
          location: Stage.deadDuckStatusBoxLocation(),
          rowMax:20,
          max: 20
        });
      }

      this.stage.hud.ducksShot = val;
    }
  }
  /**
   * bullets - getter
   * @returns {Number}
   */
  get bullets() {
    return this.bulletVal ? this.bulletVal : 0;
  }

  /**
   * bullets - setter
   * Setter for the bullets property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying bullets, the property and a corresponding texture container
   * will be created in HUD.
   * @param {Number} val Number of bullets
   */
  set bullets(val) {
    this.bulletVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'bullets')) {
        this.stage.hud.createTextureBasedCounter('bullets', {
          texture: 'hud/bullet/0.png',
          spritesheet: this.spritesheet,
          location: Stage.bulletStatusBoxLocation(),
          max: 80,
          rowMax: 20
        });
      }

      this.stage.hud.bullets = val;
    }

  }

  /**
   * score - getter
   * @returns {Number}
   */
  get score() {
    return this.scoreVal ? this.scoreVal : 0;
  }

  /**
   * score - setter
   * Setter for the score property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the score, the property and a corresponding text box
   * will be created in HUD.
   * @param {Number} val Score value to set
   */
  set score(val) {
    this.scoreVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'score')) {
        this.stage.hud.createTextBox('score', {
          style: {
            fontFamily: 'Arial',
            fontSize: '18px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.scoreBoxLocation(),
          anchor: {
            x: 1,
            y: 0
          }
        });
      }

      this.stage.hud.score = val;
    }

  }

  /**
   * wave - get
   * @returns {Number}
   */
  get wave() {
    return this.waveVal ? this.waveVal : 0;
  }

  /**
   * wave - set
   * Setter for the wave property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the wave, the property and a corresponding text box
   * will be created in the HUD.
   * @param {Number} val
   */
  set wave(val) {
    this.waveVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'waveStatus')) {
        this.stage.hud.createTextBox('waveStatus', {
          style: {
            fontFamily: 'Arial',
            fontSize: '14px',
            align: 'center',
            fill: 'white'
          },
          location: Stage.waveStatusBoxLocation(),
          anchor: {
            x: 1,
            y: 1
          }
        });
      }

      if (!isNaN(val) && val > 0) {
        this.stage.hud.waveStatus = 'wave ' + val + ' of ' + this.level.waves;
      } else {
        this.stage.hud.waveStatus = '';
      }
    }
  }

  /**
   * gameStatus - get
   * @returns {String}
   */
  get gameStatus() {
    return this.gameStatusVal ? this.gameStatusVal : '';
  }

  /**
   * gameStatus - set
   * @param {String} val
   */
  set gameStatus(val) {
    this.gameStatusVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'gameStatus')) {
        this.stage.hud.createTextBox('gameStatus', {
          style: {
            fontFamily: 'Arial',
            fontSize: '40px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.gameStatusBoxLocation()
        });
      }

      this.stage.hud.gameStatus = val;
    }
  }

  load() {
    this.loader
      .add(this.spritesheet)
      .load(this.onLoad.bind(this));
  }

  onLoad() {
    document.body.appendChild(this.renderer.view);

    this.stage = new Stage({
      spritesheet: this.spritesheet
    });

    this.scaleToWindow();
    this.addPauseLink();
    this.addMuteLink();
    this.addFullscreenLink();
    this.addCalibrateLink();
    this.addInstructionsLink();
    this.bindEvents();
    this.startLevel();
    this.addLicenseKeyLink();
    this.animate();

  }

  addCalibrateLink() {
    this.stage.hud.createTextBox('calibrateLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.calibrateLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.calibrateLink = 'calibrate (e)';
  }

  addInstructionsLink() {
    this.stage.hud.createTextBox('instructionsLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.instructionsLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.instructionsLink = 'help (h)';
  }

  addFullscreenLink() {
    this.stage.hud.createTextBox('fullscreenLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.fullscreenLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.fullscreenLink = 'fullscreen (f)';
  }
  addMuteLink() {
    this.stage.hud.createTextBox('muteLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.muteLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.muteLink = 'mute (m)';
  }

  addPauseLink() {
    this.stage.hud.createTextBox('pauseLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.pauseLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.pauseLink = 'pause (p)';
  }

  addLicenseKeyLink() {
    this.stage.hud.createTextBox('licenseKeyLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.licenseKeyLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.licenseKeyLink = 'license key (Enter)';
  }

  afterTrackerInitialized() {
    console.log('SeeSo initialized');
    this.parseCalibrationData();
    if (this.isCalibrated) {
      this.eyetracker.startTracking(this.onGaze.bind(this), this.onGazeDebug.bind(this));
      this.eyetracker.setUserStatusCallback(false, this.onBlink.bind(this), false);
    }
  }

  onBlink(timestamp, isBlinkLeft, isBlinkRight, isBlink) {
    if (isBlink) {
      // Fire shots
      const clickPoint = {};
      clickPoint.x = ((this.stage.gazePositionX + (this.stage.crosshair.width / 2)) * window.innerWidth)/MAX_X;
      clickPoint.y = ((this.stage.gazePositionY + (this.stage.crosshair.height / 2)) * window.innerHeight)/MAX_Y;
      console.log("Gaze click point x & y: ", clickPoint.x, clickPoint.y); //for testing

  
      if (!this.stage.hud.replayButton && !this.outOfAmmo() && !this.shouldWaveEnd() && !this.paused) {
        sound.play('gunSound');
        this.bullets -= 1;
        this.updateScore(this.stage.shotsFired(clickPoint, this.level.radius));
        return;
      }
  
      if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
        window.location = window.location.href;
      }
    }
  }




  afterTrackerFailed() {
    console.log('SeeSo failed');
  }

  parseCalibrationData() {
    const href = window.location.href;
    decodedURI = decodeURI(href);
    const queryString = decodedURI.split('?')[1];
    if (!queryString) {
      this.isCalibrated = false;
    } else {
      const jsonString = queryString.slice('calibrationData='.length, queryString.length);
      this.eyetracker.setCalibrationData(jsonString);
      this.isCalibrated = true;
      this.stage.hud.calibrateLink = 'calibrated (e)';
      this.stage.hud.calibrateLinkTextBox.style.fill = 'green';
    }
  }

  onGaze(gazeInfo) {
    this.stage.setCrosshairPosition(gazeInfo);
    // console.log('Gaze Data', gazeInfo);
  }

  onGazeDebug(FPS, latency_min, latency_max, latency_avg) {
    // onsole.log('Gaze Debug', { FPS, latency_min, latency_max, latency_avg });
  }


  bindEvents() {
    window.addEventListener('resize', this.scaleToWindow.bind(this));

    this.stage.mousedown = this.stage.touchstart = this.handleClick.bind(this);

    const userStatusOption = new UserStatusOption(false, true, false);
    this.eyetracker.init(LICENSE_KEY, this.afterTrackerInitialized.bind(this), this.afterTrackerFailed.bind(this), userStatusOption);

    let x = 0, y = 0;
    document.addEventListener('mousemove', function(e){
      x = e.pageX;
      y = e.pageY;
    }, false);

    var divElement = document.createElement("div");
    

    // Styling it
    divElement.style.position = "absolute";
    divElement.style.top = "6%";
    divElement.style.left = "1%";
    divElement.style.opacity = "80%";
    divElement.style.textAlign = "left";
    divElement.style.width = "230px";
    divElement.style.fontSize = "14px";
    divElement.style.backgroundColor = "#e6ffe6";
    divElement.style.border = "1px solid #ccfff5";


    // Adding a paragraph to it
    let paragraph = document.createElement("P");
    paragraph.appendChild(document.createTextNode("How to shoot:"));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createTextNode("- Only mouse: left click"));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createTextNode("- 'Space' while using mouse as aiming"));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createTextNode("- Only eyes: blink (after calibration)"));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createTextNode("- 'q' while using eyetracker as aiming"));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createTextNode("If you don't have licence key, please visit seeso.io, then press 'Enter' to insert your licence key."));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createElement('br'));
    paragraph.appendChild(document.createTextNode("If you wanth to use level creator, press 'c'."));
    paragraph.appendChild(document.createElement('br'));
    divElement.appendChild(paragraph);

    // Adding a button, cause why not!
    let button = document.createElement("Button");
    let textForButton = document.createTextNode("Close");
    button.appendChild(textForButton);
    button.style.width = "230px";
    button.addEventListener("click", function(){
      divElement.style.visibility = "hidden";
    });
    divElement.appendChild(button);

    // Appending the div element to body
    document.getElementsByTagName("body")[0].appendChild(divElement);
    divElement.style.visibility = "hidden"; 


    document.addEventListener('keypress', (event) => {
      event.stopImmediatePropagation();

      if (event.key === 'p') {
        this.pause();
      }

      if (event.key === 'm') {
        this.mute();
      }

      if (event.key === 'c') {
        this.openLevelCreator();
      }

      if (event.key === 'Enter') {
        this.licenseKey();
      }

      if (event.key === 'f') {
        this.fullscreen();
      }
      
      if (event.key === 'e') {
        this.calibrate();
      }

      if (event.key === 'h') {
        if(divElement.style.visibility === "hidden") {
          divElement.style.visibility = "visible"
        } else divElement.style.visibility = "hidden";  
      }
    
      if (event.key === ' ') {
        const clickPoint = {
            x: x,
            y: y  
        };
        console.log('Mouse-keyboard x & y:', clickPoint);

        if (this.stage.clickedPauseLink(clickPoint)) {
          this.pause();
          return;
        }
    
        if (this.stage.clickedMuteLink(clickPoint)) {
          this.mute();
          return;
        }
    
        if (this.stage.clickedFullscreenLink(clickPoint)) {
          this.fullscreen();
          return;
        }
    
        if (this.stage.clickedCalibrateLink(clickPoint)) {
          this.calibrate();
          return;
        }
    
        if (this.stage.clickedInstructionsLink(clickPoint)) {
          this.showInstructions();
          return;
        }
    
        if (this.stage.clickedLicenseKeyLink(clickPoint)) {
          this.licenseKey();
          return;
        }
    
        if (!this.stage.hud.replayButton && !this.outOfAmmo() && !this.shouldWaveEnd() && !this.paused) {
          sound.play('gunSound');
          this.bullets -= 1;
          this.updateScore(this.stage.shotsFired(clickPoint, this.level.radius));
          return;
        }
    
        if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
          window.location = window.location.href;
        }
      }

      if (event.key === 'q') {
        const clickPoint = {};
        clickPoint.x = ((this.stage.gazePositionX + (this.stage.crosshair.width / 2)) * window.innerWidth)/MAX_X;
        clickPoint.y = ((this.stage.gazePositionY + (this.stage.crosshair.height / 2)) * window.innerHeight)/MAX_Y;
        console.log("Gaze-keyboard click point x & y: ", clickPoint.x, clickPoint.y); //for testing

        if (this.stage.clickedPauseLink(clickPoint)) {
          this.pause();
          return;
        }
    
        if (this.stage.clickedMuteLink(clickPoint)) {
          this.mute();
          return;
        }
    
        if (this.stage.clickedFullscreenLink(clickPoint)) {
          this.fullscreen();
          return;
        }
    
        if (this.stage.clickedCalibrateLink(clickPoint)) {
          this.calibrate();
          return;
        }
    
        if (this.stage.clickedInstructionsLink(clickPoint)) {
          this.showInstructions();
          return;
        }
    
        if (this.stage.clickedLicenseKeyLink(clickPoint)) {
          this.licenseKey();
          return;
        }
    
        if (!this.stage.hud.replayButton && !this.outOfAmmo() && !this.shouldWaveEnd() && !this.paused) {
          sound.play('gunSound');
          this.bullets -= 1;
          this.updateScore(this.stage.shotsFired(clickPoint, this.level.radius));
          return;
        }
    
        if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
          window.location = window.location.href;
        }
      }

    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.stage.hud.fullscreenLink = 'unfullscreen (f)';
      } else {
        this.stage.hud.fullscreenLink = 'fullscreen (f)';
      }
    });

    sound.on('play', (soundId) => {
      if (this.activeSounds.indexOf(soundId) === -1) {
        this.activeSounds.push(soundId);
      }
    });
    sound.on('stop', this.removeActiveSound.bind(this));
    sound.on('end', this.removeActiveSound.bind(this));
  }

  fullscreen() {
    this.isFullscreen = !this.isFullscreen;
    utils.toggleFullscreen();
  }

  calibrate() {
    EasySeeSo.openCalibrationPage(LICENSE_KEY, USER_ID, window.location.href, 5);
  }



  pause() {
    this.stage.hud.pauseLink = this.paused ? 'pause (p)' : 'unpause (p)';
    // SetTimeout, woof. Thing is here we need to leave enough animation frames for the HUD status to be updated
    // before pausing all rendering, otherwise the text update we need above won't be shown to the user.
    setTimeout(() => {
      this.paused = !this.paused;
      if (this.paused) {
        this.pauseStartTime = Date.now();
        this.stage.pause();
        this.activeSounds.forEach((soundId) => {
          sound.pause(soundId);
        });
      } else {
        this.timePaused += (Date.now() - this.pauseStartTime) / 1000;
        this.stage.resume();
        this.activeSounds.forEach((soundId) => {
          sound.play(soundId);
        });
      }
    }, 40);
  }

  removeActiveSound(soundId) {
    _remove(this.activeSounds, function(item) {
      return item === soundId;
    });
  }

  mute() {
    this.stage.hud.muteLink = this.muted ? 'mute (m)' : 'unmute (m)';
    this.muted = !this.muted;
    sound.mute(this.muted);
  }

  scaleToWindow() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.scaleToWindow();
  }

  startLevel() {
    if (levelCreator.urlContainsLevelData()) {
      this.level = levelCreator.parseLevelQueryString();
      this.levelIndex = this.levels.length - 1;
    } else {
      this.level = this.levels[this.levelIndex];
    }

    this.maxScore += this.level.waves * this.level.ducks * this.level.pointsPerDuck;
    this.ducksShot = 0;
    this.ducksMissed = 0;
    this.wave = 0;

    this.gameStatus = this.level.title;
    this.stage.preLevelAnimation().then(() => {
      this.gameStatus = '';
      this.startWave();
    });
  }

  startWave() {
    this.quackingSoundId = sound.play('quacking');
    this.wave += 1;
    this.waveStartTime = Date.now();
    this.bullets = this.level.bullets;
    this.ducksShotThisWave = 0;
    this.waveEnding = false;

    this.stage.addDucks(this.level.ducks, this.level.speed);
  }

  endWave() {
    this.waveEnding = true;
    this.bullets = 0;
    sound.stop(this.quackingSoundId);
    if (this.stage.ducksAlive()) {
      this.ducksMissed += this.level.ducks - this.ducksShotThisWave;
      this.renderer.backgroundColor = PINK_SKY_COLOR;
      this.stage.flyAway().then(this.goToNextWave.bind(this));
    } else {
      this.stage.cleanUpDucks();
      this.goToNextWave();
    }
  }

  goToNextWave() {
    this.renderer.backgroundColor = BLUE_SKY_COLOR;
    if (this.level.waves === this.wave) {
      this.endLevel();
    } else {
      this.startWave();
    }
  }

  shouldWaveEnd() {
    // evaluate pre-requisites for a wave to end
    if (this.wave === 0 || this.waveEnding || this.stage.dogActive()) {
      return false;
    }

    return this.isWaveTimeUp() || (this.outOfAmmo() && this.stage.ducksAlive()) || !this.stage.ducksActive();
  }

  isWaveTimeUp() {
    return this.level ? this.waveElapsedTime() >= this.level.time : false;
  }

  waveElapsedTime() {
    return ((Date.now() - this.waveStartTime) / 1000) - this.timePaused;
  }

  outOfAmmo() {
    return this.level && this.bullets === 0;
  }

  endLevel() {
    this.wave = 0;
    this.goToNextLevel();
  }

  goToNextLevel() {
    this.levelIndex++;
    if (!this.levelWon()) {
      this.loss();
    } else if (this.levelIndex < this.levels.length) {
      this.startLevel();
    } else {
      this.win();
    }
  }

  levelWon() {
    return this.ducksShot > SUCCESS_RATIO * this.level.ducks * this.level.waves;
  }

  win() {
    sound.play('champ');
    this.gameStatus = 'You Win!';
    this.showReplay(this.getScoreMessage());
  }

  loss() {
    sound.play('loserSound');
    this.gameStatus = 'You Lose!';
    this.showReplay(this.getScoreMessage());
  }

  getScoreMessage() {
    let scoreMessage;

    const percentage = (this.score / this.maxScore) * 100;

    if (percentage === 100) {
      scoreMessage = 'Flawless victory.';
    }

    if (percentage < 100) {
      scoreMessage = 'Close to perfection.';
    }

    if (percentage <= 95) {
      scoreMessage = 'Truly impressive score.';
    }

    if (percentage <= 85) {
      scoreMessage = 'Solid score.';
    }

    if (percentage <= 75) {
      scoreMessage = 'Participation award.';
    }

    if (percentage <= 63) {
      scoreMessage = 'Yikes.';
    }

    return scoreMessage;
  }

  showReplay(replayText) {
    this.stage.hud.createTextBox('replayButton', {
      location: Stage.replayButtonLocation()
    });
    this.stage.hud.replayButton = replayText + ' Play Again?';
  }

  openLevelCreator() {
    // If they didn't pause the game, pause it for them
    if (!this.paused) {
      this.pause();
    }
    window.open('/creator.html', '_blank');
  }

  licenseKey() {

    this.stage.hud.licenseKeyLink = this.license ? 'licence key (Enter)' : 'unpause (Enter)';
    this.license = !this.license;

    setTimeout(() => {

      if (this.license) {
        // this.license = !this.license;
        this.stage.pause();
        this.activeSounds.forEach((soundId) => {
          sound.pause(soundId);
        });
        var input = document.createElement("input");
        input.id = 'inputField';
        input.setAttribute("type", "text");
        document.body.appendChild(input).focus();
        input.style.position = 'absolute';
        input.style.top = '50%';
        input.style.left = 'calc(50% - 250px)';
        input.style.width = '500px';
        input.style.height = '50px';
        input.style.backgroundColor = 'red';

        // Text field
        var textForInput = document.createElement("p");
        textForInput.id = 'text';
        textForInput.appendChild(document.createTextNode("Insert your license key below and press 'Enter'"));
        document.body.appendChild(textForInput);
        textForInput.style.position = 'absolute';
        textForInput.style.top = '37%';
        textForInput.style.left = 'calc(50% - 200px)';
        textForInput.style.fontSize = '22px';


      } else {
        this.timePaused += (Date.now() - this.pauseStartTime) / 1000;
        this.stage.resume();
        this.activeSounds.forEach((soundId) => {
          sound.play(soundId);
        });
        LICENSE_KEY = document.getElementById("inputField").value;

        localStorage.setItem('licence', LICENSE_KEY);

        document.body.removeChild(inputField);
        document.body.removeChild(text);
      }
    }, 40);
  }

  handleClick(event) {
    const clickPoint = {
      x: event.data.global.x,
      y: event.data.global.y
    };

    console.log('Mouse x & y:', clickPoint);

    if (this.stage.clickedPauseLink(clickPoint)) {
      this.pause();
      return;
    }

    if (this.stage.clickedMuteLink(clickPoint)) {
      this.mute();
      return;
    }

    if (this.stage.clickedFullscreenLink(clickPoint)) {
      this.fullscreen();
      return;
    }

    if (this.stage.clickedCalibrateLink(clickPoint)) {
      this.calibrate();
      return;
    }

    if (this.stage.clickedInstructionsLink(clickPoint)) {
      this.showInstructions();
      return;
    }

    if (this.stage.clickedLicenseKeyLink(clickPoint)) {
      this.licenseKey();
      return;
    }

    if (!this.stage.hud.replayButton && !this.outOfAmmo() && !this.shouldWaveEnd() && !this.paused) {
      sound.play('gunSound');
      this.bullets -= 1;
      this.updateScore(this.stage.shotsFired(clickPoint, this.level.radius));
      return;
    }

    if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
      window.location = window.location.href;
    }
  }

  updateScore(ducksShot) {
    this.ducksShot += ducksShot;
    this.ducksShotThisWave += ducksShot;
    this.score += ducksShot * this.level.pointsPerDuck;
  }

  animate() {
    if (!this.paused) {
      this.renderer.render(this.stage);

      if (this.shouldWaveEnd()) {
        this.endWave();
      }
    }

    requestAnimationFrame(this.animate.bind(this));
  }
}

export default Game;
