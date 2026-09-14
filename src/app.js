import {Courtyard} from './game.js';
const $=id=>document.getElementById(id),overlay=$('overlay');let game;
function show(title,message,label){$('title').textContent=title;$('message').textContent=message;$('start').textContent=label;overlay.hidden=false;}
async function boot(){
 try{
  const response=await fetch('assets/manifest.json');if(!response.ok)throw Error('asset manifest');const manifest=await response.json(),images={};
  await Promise.all(Object.entries(manifest).filter(([,v])=>v.src).map(async([key,v])=>{const img=new Image();img.src=v.src;await img.decode();images[key]=img;}));
  game=new Courtyard($('game'),manifest,images,s=>{
   $('health').textContent='♥ '.repeat(Math.max(0,s.hp))+'♡ '.repeat(5-Math.max(0,s.hp));$('health').setAttribute('aria-label',String(s.hp)+' / 5 체력');$('score').textContent=s.kills+' / '+s.total;
   if(s.state==='won')show('안뜰을 되찾았다','다섯 마리의 슬라임을 모두 물리쳤어요. 작은 기사의 첫 임무 완료!','다시 플레이');
   if(s.state==='lost')show('기사는 다시 일어선다','움직이며 거리를 벌리고, 가까워진 슬라임을 공격해보세요.','다시 도전');
  });
  game.paused=true;$('start').disabled=false;show('안뜰의 마지막 기사','WASD · 방향키로 이동하고 Space로 검을 휘두르세요. 모바일에서는 아래 버튼을 사용하세요.','안뜰로 들어가기');
 }catch(e){show('에셋을 불러오지 못했어요','페이지를 새로고침해서 다시 시도해주세요.','새로고침');$('start').disabled=false;$('start').onclick=()=>location.reload();console.error(e);}
}
$('start').onclick=()=>{if(!game)return;if(game.state!=='playing')game.reset();game.paused=false;game.keys.clear();overlay.hidden=true;$('pause').textContent='Ⅱ';$('game').focus();};
$('pause').onclick=()=>{if(!game||game.state!=='playing')return;game.paused=!game.paused;game.keys.clear();$('pause').textContent=game.paused?'▶':'Ⅱ';if(game.paused)show('잠깐 쉬어가기','준비되면 안뜰로 돌아오세요.','계속하기');else overlay.hidden=true;};
for(const button of document.querySelectorAll('[data-key]')){button.onpointerdown=e=>{e.preventDefault();if(!game||game.paused)return;button.setPointerCapture(e.pointerId);game.keys.add(button.dataset.key);};const release=()=>game?.keys.delete(button.dataset.key);button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&game.state==='playing'){game.paused=true;game.keys.clear();show('잠깐 쉬어가기','준비되면 계속 플레이하세요.','계속하기');}});
boot();
