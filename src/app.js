import {Courtyard} from './game.js?v=4';
const $=id=>document.getElementById(id),overlay=$('overlay'),canvas=$('game');let game,lastState;
function show(title,message,label){$('title').textContent=title;$('message').textContent=message;$('start').textContent=label;overlay.hidden=false;}
function point(event){const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height};}
async function boot(){
 try{
  const response=await fetch('assets/manifest.json?v=3');if(!response.ok)throw Error('asset manifest');const manifest=await response.json(),images={};
  await Promise.all(Object.entries(manifest).filter(([,v])=>v.src).map(async([key,v])=>{const img=new Image();img.src=v.src;await img.decode();images[key]=img;}));
  game=new Courtyard(canvas,manifest,images,s=>{
   $('health').textContent=`${s.hp} / ${s.maxHp}`;$('healthbar').style.width=`${100*s.hp/s.maxHp}%`;$('score').textContent=`${s.kills} / ${s.total}`;$('wave').textContent=s.wave;$('level').textContent=s.level;$('gold').textContent=s.gold;$('xpbar').style.width=`${100*s.xp/s.xpNext}%`;
   if(s.state!==lastState&&s.state==='won')show('공성 시험 완료','세 번의 습격을 모두 막아냈습니다. 더 빠른 기록으로 다시 도전해보세요.','다시 플레이');
   if(s.state!==lastState&&s.state==='lost')show('잿빛 안뜰 함락','거리를 벌리며 마우스로 적을 조준해 공격하세요.','다시 도전');lastState=s.state;
  });
  game.paused=true;$('start').disabled=false;show('잿빛 공성 시험','WASD로 이동하고 마우스로 조준하세요. 클릭하면 커서 방향으로 검을 휘두릅니다.','전투 시작');
 }catch(e){show('에셋을 불러오지 못했어요','페이지를 새로고침해서 다시 시도해주세요.','새로고침');$('start').disabled=false;$('start').onclick=()=>location.reload();console.error(e);}
}
$('start').onclick=()=>{if(!game)return;if(game.state!=='playing')game.reset();game.paused=false;game.keys.clear();lastState='playing';overlay.hidden=true;$('pause').textContent='Ⅱ';canvas.focus();};
$('pause').onclick=()=>{if(!game||game.state!=='playing')return;game.paused=!game.paused;game.keys.clear();$('pause').textContent=game.paused?'▶':'Ⅱ';if(game.paused)show('전투 일시정지','준비되면 공성 시험으로 돌아오세요.','계속하기');else overlay.hidden=true;};
canvas.addEventListener('pointermove',e=>{if(game){const p=point(e);game.setAim(p.x,p.y);}});canvas.addEventListener('pointerdown',e=>{if(!game||game.paused||e.button!==0)return;e.preventDefault();const p=point(e);game.setAim(p.x,p.y);game.setAttackHeld(true);canvas.setPointerCapture(e.pointerId);canvas.focus();});const stopAttack=()=>game?.setAttackHeld(false);canvas.addEventListener('pointerup',stopAttack);canvas.addEventListener('pointercancel',stopAttack);canvas.addEventListener('lostpointercapture',stopAttack);canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const button of document.querySelectorAll('[data-key]')){button.onpointerdown=e=>{e.preventDefault();if(!game||game.paused)return;button.setPointerCapture(e.pointerId);game.keys.add(button.dataset.key);};const release=()=>game?.keys.delete(button.dataset.key);button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;}
const touchAttack=document.querySelector('[data-action="attack"]');touchAttack.onpointerdown=e=>{e.preventDefault();if(game&&!game.paused)game.setAttackHeld(true);};touchAttack.onpointerup=touchAttack.onpointercancel=()=>game?.setAttackHeld(false);document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&game.state==='playing'){game.paused=true;game.keys.clear();game.setAttackHeld(false);show('전투 일시정지','준비되면 계속 플레이하세요.','계속하기');}});boot();
