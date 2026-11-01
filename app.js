(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const canvas = $("board"), ctx = canvas.getContext("2d");
  const COLS = 24, ROWS = 18, CELL = 25;
  const STORE = "snake-deluxe-records-v1";
  const SPEEDS = { easy: 165, normal: 125, hard: 88 };
  const DIFFICULTIES = { easy: "Fácil", normal: "Normal", hard: "Difícil" };
  let player = "", difficulty = "normal", snake = [], food = null, obstacles = [];
  let direction = {x:1,y:0}, nextDirection = {x:1,y:0};
  let score = 0, best = 0, timer = null, paused = false, ended = true;
  let soundOn = true, audioCtx = null, installPrompt = null;

  function getRecords() {
    try { return JSON.parse(localStorage.getItem(STORE) || "[]"); }
    catch { return []; }
  }
  function saveRecords(records) { localStorage.setItem(STORE, JSON.stringify(records)); }
  function renderRanking() {
    const list = $("leaderboard"), records = getRecords().sort((a,b)=>b.score-a.score).slice(0,10);
    list.innerHTML = "";
    if (!records.length) {
      const li = document.createElement("li"); li.className = "empty";
      li.textContent = "Ainda não há recordes. Seja o primeiro!"; list.append(li); return;
    }
    records.forEach((r,i) => {
      const li = document.createElement("li");
      const name = document.createElement("span"); name.className = "player"; name.textContent = r.name;
      const points = document.createElement("span"); points.className = "points"; points.textContent = `${r.score} pts`;
      li.append(name,points); list.append(li);
    });
  }
  function saveScore() {
    const records = getRecords();
    const key = player.trim().toLocaleLowerCase("pt-BR");
    const existing = records.find(r => r.name.trim().toLocaleLowerCase("pt-BR") === key);
    if (existing) {
      if (score > existing.score) { existing.score = score; existing.date = new Date().toISOString(); }
    } else records.push({name:player,score,date:new Date().toISOString()});
    saveRecords(records); renderRanking();
  }
  function bestFor(name) {
    const r = getRecords().find(x => x.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
    return r ? r.score : 0;
  }
  function showScreen(which) {
    $("homeScreen").classList.toggle("hidden",which!=="home");
    $("gameScreen").classList.toggle("hidden",which!=="game");
  }
  function overlay(title,text,button,action) {
    $("overlayTitle").textContent=title; $("overlayText").textContent=text;
    $("overlayBtn").textContent=button; $("overlay").classList.remove("hidden");
    $("overlayBtn").onclick=action;
  }
  function hideOverlay(){ $("overlay").classList.add("hidden"); }
  function startGame() {
    const name=$("playerName").value.trim();
    if(!name){$("homeMessage").textContent="Digite seu nome para começar."; $("playerName").focus();return;}
    player=name.slice(0,20); difficulty=$("difficulty").value;
    score=0; best=bestFor(player); paused=false; ended=false;
    snake=[{x:10,y:9},{x:9,y:9},{x:8,y:9}];
    direction={x:1,y:0}; nextDirection={x:1,y:0}; obstacles=[];
    if(difficulty==="hard"){
      obstacles=[{x:5,y:4},{x:6,y:4},{x:17,y:13},{x:18,y:13},{x:17,y:4},{x:18,y:4},{x:5,y:13},{x:6,y:13}];
    } else if(difficulty==="normal") {
      obstacles=[{x:5,y:5},{x:18,y:12},{x:18,y:5},{x:5,y:12}];
    }
    $("currentPlayer").textContent=player; $("difficultyLabel").textContent=DIFFICULTIES[difficulty];
    updateStats(); newFood(); showScreen("game"); hideOverlay(); draw(); resume();
  }
  function updateStats(){ $("score").textContent=score; $("best").textContent=Math.max(best,score); }
  function newFood(){
    let p,tries=0;
    do { p={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)}; tries++; }
    while((snake.some(s=>s.x===p.x&&s.y===p.y)||obstacles.some(o=>o.x===p.x&&o.y===p.y))&&tries<1000);
    food=p;
  }
  function draw(){
    ctx.fillStyle="#0b1418";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle="#17272b";ctx.lineWidth=1;
    for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,canvas.height);ctx.stroke();}
    for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(canvas.width,y*CELL);ctx.stroke();}
    obstacles.forEach(o=>{ctx.fillStyle="#64747a";ctx.fillRect(o.x*CELL+3,o.y*CELL+3,CELL-6,CELL-6);});
    if(food){ctx.fillStyle="#ff626e";ctx.beginPath();ctx.arc(food.x*CELL+CELL/2,food.y*CELL+CELL/2,9,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ff9c82";ctx.fillRect(food.x*CELL+14,food.y*CELL+3,3,5);}
    snake.forEach((s,i)=>{ctx.fillStyle=i===0?"#75ffae":"#20bd70";roundRect(ctx,s.x*CELL+2,s.y*CELL+2,CELL-4,CELL-4,6);if(i===0){ctx.fillStyle="#092219";const dx=direction.x,dy=direction.y;let eyes;if(dx){eyes=[[s.x*CELL+15,s.y*CELL+8],[s.x*CELL+15,s.y*CELL+17]];}else{eyes=[[s.x*CELL+8,s.y*CELL+15],[s.x*CELL+17,s.y*CELL+15]];}eyes.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2,0,Math.PI*2);ctx.fill();});}});
  }
  function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function tick(){
    if(ended||paused)return;
    direction=nextDirection;
    const head=snake[0], next={x:head.x+direction.x,y:head.y+direction.y};
    const eating=food&&next.x===food.x&&next.y===food.y;
    const body=eating?snake:snake.slice(0,-1);
    if(next.x<0||next.x>=COLS||next.y<0||next.y>=ROWS||
       body.some(s=>s.x===next.x&&s.y===next.y)||
       obstacles.some(o=>o.x===next.x&&o.y===next.y)){gameOver();return;}
    snake.unshift(next);
    if(eating){score+=10;beep(620);newFood();updateStats();}
    else snake.pop();
    draw();
  }
  function interval(){return Math.max(48,SPEEDS[difficulty]-Math.floor(score/50)*7);}
  function resume(){clearInterval(timer);paused=false;$("pauseBtn").textContent="Ⅱ Pausar";timer=setInterval(tick,interval());}
  function pause(){if(ended)return;paused=!paused;if(paused){clearInterval(timer);$("pauseBtn").textContent="▶ Continuar";overlay("PAUSADO","Sua partida está pausada.","CONTINUAR",()=>{hideOverlay();resume();});}else{hideOverlay();resume();}}
  function gameOver(){
    clearInterval(timer);ended=true;saveScore();best=bestFor(player);updateStats();beep(180);
    overlay("FIM DE JOGO!",`${player}, você fez ${score} pontos. Seu recorde é ${best}.`,"JOGAR NOVAMENTE",startGame);
  }
  function setDirection(dir){
    const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const d=map[dir];if(!d||ended||paused)return;
    if(d.x===-direction.x&&d.y===-direction.y)return;
    nextDirection=d;
  }
  function beep(freq){
    if(!soundOn)return;
    try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.connect(g);g.connect(audioCtx.destination);g.gain.setValueAtTime(.045,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.09);o.start();o.stop(audioCtx.currentTime+.1);}catch{}
  }

  $("startBtn").addEventListener("click",startGame);
  $("playerName").addEventListener("keydown",e=>{if(e.key==="Enter")startGame();});
  $("pauseBtn").addEventListener("click",pause);
  $("restartBtn").addEventListener("click",()=>{clearInterval(timer);startGame();});
  $("homeBtn").addEventListener("click",()=>{clearInterval(timer);ended=true;showScreen("home");renderRanking();});
  $("clearScoresBtn").addEventListener("click",()=>{if(confirm("Tem certeza de que deseja apagar todos os recordes deste dispositivo?")){localStorage.removeItem(STORE);renderRanking();}});
  $("soundBtn").addEventListener("click",()=>{soundOn=!soundOn;$("soundBtn").textContent=`Som: ${soundOn?"ligado":"desligado"}`;});
  document.querySelectorAll("[data-dir]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();setDirection(b.dataset.dir);}));
  window.addEventListener("keydown",e=>{
    const keys={ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down",ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right"};
    if(keys[e.key]){e.preventDefault();setDirection(keys[e.key]);}
    if(e.code==="Space"&&!$("gameScreen").classList.contains("hidden")){e.preventDefault();pause();}
    if(e.key==="Escape"&&!$("gameScreen").classList.contains("hidden")){$("homeBtn").click();}
  });
  let touchStart=null;
  canvas.addEventListener("pointerdown",e=>{touchStart={x:e.clientX,y:e.clientY};});
  canvas.addEventListener("pointerup",e=>{
    if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))>18)setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up"));
    touchStart=null;
  });
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").classList.remove("hidden");});
  $("installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").classList.add("hidden");});
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
  renderRanking();
})();