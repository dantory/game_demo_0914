export const SLOTS={weapon:{label:'무기',icon:'⚔'},shield:{label:'방패',icon:'◈'},helmet:{label:'투구',icon:'⌒'},armor:{label:'흉갑',icon:'♜'},gloves:{label:'장갑',icon:'✥'},boots:{label:'장화',icon:'▥'},belt:{label:'허리띠',icon:'▬'},amulet:{label:'목걸이',icon:'◇'},ring:{label:'반지',icon:'○'},charm:{label:'부적',icon:'◆'}};
export const RARITIES={common:{label:'일반',color:'#b8b7ae',power:1},magic:{label:'마법',color:'#5aa8e8',power:1.3},rare:{label:'희귀',color:'#e3c151',power:1.7},legendary:{label:'전설',color:'#e8793e',power:2.25}};
const NAMES={weapon:['녹슨 장검','묘지기의 도끼','잿빛 철퇴','파수꾼의 검'],shield:['망자의 철제 방패'],helmet:['핏빛 갈기 투구'],armor:['해진 사슬갑옷','철벽 흉갑','방랑자의 외투','수호자의 판금'],gloves:['성채의 건틀릿'],boots:['철기병의 장화'],belt:['용병의 도구 허리띠'],amulet:['핏빛 서약 목걸이'],ring:['왕실 인장 반지'],charm:['금 간 인장','까마귀 부적','핏빛 룬','고대 수호석']};
const ICONS={weapon:['iron-longsword','gravekeeper-axe','ash-warhammer','royal-flame-sword'],shield:['steel-shield'],helmet:['knight-helmet'],armor:['torn-chainmail','iron-breastplate','wanderer-cloak','royal-plate'],gloves:['armored-gloves'],boots:['plated-boots'],belt:['utility-belt'],amulet:['ruby-amulet'],ring:['gold-ring'],charm:['cracked-seal','raven-talisman','blood-rune','guardian-stone']};
export const ITEM_ICON_PATHS=Object.values(ICONS).flat().reduce((all,key)=>(all[key]=`assets/items/${key}.png`,all),{});
const PREFIX={magic:['날카로운','견고한','민첩한'],rare:['기사단의','황혼의','저주받은'],legendary:['잊힌 왕의','불멸자의','심연을 가르는']};

export function createInventory(limit=20){return{version:1,limit,items:[],equipment:Object.fromEntries(Object.keys(SLOTS).map(slot=>[slot,null]))};}
function rarityFor(wave,boss,rng){if(boss)return rng()<.35?'legendary':'rare';const n=rng(),legend=.005*wave,rare=.05+.025*wave,magic=.25+.04*wave;return n<legend?'legendary':n<legend+rare?'rare':n<legend+rare+magic?'magic':'common';}
export function generateItem({wave=1,boss=false,rng=Math.random,id}={}){
  const slots=Object.keys(SLOTS),slot=slots[Math.floor(rng()*slots.length)],rarity=rarityFor(wave,boss,rng),power=RARITIES[rarity].power,level=Math.max(1,wave),roll=()=>.85+rng()*.3,stats={};
  if(slot==='weapon'){stats.damage=Math.max(1,Math.round((.8+level*.55)*power*roll()));if(rarity!=='common')stats.crit=Math.round((1+level*.7)*power*roll());}
  if(slot==='armor'){stats.armor=Math.max(1,Math.round((.7+level*.45)*power*roll()));stats.health=Math.round((4+level*3.5)*power*roll());}
  if(slot==='shield'){stats.armor=Math.max(1,Math.round((1+level*.5)*power*roll()));stats.health=Math.round((2+level*2)*power*roll());}
  if(slot==='helmet'){stats.armor=Math.max(1,Math.round((.5+level*.35)*power*roll()));stats.crit=Math.round((1+level*.35)*power*roll());}
  if(slot==='gloves'){stats.damage=Math.max(1,Math.round((.4+level*.3)*power*roll()));stats.crit=Math.round((1+level*.55)*power*roll());}
  if(slot==='boots'){stats.armor=Math.max(1,Math.round((.35+level*.25)*power*roll()));stats.speed=Math.round((2+level*.7)*power*roll());}
  if(slot==='belt'){stats.health=Math.round((3+level*2.5)*power*roll());stats.armor=Math.max(1,Math.round((.3+level*.2)*power*roll()));}
  if(slot==='amulet'){stats.damage=Math.max(1,Math.round((.3+level*.25)*power*roll()));stats.crit=Math.round((2+level*.65)*power*roll());}
  if(slot==='ring'){stats.crit=Math.round((2+level*.6)*power*roll());stats.speed=Math.round((1+level*.35)*power*roll());}
  if(slot==='charm'){stats.crit=Math.round((1.5+level)*power*roll());stats.speed=Math.round((1+level*.8)*power*roll());if(['rare','legendary'].includes(rarity))stats.damage=1;}
  const baseIndex=Math.floor(rng()*NAMES[slot].length),base=NAMES[slot][baseIndex],name=rarity==='common'?base:`${PREFIX[rarity][Math.floor(rng()*PREFIX[rarity].length)]} ${base}`;
  return{id:id||`loot-${Date.now().toString(36)}-${Math.floor(rng()*1e7).toString(36)}`,slot,rarity,level,name,icon:ICONS[slot][baseIndex],stats,value:Math.round((5+level*4)*power)};
}
export function itemIconKey(item){
  if(item?.icon&&ITEM_ICON_PATHS[item.icon])return item.icon;const name=item?.name||'';
  if(item?.slot==='weapon')return name.includes('도끼')?'gravekeeper-axe':name.includes('철퇴')?'ash-warhammer':name.includes('파수꾼')?'royal-flame-sword':'iron-longsword';
  if(item?.slot==='shield')return'steel-shield';if(item?.slot==='helmet')return'knight-helmet';if(item?.slot==='gloves')return'armored-gloves';if(item?.slot==='boots')return'plated-boots';if(item?.slot==='belt')return'utility-belt';if(item?.slot==='amulet')return'ruby-amulet';if(item?.slot==='ring')return'gold-ring';
  if(item?.slot==='armor')return name.includes('사슬')?'torn-chainmail':name.includes('흉갑')?'iron-breastplate':name.includes('외투')?'wanderer-cloak':'royal-plate';
  return name.includes('인장')?'cracked-seal':name.includes('까마귀')?'raven-talisman':name.includes('핏빛')?'blood-rune':'guardian-stone';
}
export function equippedIds(inventory){return new Set(Object.values(inventory.equipment).filter(Boolean));}
export function carriedItems(inventory){const equipped=equippedIds(inventory);return inventory.items.filter(item=>!equipped.has(item.id));}
export function addItem(inventory,item){if(carriedItems(inventory).length>=inventory.limit)return false;inventory.items.push(item);return true;}
export function equipItem(inventory,itemId){const item=inventory.items.find(x=>x.id===itemId);if(!item)return false;inventory.equipment[item.slot]=item.id;return true;}
export function unequipSlot(inventory,slot){if(!(slot in inventory.equipment)||!inventory.equipment[slot]||carriedItems(inventory).length>=inventory.limit)return false;inventory.equipment[slot]=null;return true;}
export function discardItem(inventory,itemId){if(Object.values(inventory.equipment).includes(itemId))return false;const i=inventory.items.findIndex(x=>x.id===itemId);if(i<0)return false;inventory.items.splice(i,1);return true;}
export function sortInventory(inventory){const slots=Object.keys(SLOTS),rarity={legendary:0,rare:1,magic:2,common:3};inventory.items.sort((a,b)=>slots.indexOf(a.slot)-slots.indexOf(b.slot)||(rarity[a.rarity]??9)-(rarity[b.rarity]??9)||(b.level||0)-(a.level||0)||a.name.localeCompare(b.name,'ko'));return true;}
export function bonuses(inventory){const total={damage:0,armor:0,health:0,crit:0,speed:0};for(const id of Object.values(inventory.equipment)){const item=inventory.items.find(x=>x.id===id);if(item)for(const [key,value] of Object.entries(item.stats))total[key]=(total[key]||0)+value;}return total;}
export function saveInventory(inventory,storage=globalThis.localStorage){try{storage?.setItem('ashen-siege-inventory-v1',JSON.stringify(inventory));return true;}catch{return false;}}
export function loadInventory(storage=globalThis.localStorage){try{const data=JSON.parse(storage?.getItem('ashen-siege-inventory-v1'));if(data?.version===1&&Array.isArray(data.items)&&data.equipment){for(const slot of Object.keys(SLOTS))data.equipment[slot]??=null;return data;}}catch{}return createInventory();}
