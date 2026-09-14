// Browser game runtime. Asset paths and frame rectangles come from assets/manifest.json.
export class Courtyard {
  constructor(canvas, manifest, images, onState) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.art=manifest; this.images=images; this.onState=onState;
    this.keys=new Set(); this.time=0; this.last=0; this.running=true; this.attackHeld=false;
    this.walls=[{x:220,y:150,w:90,h:44},{x:550,y:320,w:100,h:44},{x:410,y:110,w:44,h:90}];
    this.reset();
    this.keydown=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault(); this.keys.add(e.key.toLowerCase());};
    this.keyup=e=>this.keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown',this.keydown); window.addEventListener('keyup',this.keyup);
    window.addEventListener('blur',()=>this.keys.clear());
    document.addEventListener('visibilitychange',()=>{this.keys.clear();this.last=0;});
    requestAnimationFrame(t=>this.loop(t));
  }
  reset() {
    this.player={x:110,y:270,r:13,hp:5,face:'down',action:'idle',clock:0,cool:0,inv:0};
    this.enemies=Array.from({length:5},(_,i)=>({x:400+i%3*125,y:240+Math.floor(i/3)*160,r:14,hp:3,inv:0,clock:0}));
    this.kills=0; this.state='playing'; this.particles=[]; this.time=0; this.attackHeld=false;
  }
  blocked(x,y,r) {
    if(x<40+r||y<65+r||x>920-r||y>500-r)return true;
    return this.walls.some(w=>Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))<r);
  }
  move(body,dx,dy) {
    if(!this.blocked(body.x+dx,body.y,body.r))body.x+=dx;
    if(!this.blocked(body.x,body.y+dy,body.r))body.y+=dy;
  }
  burst(x,y,color) {for(let i=0;i<10;i++){let a=Math.random()*Math.PI*2;this.particles.push({x,y,vx:Math.cos(a)*65,vy:Math.sin(a)*65,life:.4,color});}}
  update(dt) {
    this.time+=dt; const p=this.player;
    this.particles=this.particles.filter(a=>(a.life-=dt)>0);
    for(const a of this.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;}
    if(this.state!=='playing')return;
    p.cool=Math.max(0,p.cool-dt);p.inv=Math.max(0,p.inv-dt);p.clock+=dt;
    let dx=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
    let dy=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
    if(p.action==='attack'&&p.clock>.36){p.action='idle';p.clock=0;}
    if(p.action!=='attack') {
      const action=dx||dy?'walk':'idle';if(action!==p.action){p.action=action;p.clock=0;}
      if(dx||dy){const l=Math.hypot(dx,dy);this.move(p,dx/l*150*dt,dy/l*150*dt);p.face=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}
      const attack=this.keys.has(' ')||this.keys.has('j');
      if(attack&&!this.attackHeld&&p.cool===0) {
        p.action='attack';p.clock=0;p.cool=.43;
        const dir={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]}[p.face];
        for(const e of this.enemies) {
          const x=e.x-p.x,y=e.y-p.y,d=Math.hypot(x,y);
          if(e.hp>0&&d<76&&(d<22||(x*dir[0]+y*dir[1])/d>0.25)){
            e.hp--;e.inv=.25;this.move(e,dir[0]*17,dir[1]*17);this.burst(e.x,e.y,'#98d77a');if(e.hp===0)this.kills++;
          }
        }
      }
      this.attackHeld=attack;
    }
    for(const e of this.enemies){
      if(e.hp<=0)continue;e.clock+=dt;e.inv=Math.max(0,e.inv-dt);
      const x=p.x-e.x,y=p.y-e.y,d=Math.hypot(x,y);
      if(d>25&&e.inv===0)this.move(e,x/d*43*dt,y/d*43*dt);
      if(d<29&&p.inv===0){p.hp--;p.inv=1.1;this.burst(p.x,p.y,'#db7265');if(p.hp<=0)this.state='lost';}
    }
    if(this.kills===this.enemies.length)this.state='won';
  }
  sprite(kind,action,face,x,y,t,flash=false) {
    const def=this.art[kind], image=this.images[kind];
    if(!def||!image)return;
    const anim=def.animations[action+'_'+face]||def.animations[action]||def.animations.idle;
    if(!anim||!anim.frames.length)return;
    const frame=anim.frames[Math.floor(t*(anim.fps||8))%anim.frames.length];
    const scale=def.scale||1;
    const ax=frame.anchorX??frame.w/2,ay=frame.anchorY??frame.h;
    const c=this.ctx;c.save();c.globalAlpha=flash?.45:1;
    c.drawImage(image,frame.x,frame.y,frame.w,frame.h,Math.round(x-ax*scale),Math.round(y-ay*scale),frame.w*scale,frame.h*scale);c.restore();
  }
  draw() {
    const c=this.ctx;c.imageSmoothingEnabled=false;c.fillStyle='#111722';c.fillRect(0,0,960,540);
    for(let y=64;y<512;y+=32)for(let x=32;x<928;x+=32){
      c.fillStyle=((x/32+y/32)%2)?'#303c47':'#34414b';c.fillRect(x,y,31,31);
      c.fillStyle='#3e4b54';c.fillRect(x+1,y+1,29,2);
    }
    for(const w of this.walls){c.fillStyle='#151e28';c.fillRect(w.x+7,w.y+8,w.w,w.h);c.fillStyle='#596575';c.fillRect(w.x,w.y,w.w,w.h);c.fillStyle='#87909a';c.fillRect(w.x,w.y,w.w,5);}
    const actors=[...this.enemies.filter(e=>e.hp>0).map(e=>({...e,kind:'enemy'})),{...this.player,kind:'player'}].sort((a,b)=>a.y-b.y);
    for(const a of actors){
      c.fillStyle='#10172280';c.beginPath();c.ellipse(a.x,a.y,18,7,0,0,Math.PI*2);c.fill();
      this.sprite(a.kind,a.action||'idle',a.face||'down',a.x,a.y,a.clock,a.inv>0&&Math.floor(this.time*16)%2===0);
      if(a.kind==='enemy'){c.fillStyle='#17251e';c.fillRect(a.x-14,a.y+8,28,3);c.fillStyle='#83bf6b';c.fillRect(a.x-14,a.y+8,28*a.hp/3,3);}
    }
    const p=this.player;
    if(p.action==='attack'&&p.clock<.25){
      const angle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[p.face];
      c.strokeStyle='#f3dd9c';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y-10,48,angle-.85,angle+.85);c.stroke();
    }
    for(const a of this.particles){c.globalAlpha=a.life/.4;c.fillStyle=a.color;c.fillRect(a.x,a.y,3,3);}c.globalAlpha=1;
    this.onState({hp:p.hp,kills:this.kills,total:this.enemies.length,state:this.state});
  }
  loop(t){if(!this.running)return;const dt=this.last?Math.min((t-this.last)/1000,.04):0;this.last=t;this.update(dt);this.draw();requestAnimationFrame(n=>this.loop(n));}
}
