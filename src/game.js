// Fast top-down ARPG runtime. Sprite frame data lives in assets/manifest.json.
export class Courtyard {
  constructor(canvas, manifest, images, onState) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.art=manifest;this.images=images;this.onState=onState;
    this.keys=new Set();this.time=0;this.last=0;this.running=true;this.attackQueued=false;
    this.walls=[{x:230,y:150,w:145,h:80},{x:500,y:112,w:60,h:115},{x:590,y:315,w:175,h:75}];
    this.reset();
    this.keydown=e=>{const key=e.key.toLowerCase();if(['w','a','s','d'].includes(key)){e.preventDefault();this.keys.add(key);}};
    this.keyup=e=>this.keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);
    window.addEventListener('blur',()=>this.keys.clear());document.addEventListener('visibilitychange',()=>{this.keys.clear();this.last=0;});
    requestAnimationFrame(t=>this.loop(t));
  }
  reset(){
    this.player={x:150,y:286,r:13,hp:100,maxHp:100,face:'down',action:'idle',clock:0,cool:0,inv:0,aimX:150,aimY:390};
    this.wave=1;this.level=1;this.xp=0;this.xpNext=6;this.gold=0;this.kills=0;this.state='playing';this.waveDelay=0;
    this.keys.clear();this.particles=[];this.drops=[];this.time=0;this.attackQueued=false;this.spawnWave();
  }
  spawnWave(){
    const spots=[[430,250],[555,235],[735,250],[435,410],[590,430],[770,410],[835,310],[690,145],[390,370],[820,170]],count=4+this.wave*2;
    this.enemies=Array.from({length:count},(_,i)=>{const boss=this.wave===3&&i===count-1,maxHp=boss?12:2+Math.floor(this.wave/2);return{x:spots[i][0],y:spots[i][1],r:boss?22:14,hp:maxHp,maxHp,inv:0,clock:i*.17,type:boss?'brute':i%3===2?'ember':'slime',speed:boss?25:32+this.wave*3};});
    this.waveTarget=count;this.waveKills=0;
  }
  setAim(x,y){this.player.aimX=x;this.player.aimY=y;const dx=x-this.player.x,dy=y-this.player.y;if(Math.hypot(dx,dy)>8)this.player.face=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}
  queueAttack(){if(this.state==='playing')this.attackQueued=true;}
  blocked(x,y,r){if(x<64+r||y<74+r||x>896-r||y>486-r)return true;return this.walls.some(w=>Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))<r);}
  move(body,dx,dy){if(!this.blocked(body.x+dx,body.y,body.r))body.x+=dx;if(!this.blocked(body.x,body.y+dy,body.r))body.y+=dy;}
  burst(x,y,color,count=10,speed=70){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.45,color});}}
  gainReward(enemy){
    this.kills++;this.waveKills++;this.gold+=enemy.type==='brute'?24:3+this.wave;this.xp+=enemy.type==='brute'?8:2;this.drops.push({x:enemy.x,y:enemy.y,life:1.5,type:enemy.type==='brute'?'ruby':'coin'});
    while(this.xp>=this.xpNext){this.xp-=this.xpNext;this.level++;this.xpNext+=4;this.player.maxHp+=12;this.player.hp=Math.min(this.player.maxHp,this.player.hp+28);this.burst(this.player.x,this.player.y,'#e6cb69',22,105);}
  }
  update(dt){
    if(this.paused)return;this.time+=dt;const p=this.player;this.particles=this.particles.filter(a=>(a.life-=dt)>0);for(const a of this.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;}this.drops=this.drops.filter(a=>(a.life-=dt)>0);
    if(this.state!=='playing')return;if(this.waveDelay>0){this.waveDelay-=dt;if(this.waveDelay<=0){this.wave++;this.spawnWave();}return;}
    p.cool=Math.max(0,p.cool-dt);p.inv=Math.max(0,p.inv-dt);p.clock+=dt;const dx=Number(this.keys.has('d'))-Number(this.keys.has('a')),dy=Number(this.keys.has('s'))-Number(this.keys.has('w'));
    if(p.action==='attack'&&p.clock>.52){p.action='idle';p.clock=0;}
    if(p.action!=='attack'){
      const action=dx||dy?'walk':'idle';if(action!==p.action){p.action=action;p.clock=0;}if(dx||dy){const len=Math.hypot(dx,dy);this.move(p,dx/len*172*dt,dy/len*172*dt);}this.setAim(p.aimX,p.aimY);
      if(this.attackQueued&&p.cool===0){
        p.action='attack';p.clock=0;p.cool=.58;this.attackQueued=false;let ax=p.aimX-p.x,ay=p.aimY-p.y,alen=Math.hypot(ax,ay);if(alen<2){ax=0;ay=1;alen=1;}ax/=alen;ay/=alen;
        for(const enemy of this.enemies){const ex=enemy.x-p.x,ey=enemy.y-p.y,d=Math.hypot(ex,ey),clear=Array.from({length:7},(_,i)=>!this.blocked(p.x+ex*(i+1)/8,p.y+ey*(i+1)/8,1)).every(Boolean);if(enemy.hp>0&&clear&&d<96&&(d<25||(ex*ax+ey*ay)/d>.3)){enemy.hp=Math.max(0,enemy.hp-2);enemy.inv=.22;this.move(enemy,ax*20,ay*20);this.burst(enemy.x,enemy.y,enemy.type==='ember'?'#e68855':'#9bd46f');if(enemy.hp===0)this.gainReward(enemy);}}
      }
    }
    for(const enemy of this.enemies){if(enemy.hp<=0)continue;enemy.clock+=dt;enemy.inv=Math.max(0,enemy.inv-dt);const ex=p.x-enemy.x,ey=p.y-enemy.y,d=Math.hypot(ex,ey);if(d>enemy.r+p.r&&enemy.inv===0)this.move(enemy,ex/d*enemy.speed*dt,ey/d*enemy.speed*dt);if(d<enemy.r+p.r+3&&p.inv===0){p.hp=Math.max(0,p.hp-(enemy.type==='brute'?18:9));p.inv=1.1;this.burst(p.x,p.y,'#dc5e58',14,90);if(p.hp<=0)this.state='lost';}}
    if(this.waveKills===this.waveTarget){if(this.wave===3)this.state='won';else this.waveDelay=1.15;}
  }
  sprite(kind,action,face,x,y,t,flash=false){
    const def=this.art[kind],image=this.images[kind];if(kind==='enemy')return this.drawEnemy(action,x,y,t,flash);if(!def||!image)return;
    const anim=def.animations[action+'_'+face]||def.animations[action]||def.animations[action+'_down']||def.animations['idle_'+face]||def.animations.idle;if(!anim)return;
    const frames=anim.frames||Array.from({length:anim.count},(_,i)=>({x:(i%anim.columns)*anim.step,y:Math.floor(i/anim.columns)*anim.step,w:anim.size,h:anim.size,anchorX:anim.anchorX,anchorY:anim.anchorY}));if(!frames.length)return;
    const frame=frames[action==='attack'?Math.min(frames.length-1,Math.floor(t/(anim.duration||.52)*frames.length)):Math.floor(t*(anim.fps||8))%frames.length],scale=def.scale||1,ax=frame.anchorX??frame.w/2,ay=frame.anchorY??frame.h,c=this.ctx;
    c.save();c.globalAlpha=flash?.42:1;c.drawImage(this.images[anim.image]||image,frame.x,frame.y,frame.w,frame.h,Math.round(x-ax*scale),Math.round(y-ay*scale),frame.w*scale,frame.h*scale);c.restore();
  }
  drawEnemy(type,x,y,t,flash){
    const c=this.ctx,b=Math.sin(t*6)*2,big=type==='brute'?1.45:1,palette=type==='brute'?['#361d2a','#823c43','#d47c62']:type==='ember'?['#351d23','#a54c3d','#e39455']:['#17302c','#559a5e','#9bd47a'];
    c.save();c.translate(x,y);c.scale(big,big);c.globalAlpha=flash?.45:1;c.fillStyle=palette[0];c.fillRect(-17,-18-b,34,19+b);c.fillRect(-12,-25-b,24,8);c.fillStyle=palette[1];c.fillRect(-14,-18-b,28,16+b);c.fillRect(-10,-23-b,20,9);c.fillStyle=palette[2];c.fillRect(-8,-21-b,15,4);c.fillStyle='#141820';c.fillRect(-8,-12,4,5);c.fillRect(5,-12,4,5);if(type==='brute'){c.fillStyle='#d7b56d';c.fillRect(-16,-28-b,5,9);c.fillRect(11,-28-b,5,9);}c.restore();
  }
  draw(){
    const c=this.ctx,map=this.images.map;c.imageSmoothingEnabled=false;if(map)c.drawImage(map,0,0,960,540);else{c.fillStyle='#0d1119';c.fillRect(0,0,960,540);}
    const shade=c.createRadialGradient(480,280,170,480,280,620);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#02050a70');c.fillStyle=shade;c.fillRect(0,0,960,540);
    for(const drop of this.drops){c.globalAlpha=Math.min(1,drop.life*2);c.fillStyle=drop.type==='ruby'?'#d8495c':'#e7c45f';c.fillRect(drop.x-4,drop.y-8-Math.sin(this.time*9)*3,8,8);c.fillStyle='#fff2aa';c.fillRect(drop.x-2,drop.y-7-Math.sin(this.time*9)*3,2,2);}c.globalAlpha=1;
    const actors=[...this.enemies.filter(e=>e.hp>0).map(e=>({...e,kind:'enemy',action:e.type})),{...this.player,kind:'player'}].sort((a,b)=>a.y-b.y);
    for(const a of actors){c.fillStyle='#070b1099';c.beginPath();c.ellipse(a.x,a.y,18*(a.r/14),7,0,0,Math.PI*2);c.fill();this.sprite(a.kind,a.action||'idle',a.face||'down',a.x,a.y,a.clock,a.inv>0&&Math.floor(this.time*18)%2===0);if(a.kind==='enemy'){c.fillStyle='#111820';c.fillRect(a.x-17,a.y+10,34,4);c.fillStyle=a.type==='brute'?'#d05e55':'#7ebf62';c.fillRect(a.x-17,a.y+10,34*a.hp/a.maxHp,4);}}
    if(this.waveDelay>0){c.fillStyle='#090d13bb';c.fillRect(344,235,272,62);c.fillStyle='#dfc274';c.font='700 13px system-ui';c.textAlign='center';c.fillText(`WAVE ${this.wave+1} APPROACHES`,480,272);}
    const aimAngle=Math.atan2(this.player.aimY-this.player.y,this.player.aimX-this.player.x);if(this.player.action==='attack'&&this.player.clock<.3){c.strokeStyle='#f5d98c';c.lineWidth=5;c.beginPath();c.arc(this.player.x,this.player.y-9,58,aimAngle-.8,aimAngle+.8);c.stroke();}
    c.strokeStyle='#d9c47d99';c.lineWidth=1;c.beginPath();c.arc(this.player.aimX,this.player.aimY,9+Math.sin(this.time*6)*2,0,Math.PI*2);c.moveTo(this.player.aimX-14,this.player.aimY);c.lineTo(this.player.aimX+14,this.player.aimY);c.moveTo(this.player.aimX,this.player.aimY-14);c.lineTo(this.player.aimX,this.player.aimY+14);c.stroke();
    for(const a of this.particles){c.globalAlpha=a.life/.45;c.fillStyle=a.color;c.fillRect(a.x,a.y,3,3);}c.globalAlpha=1;this.onState({hp:this.player.hp,maxHp:this.player.maxHp,kills:this.waveKills,total:this.waveTarget,wave:this.wave,level:this.level,xp:this.xp,xpNext:this.xpNext,gold:this.gold,state:this.state});
  }
  loop(t){if(!this.running)return;const dt=this.last?Math.min((t-this.last)/1000,.04):0;this.last=t;this.update(dt);this.draw();requestAnimationFrame(n=>this.loop(n));}
}
