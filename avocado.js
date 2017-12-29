var canvas, stage;
var multipler = 0.2;
var speed = 1500;
var gravity = 700;
var pits = [];
var isDown = false;
var container;
var reaction = null;
var armMovement = 14;
var armMovement2 = 10;
var star = null;
var effect = "clapping";

function init() {
 
  
  canvas = document.getElementById("canvas");

  avocado = new lib.AvocadoMC();
  stage = new createjs.Stage(canvas);
  createjs.Touch.enable(stage);

  container = new createjs.Container();
  inner = new createjs.Container();

  container.addChild(avocado);
  container.width = window.innerWidth;
  container.height = window.innerHeight;
  container.regX = container.width >> 1;
  container.regY = container.height >> 1;

  avocado.x = container.regX;
  avocado.y = container.regY;

  ogX = avocado.body.x;
  ogY = avocado.body.y;
  legPosX = avocado.leftLeg.x;
  legPos2X =avocado.rightLeg.x;
  eyePosX = avocado.leftEye.x;
  eyePos2X = avocado.rightEye.x;
  sweatPosX = avocado.sweat.x;

  avocado.sweat.visible = false;

  instructions = new lib.Arrow();

  stage.addChild(container, instructions);
  //Registers the "tick" event listener.
  createjs.Ticker.setFPS(lib.properties.fps);
  createjs.Ticker.addEventListener("tick", tick);

  container.scaleX = container.scaleY = 0.70;
  instructions.x = avocado.x + 407* container.scaleX;
  instructions.y  = container.height>>1;
  
  handleResize();
   createBG();
  stage.update();
  
  var velX = stage.mouseX - avocado.x;
  var velY = stage.mouseY - avocado.y;
  angle = Math.atan2(velY, velX) * 180 / Math.PI;
  
  loadAssets();
  
}

function loadAssets() {
   manifest = [
    {src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/grunt.mp3", id: "grunt"},
    {src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/clapping.mp3", id: "clapping"},
    {src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/pop.mp3", id: "pop"},
    {src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/booing.mp3", id: "booing"}
  ]
  
  loader = new createjs.LoadQueue(true);
  loader.installPlugin(createjs.Sound);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(manifest);
}

function handleComplete() {
  //This function is always called, irrespective of the content. You can use the variable "stage" after it is created in token create_stage.
  
  stage.addEventListener("stagemousedown", handleDown);
  stage.addEventListener("stagemouseup", handleUp);
  stage.addEventListener("stagemousemove", handleMove);
  window.addEventListener("resize", handleResize);

}

function hideBG() {
  if (star == null) { return; }
  createjs.Tween.get(star).to({alpha:0, scaleX:0, scaleY:0}, 500);
}

function createBG() {
  var s = new createjs.Shape().set({x:400, y:400});
  s.graphics.rf( ["#F3F5D0", "#FFFFCC"], [0,1], 0,0,100,  0,0,800);

  star = starburst(s, 800, 20);
  star.x = canvas.width>>1;
  star.y = canvas.height>>1;

  stage.addChildAt(star, 0);
  star.alpha = 0;
  star.scaleX = star.scaleY = 0;

}

function showBG() {
  createjs.Tween.get(star).to({alpha:1, scaleX:1, scaleY:1}, 1000).call(function () {
    createjs.Tween.get(star, {loop:true}).to({rotation:360}, 25000);
  })
}

function starburst(s, radius, rays) {
  var seg = 360 / (rays*2) * Math.PI/180;
  var g = s.graphics;
  for (var i=0; i<rays; i++) {
    var a = i*2 * seg;
    g.mt(0,0)
      .lt(Math.cos(a)*radius, Math.sin(a)*radius)
      .lt(Math.cos(a+seg)*radius, Math.sin(a+seg)*radius)
      .lt(0,0);
  }
  return s;
}

function handleDown(event) {
  if (reaction != null) {
    reaction.stop();
  }
  hideBG();
  if (instructions.visible == true) {
    createjs.Tween.get(instructions).to({alpha:0}, 500).call(function () {
      instructions.visible = false;
    });
  }
  grunt = createjs.Sound.play("grunt", {loop:-1});
  isDown = true;
}

function handleUp(event) {
  grunt.stop();
  createjs.Sound.play("pop");
  effect = "clapping";
  if (multipler < 0.5) {
    effect = "booing";
  }else {
    showBG();
  }
  reaction = createjs.Sound.play(effect, {loop:0});

  avocado.pit.visible = false;
  shoot();
  isDown = false;
  multipler = 0.2;
  armMovement = 14;
  armMovement2 = 10;
}

function handleMove(event) {
  var velX = stage.mouseX - avocado.x;
  var velY = stage.mouseY - avocado.y;
  angle = Math.atan2(velY, velX) * 180 / Math.PI;
}

function updatePower() {
  if (isDown) {
    multipler =  Math.min(1, multipler+0.03);
    armMovement = Math.min(5, armMovement-0.01);
    armMovement2 = Math.min(5, armMovement2-0.01);
  }
  updateAvocado();
}

function shoot() {
  var pit = new lib.Pit();
  pit.scaleX = pit.scaleY = container.scaleX;
  pit.scaleX *= -1;
  pit.scaleY *= -1
  pit.x = avocado.x;
  pit.y = avocado.y;
  pit.vx = pit.vy = 0;
  pit.speed = speed*multipler;

  var rad = angle / 180 * Math.PI;

  pit.vx = Math.cos(rad);
  pit.vy = Math.sin(rad);

  pit.vx *= pit.speed;
  pit.vy *= pit.speed;

  pits.push(pit);

  stage.addChild(pit);
}

function tick(event) {
  avocado.scaleX = (stage.mouseX < canvas.width>>1) ? 1 : -1;
  updatePower();
  for(var i=0;i<pits.length;i++) {
    var b = pits[i];
    var bounds = {width:152.05, height:203.70,x: 0, y:-26};
    var floor = (canvas.height + bounds.height / 2) - 35;

    b.x += b.vx*(event.delta/1000);
    b.y += b.vy*(event.delta/1000);
    b.rotation = Math.atan2(b.vy, b.vx) * 180 / Math.PI;
    b.vy += gravity*(event.delta/1000);

    if (b.y >  floor || b.x > canvas.width) {
      removeBullet(i);
    }
  }
  stage.update(event);
}

function updateAvocado() {
  var distance = Math.random()*100;
  var distance1 = -Math.random()*100;
  if (isDown) {
    avocado.body.x = ogX + Math.random()*5;
    avocado.body.y = ogY + Math.random()*2;
    avocado.leftEye.gotoAndStop(1);
    avocado.rightEye.gotoAndStop(1);
    avocado.sweat.visible = true;
    avocado.mouth.gotoAndStop(1);
    avocado.leftLeg.x = legPosX + Math.random()*2;
    avocado.sweat.x = sweatPosX + Math.random()*5;
    avocado.rightLeg.x = legPos2X + Math.random()*2;
    avocado.leftEye.x = eyePos2X + Math.random()*2;
    avocado.rightEye.x = eyePosX + Math.random()*2;

    avocado.leftArm.rotation += (distance - avocado.leftArm.rotation) / armMovement;
    avocado.rightArm.rotation += (distance1 - avocado.rightArm.rotation) / armMovement2;
  }else {
    avocado.body.x = ogX;
    avocado.body.y = ogY;
    avocado.sweat.visible = false;
    avocado.sweat.x = sweatPosX;
    avocado.leftEye.gotoAndStop(0);
    avocado.rightEye.gotoAndStop(0);
    avocado.mouth.gotoAndStop(effect=="booing" ? 2 : 0);
    avocado.leftLeg.x = legPosX;
    avocado.rightLeg.x = legPos2X;

    avocado.leftEye.x = eyePos2X;
    avocado.rightEye.x = eyePosX;

    avocado.leftArm.rotation += (0 - avocado.leftArm.rotation) / 5;
    avocado.rightArm.rotation += (0 - avocado.rightArm.rotation) / 5;
  }
}

function removeBullet(index) {
  avocado.pit.visible = true;
  stage.removeChild(pits[index]);
  pits.splice(index, 1);
}

function handleResize(event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  container.width = window.innerWidth;
  container.height = window.innerHeight;

  container.regX = container.width >> 1;
  container.regY = container.height >> 1;

  container.x = canvas.width>>1;
  container.y = canvas.height>>1;

  avocado.x = container.regX;
  avocado.y = container.regY;

  if (star != null) {
    star.x = avocado.x;
    star.y = avocado.y;
  }


  instructions.x = avocado.x + 407* container.scaleX;
  instructions.y  = container.height>>1;

  stage.update();
}

init();