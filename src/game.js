// Fast top-down ARPG runtime. Sprite frame data lives in assets/manifest.json.
import {addItem,bonuses,createInventory,discardItem,equipItem,generateItem,loadInventory,saveInventory,unequipSlot} from './items.js?v=2';
export class Courtyard {
  constructor(canvas, manifest, images, onState) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.art=manifest;this.images=images;this.onState=onState;
    this.keys=new Set();this.time=0;this.last=0;this.running=true;this.attackQueued=false;this.attackHeld=false;
    this.world={w:1600,h:1088};this.camera={x:0,y:0};this.inventory=loadInventory();
    this.walls=[[6,6],[43,6],[8,27],[41,27],[13,22],[36,22],[12,10],[38,12]].map(([x,y])=>({x:x*32-22,y:y*32-12,w:44,h:28}));
    this.walls.push(...[[15,8],[34,25],[7,18]].map(([x,y])=>({x:x*32-48,y:y*32-25,w:96,h:50})));
    this.reset();
    this.keydown=e=>{const key=e.key.toLowerCase();if(['w','a','s','d'].includes(key)){e.preventDefault();this.keys.add(key);}};
    this.keyup=e=>this.keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);
    window.addEventListener('blur',()=>this.keys.clear());document.addEventListener('visibilitychange',()=>{this.keys.clear();this.last=0;});
    requestAnimationFrame(t=>this.loop(t));
  }
  reset(){
    if(!this.inventory)this.inventory=createInventory();this.gear=bonuses(this.inventory);const maxHp=100+this.gear.health;
    this.player={x:720,y:520,r:11,hp:maxHp,maxHp,face:'down',action:'idle',clock:0,cool:0,inv:0,aimX:720,aimY:620};this.camera={x:240,y:250};
    this.wave=1;this.level=1;this.xp=0;this.xpNext=10;this.gold=0;this.kills=0;this.combo=0;this.comboClock=0;this.state='playing';this.waveDelay=0;
    this.keys.clear();this.particles=[];this.projectiles=[];this.drops=[];this.texts=[];this.time=0;this.hitStop=0;this.shake=0;this.attackQueued=false;this.attackHeld=false;this.spawnWave();
  }
  spawnWave(){
    const rings=[[1010,510],[1035,390],[1015,700],[785,820],[520,805],[370,650],[360,430],[515,190],[745,165],[1070,210],[1250,510],[1180,820],[880,930],[430,930],[190,750],[180,330],[405,105],[920,95]],count=7+this.wave*3,offset=(this.wave-1)*3,spots=Array.from({length:rings.length},(_,i)=>rings[(i+offset)%rings.length]);
    this.enemies=Array.from({length:count},(_,i)=>{const boss=this.wave===3&&i===count-1,type=boss?'brute':i%5===3?'cultist':i%4===2?'ember':'slime',maxHp=boss?24:type==='cultist'?4:3+this.wave;return{x:spots[i][0],y:spots[i][1],r:boss?24:type==='slime'?13:15,hp:maxHp,maxHp,inv:0,clock:i*.17,shot:1+i*.11,type,speed:boss?31:type==='cultist'?25:42+this.wave*4};});
    this.waveTarget=count;this.waveKills=0;
  }
  setAim(x,y){this.player.aimX=x;this.player.aimY=y;const dx=x-this.player.x,dy=y-this.player.y;if(Math.hypot(dx,dy)>8)this.player.face=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}
  setAimScreen(x,y){this.setAim(x+this.camera.x,y+this.camera.y);}
  queueAttack(){if(this.state==='playing')this.attackQueued=true;}
  setAttackHeld(value){this.attackHeld=value;if(value)this.queueAttack();}
  recalculateStats(){const before=this.player.maxHp;this.gear=bonuses(this.inventory);this.player.maxHp=100+(this.level-1)*12+this.gear.health;this.player.hp=Math.min(this.player.maxHp,this.player.hp+Math.max(0,this.player.maxHp-before));}
  equip(itemId){if(!equipItem(this.inventory,itemId))return false;this.recalculateStats();saveInventory(this.inventory);return true;}
  unequip(slot){if(!unequipSlot(this.inventory,slot))return false;this.recalculateStats();saveInventory(this.inventory);return true;}
  discard(itemId){if(!discardItem(this.inventory,itemId))return false;saveInventory(this.inventory);return true;}
  blocked(x,y,r){if(x<48+r||y<48+r||x>this.world.w-48-r||y>this.world.h-48-r)return true;return this.walls.some(w=>Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))<r);}
  move(body,dx,dy){if(!this.blocked(body.x+dx,body.y,body.r))body.x+=dx;if(!this.blocked(body.x,body.y+dy,body.r))body.y+=dy;}
  burst(x,y,color,count=10,speed=70){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.45,size:i%3?3:5,color});}}
  floatText(x,y,text,color='#fff'){this.texts.push({x,y,text,color,life:.7});}
  gainReward(enemy){
    const boss=enemy.type==='brute';this.kills++;this.waveKills++;this.combo++;this.comboClock=2.2;this.gold+=boss?24:3+this.wave;this.xp+=boss?8:2;this.drops.push({x:enemy.x,y:enemy.y,life:3,type:boss?'ruby':this.kills%4===0?'potion':'coin'});
    if(boss||this.kills===1||Math.random()<.24+this.wave*.07){const item=generateItem({wave:this.wave,boss});this.drops.push({x:enemy.x+10,y:enemy.y-4,life:60,type:'item',item});}
    while(this.xp>=this.xpNext){this.xp-=this.xpNext;this.level++;this.xpNext+=4;this.recalculateStats();this.player.hp=Math.min(this.player.maxHp,this.player.hp+28);this.burst(this.player.x,this.player.y,'#e6cb69',22,105);}
  }
  update(dt){
    if(this.paused)return;if(this.hitStop>0){const freeze=Math.min(dt,this.hitStop);this.hitStop-=freeze;dt-=freeze;if(dt<=0)return;}this.time+=dt;const p=this.player;this.shake=Math.max(0,this.shake-dt*22);this.comboClock=Math.max(0,this.comboClock-dt);if(!this.comboClock)this.combo=0;this.particles=this.particles.filter(a=>(a.life-=dt)>0);for(const a of this.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vx*=.91;a.vy*=.91;}this.texts=this.texts.filter(a=>(a.life-=dt)>0);for(const a of this.texts)a.y-=26*dt;
    this.drops=this.drops.filter(a=>{a.life-=dt;const d=Math.hypot(a.x-p.x,a.y-p.y);if(d<60){a.x+=(p.x-a.x)*dt*7;a.y+=(p.y-a.y)*dt*7;}if(d<18){if(a.type==='item'){if(!addItem(this.inventory,a.item)){a.life=Math.max(a.life,3);return true;}saveInventory(this.inventory);this.floatText(a.x,a.y-18,a.item.name,a.item.rarity==='legendary'?'#e8793e':a.item.rarity==='rare'?'#e3c151':'#77b9ed');this.burst(a.x,a.y,'#e3c151',10,60);return false;}if(a.type==='potion')p.hp=Math.min(p.maxHp,p.hp+12);this.gold+=a.type==='coin'?1:0;this.burst(a.x,a.y,a.type==='potion'?'#d95b63':'#e6c15d',5,35);return false;}return a.life>0;});
    if(this.state!=='playing')return;if(this.waveDelay>0){this.waveDelay-=dt;if(this.waveDelay<=0){this.wave++;this.spawnWave();}return;}
    p.cool=Math.max(0,p.cool-dt);p.inv=Math.max(0,p.inv-dt);p.clock+=dt;const dx=Number(this.keys.has('d'))-Number(this.keys.has('a')),dy=Number(this.keys.has('s'))-Number(this.keys.has('w'));
    if(p.action==='attack'&&p.clock>.32){p.action='idle';p.clock=0;}
    if(p.action!=='attack'){
      const action=dx||dy?'walk':'idle';if(action!==p.action){p.action=action;p.clock=0;}if(dx||dy){const len=Math.hypot(dx,dy),speed=172*(1+this.gear.speed/100);this.move(p,dx/len*speed*dt,dy/len*speed*dt);}this.setAim(p.aimX,p.aimY);
      if((this.attackQueued||this.attackHeld)&&p.cool===0){
        p.action='attack';p.clock=0;p.cool=.38;this.attackQueued=false;let ax=p.aimX-p.x,ay=p.aimY-p.y,alen=Math.hypot(ax,ay);if(alen<2){ax=0;ay=1;alen=1;}ax/=alen;ay/=alen;let hit=false;
        for(const enemy of this.enemies){const ex=enemy.x-p.x,ey=enemy.y-p.y,d=Math.hypot(ex,ey),clear=Array.from({length:7},(_,i)=>!this.blocked(p.x+ex*(i+1)/8,p.y+ey*(i+1)/8,1)).every(Boolean);if(enemy.hp>0&&enemy.inv===0&&clear&&d<92&&(d<22||(ex*ax+ey*ay)/d>.42)){const crit=Math.random()*100<this.gear.crit,damage=(2+(this.level>=3?1:0)+this.gear.damage)*(crit?2:1);enemy.hp=Math.max(0,enemy.hp-damage);enemy.inv=.2;this.move(enemy,ax*20,ay*20);this.burst(enemy.x,enemy.y,crit?'#fff0a0':enemy.type==='ember'?'#ee8550':'#b3e47a',crit?22:14,crit?145:115);this.floatText(enemy.x,enemy.y-24,crit?`${damage}!`:damage,crit?'#fff0a0':'#ffe69a');hit=true;if(enemy.hp===0)this.gainReward(enemy);}}
        if(hit){this.hitStop=.035;this.shake=5;}
      }
    }
    for(const enemy of this.enemies){if(enemy.hp<=0)continue;enemy.clock+=dt;enemy.inv=Math.max(0,enemy.inv-dt);enemy.shot-=dt;const ex=p.x-enemy.x,ey=p.y-enemy.y,d=Math.hypot(ex,ey);if(enemy.type==='cultist'&&d<310){if(d<135)this.move(enemy,-ex/d*enemy.speed*dt,-ey/d*enemy.speed*dt);else if(d>220)this.move(enemy,ex/d*enemy.speed*dt,ey/d*enemy.speed*dt);if(enemy.shot<=0){const speed=120;this.projectiles.push({x:enemy.x,y:enemy.y-15,vx:ex/d*speed,vy:ey/d*speed,r:5,life:3});enemy.shot=1.55;}}else if(d>enemy.r+p.r&&enemy.inv===0)this.move(enemy,ex/d*enemy.speed*dt,ey/d*enemy.speed*dt);if(d<enemy.r+p.r+3&&p.inv===0)this.hurt(enemy.type==='brute'?18:9);}
    this.projectiles=this.projectiles.filter(b=>{b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(this.blocked(b.x,b.y,b.r))return false;if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r&&p.inv===0){this.hurt(7);return false;}return b.life>0;});
    this.camera.x=Math.max(0,Math.min(this.world.w-960,p.x-480));this.camera.y=Math.max(0,Math.min(this.world.h-540,p.y-270));if(this.waveKills===this.waveTarget){if(this.wave===3)this.state='won';else this.waveDelay=1.15;}
  }
  hurt(amount){const p=this.player,damage=Math.max(1,amount-this.gear.armor);p.hp=Math.max(0,p.hp-damage);p.inv=1;p.action='idle';this.combo=0;this.shake=9;this.hitStop=.045;this.floatText(p.x,p.y-34,damage,'#ff6a62');this.burst(p.x,p.y,'#dc5e58',18,105);if(p.hp<=0)this.state='lost';}
  sprite(kind,action,face,x,y,t,flash=false){
    const def=this.art[kind],image=this.images[kind];if(kind==='enemy')return this.drawEnemy(action,x,y,t,flash);if(!def||!image)return;
    const anim=def.animations[action+'_'+face]||def.animations[action]||def.animations[action+'_down']||def.animations['idle_'+face]||def.animations.idle;if(!anim)return;
    const frames=anim.frames||Array.from({length:anim.count},(_,i)=>({x:(i%anim.columns)*anim.step,y:Math.floor(i/anim.columns)*anim.step,w:anim.size,h:anim.size,anchorX:anim.anchorX,anchorY:anim.anchorY}));if(!frames.length)return;
    const frame=frames[action==='attack'?Math.min(frames.length-1,Math.floor(t/(anim.duration||.52)*frames.length)):Math.floor(t*(anim.fps||8))%frames.length],scale=def.scale||1,ax=frame.anchorX??frame.w/2,ay=frame.anchorY??frame.h,c=this.ctx;
    c.save();c.globalAlpha=flash?.42:1;c.drawImage(this.images[anim.image]||image,frame.x,frame.y,frame.w,frame.h,Math.round(x-ax*scale),Math.round(y-ay*scale),frame.w*scale,frame.h*scale);c.restore();
  }
  drawEnemy(type,x,y,t,flash){
    const c=this.ctx,b=Math.round(Math.sin(t*7)*2),big=type==='brute'?1.5:1,palette=type==='brute'?['#2c1721','#753a3f','#d16c55']:type==='ember'?['#29181d','#8e382e','#ef8648']:type==='cultist'?['#14162a','#41345f','#aa86ce']:['#102c25','#367f51','#9bda70'];
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(big,big);c.globalAlpha=flash?.42:1;c.fillStyle='#080b10';c.fillRect(-16,-5,32,12);c.fillStyle=palette[0];if(type==='cultist'){c.fillRect(-13,-29+b,26,29);c.fillRect(-17,-8,34,8);c.fillStyle=palette[1];c.fillRect(-9,-23+b,18,18);c.fillStyle='#dfc67d';c.fillRect(-4,-17+b,3,3);c.fillRect(3,-17+b,3,3);c.fillStyle=palette[2];c.fillRect(11,-27+b,4,23);}else{c.fillRect(-18,-19-b,36,20+b);c.fillRect(-13,-27-b,26,10);c.fillStyle=palette[1];c.fillRect(-15,-18-b,30,17+b);c.fillRect(-10,-25-b,20,9);c.fillStyle=palette[2];c.fillRect(-8,-23-b,15,4);c.fillStyle='#11151d';c.fillRect(-8,-13,4,5);c.fillRect(5,-13,4,5);if(type==='brute'){c.fillStyle='#d7b56d';c.fillRect(-17,-31-b,6,10);c.fillRect(11,-31-b,6,10);}}c.restore();
  }
  draw(){
    const c=this.ctx,map=this.images.map;c.save();const sx=this.shake?Math.round((Math.random()-.5)*this.shake):0,sy=this.shake?Math.round((Math.random()-.5)*this.shake):0;c.translate(sx-this.camera.x,sy-this.camera.y);c.imageSmoothingEnabled=false;if(map)c.drawImage(map,0,0,this.world.w,this.world.h);else{c.fillStyle='#17251f';c.fillRect(0,0,this.world.w,this.world.h);}
    const shade=c.createRadialGradient(this.player.x,this.player.y,150,this.player.x,this.player.y,620);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#02050a78');c.fillStyle=shade;c.fillRect(this.camera.x,this.camera.y,960,540);
    for(const drop of this.drops){const bob=drop.y-8-Math.sin(this.time*9)*3;c.globalAlpha=Math.min(1,drop.life*2);if(drop.type==='item'){const color=drop.item.rarity==='legendary'?'#e8793e':drop.item.rarity==='rare'?'#e3c151':drop.item.rarity==='magic'?'#5aa8e8':'#b8b7ae';c.fillStyle=color+'44';c.fillRect(drop.x-2,drop.y-48,4,42);c.fillStyle=color;c.fillRect(drop.x-6,bob-2,12,12);c.fillStyle='#f5eed9';c.fillRect(drop.x-2,bob+1,4,4);}else{c.fillStyle=drop.type==='ruby'?'#d8495c':drop.type==='potion'?'#b9273f':'#e7c45f';c.fillRect(drop.x-5,bob,10,10);c.fillStyle=drop.type==='potion'?'#ff8b8b':'#fff2aa';c.fillRect(drop.x-2,bob+1,3,3);}}c.globalAlpha=1;
    const actors=[...this.enemies.filter(e=>e.hp>0).map(e=>({...e,kind:'enemy',action:e.type})),{...this.player,kind:'player'}].sort((a,b)=>a.y-b.y);
    for(const a of actors){c.fillStyle='#070b1099';c.beginPath();c.ellipse(a.x,a.y,18*(a.r/14),7,0,0,Math.PI*2);c.fill();this.sprite(a.kind,a.action||'idle',a.face||'down',a.x,a.y,a.clock,a.inv>0&&Math.floor(this.time*18)%2===0);if(a.kind==='enemy'){c.fillStyle='#111820';c.fillRect(a.x-17,a.y+10,34,4);c.fillStyle=a.type==='brute'?'#d05e55':'#7ebf62';c.fillRect(a.x-17,a.y+10,34*a.hp/a.maxHp,4);}}
    for(const b of this.projectiles){c.fillStyle='#331e4c';c.fillRect(b.x-8,b.y-8,16,16);c.fillStyle='#bd82e4';c.fillRect(b.x-4,b.y-4,8,8);c.fillStyle='#f2d8ff';c.fillRect(b.x-2,b.y-2,4,4);}
    if(this.waveDelay>0){const x=this.camera.x+336,y=this.camera.y+232;c.fillStyle='#090d13dd';c.fillRect(x,y,288,68);c.strokeStyle='#9d7945';c.strokeRect(x+.5,y+.5,287,67);c.fillStyle='#dfc274';c.font='700 15px Georgia';c.textAlign='center';c.fillText(`WAVE ${this.wave+1} APPROACHES`,this.camera.x+480,this.camera.y+272);}
    const aimAngle=Math.atan2(this.player.aimY-this.player.y,this.player.aimX-this.player.x);if(this.player.action==='attack'&&this.player.clock<.3){c.strokeStyle='#f5d98c';c.lineWidth=4;c.beginPath();c.arc(this.player.x,this.player.y-6,47,aimAngle-.8,aimAngle+.8);c.stroke();}
    c.strokeStyle='#d9c47d99';c.lineWidth=1;c.beginPath();c.arc(this.player.aimX,this.player.aimY,9+Math.sin(this.time*6)*2,0,Math.PI*2);c.moveTo(this.player.aimX-14,this.player.aimY);c.lineTo(this.player.aimX+14,this.player.aimY);c.moveTo(this.player.aimX,this.player.aimY-14);c.lineTo(this.player.aimX,this.player.aimY+14);c.stroke();
    for(const a of this.particles){c.globalAlpha=a.life/.45;c.fillStyle=a.color;c.fillRect(a.x,a.y,a.size||3,a.size||3);}c.globalAlpha=1;for(const a of this.texts){c.globalAlpha=Math.min(1,a.life*3);c.fillStyle='#101015';c.font='900 16px monospace';c.textAlign='center';c.fillText(a.text,a.x+2,a.y+2);c.fillStyle=a.color;c.fillText(a.text,a.x,a.y);}c.globalAlpha=1;if(this.combo>=2){c.textAlign='right';c.fillStyle='#f0cf73';c.font='900 22px Georgia';c.fillText(`${this.combo} KILL`,this.camera.x+880,this.camera.y+110);c.font='700 9px monospace';c.fillStyle='#a78855';c.fillText('COMBO',this.camera.x+880,this.camera.y+125);}c.restore();this.onState({hp:this.player.hp,maxHp:this.player.maxHp,kills:this.waveKills,total:this.waveTarget,wave:this.wave,level:this.level,xp:this.xp,xpNext:this.xpNext,gold:this.gold,combo:this.combo,state:this.state,inventory:this.inventory,gear:this.gear});
  }
  loop(t){if(!this.running)return;const dt=this.last?Math.min((t-this.last)/1000,.04):0;this.last=t;this.update(dt);this.draw();requestAnimationFrame(n=>this.loop(n));}
}
