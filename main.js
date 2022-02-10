import Game from './src/modules/Game';

let redDot = document.createElement("div");
redDot.id = "redDot";

console.log(document.body);
redDot.style.width = '50px';
redDot.style.height = '50px';
redDot.style.backgroundColor = 'red';
redDot.style.position = 'absolute';
redDot.style.top = '50%';
redDot.style.left = '50%';


document.addEventListener('DOMContentLoaded', function() {

  document.body.appendChild(redDot);
  let game = new Game({
    spritesheet: 'sprites.json'
  }).load();

}, false);
