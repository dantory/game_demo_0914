export const SLOTS={weapon:{label:'무기',icon:'⚔'},shield:{label:'방패',icon:'◈'},helmet:{label:'투구',icon:'⌒'},armor:{label:'흉갑',icon:'♜'},gloves:{label:'장갑',icon:'✥'},boots:{label:'장화',icon:'▥'},belt:{label:'허리띠',icon:'▬'},amulet:{label:'목걸이',icon:'◇'},ring:{label:'반지',icon:'○'},charm:{label:'부적',icon:'◆'}};
export const RARITIES={common:{label:'일반',color:'#b8b7ae',power:1},magic:{label:'마법',color:'#5aa8e8',power:1.3},rare:{label:'희귀',color:'#e3c151',power:1.7},legendary:{label:'전설',color:'#e8793e',power:2.25}};
const NAMES={weapon:['녹슨 장검','묘지기의 도끼','잿빛 철퇴','파수꾼의 검'],shield:['망자의 철제 방패'],helmet:['핏빛 갈기 투구'],armor:['해진 사슬갑옷','철벽 흉갑','방랑자의 외투','수호자의 판금'],gloves:['성채의 건틀릿'],boots:['철기병의 장화'],belt:['용병의 도구 허리띠'],amulet:['핏빛 서약 목걸이'],ring:['왕실 인장 반지'],charm:['금 간 인장','까마귀 부적','핏빛 룬','고대 수호석']};
const ICONS={weapon:['iron-longsword','gravekeeper-axe','ash-warhammer','royal-flame-sword'],shield:['steel-shield'],helmet:['knight-helmet'],armor:['torn-chainmail','iron-breastplate','wanderer-cloak','royal-plate'],gloves:['armored-gloves'],boots:['plated-boots'],belt:['utility-belt'],amulet:['ruby-amulet'],ring:['gold-ring'],charm:['cracked-seal','raven-talisman','blood-rune','guardian-stone']};
export const ITEM_ICON_PATHS=Object.values(ICONS).flat().reduce((all,key)=>(all[key]=`assets/items/${key}.png`,all),{});
const STAT_KEYS=new Set(['damage','armor','health','crit','speed']);
export const LOOT_TABLES={
  slime:{label:'일반',gold:3,xp:2,equipmentChance:.18,rarityBonus:0,guaranteedItems:0,boss:false},
  ember:{label:'정예',gold:5,xp:3,equipmentChance:.3,rarityBonus:.06,guaranteedItems:0,boss:false},
  cultist:{label:'정예',gold:6,xp:3,equipmentChance:.4,rarityBonus:.12,guaranteedItems:0,boss:false},
  brute:{label:'보스',gold:24,xp:10,equipmentChance:1,rarityBonus:0,guaranteedItems:2,boss:true},
};
const AFFIXES=[
  {id:'assault',position:'prefix',label:'맹공의',stat:'damage',base:1,perLevel:.34},
  {id:'bulwark',position:'prefix',label:'철벽의',stat:'armor',base:1,perLevel:.3},
  {id:'vigor',position:'prefix',label:'생명의',stat:'health',base:5,perLevel:2.2},
  {id:'slaughter',position:'suffix',label:'학살',stat:'crit',base:2,perLevel:.7},
  {id:'gale',position:'suffix',label:'질풍',stat:'speed',base:2,perLevel:.65},
];

function normalizeItem(item){
  if(!item||typeof item.id!=='string'||!item.id||!SLOTS[item.slot]||!RARITIES[item.rarity]||typeof item.name!=='string'||!item.name||!Number.isFinite(item.level)||item.level<1||!item.stats||typeof item.stats!=='object')return null;
  const stats={};for(const [key,value] of Object.entries(item.stats)){if(!STAT_KEYS.has(key)||!Number.isFinite(value)||value<0)return null;stats[key]=value;}
  if(!Object.keys(stats).length)return null;
  const affixes=Array.isArray(item.affixes)?item.affixes.filter(affix=>affix&&typeof affix.id==='string'&&typeof affix.label==='string').slice(0,3).map(({id,label})=>({id,label})):[];
  return{id:item.id,slot:item.slot,rarity:item.rarity,level:Math.floor(item.level),name:item.name,icon:ITEM_ICON_PATHS[item.icon]?item.icon:undefined,stats,affixes,value:Number.isFinite(item.value)?Math.max(0,Math.floor(item.value)):0};
}

export function createInventory(limit=20){return{version:1,limit,items:[],equipment:Object.fromEntries(Object.keys(SLOTS).map(slot=>[slot,null]))};}
function rarityFor(wave,boss,rarityBonus,rng){if(boss)return rng()<.35?'legendary':'rare';const n=rng(),legend=.005*wave+rarityBonus*.15,rare=.05+.025*wave+rarityBonus*.45,magic=.25+.04*wave+rarityBonus*.4;return n<legend?'legendary':n<legend+rare?'rare':n<legend+rare+magic?'magic':'common';}
export function lootProfile(enemyType='slime'){return LOOT_TABLES[enemyType]||LOOT_TABLES.slime;}
export function generateItem({wave=1,boss=false,source='slime',rng=Math.random,id}={}){
  const profile=lootProfile(source),slots=Object.keys(SLOTS),slot=slots[Math.floor(rng()*slots.length)],rarity=rarityFor(wave,boss||profile.boss,profile.rarityBonus,rng),power=RARITIES[rarity].power,level=Math.max(1,wave),roll=()=>.85+rng()*.3,stats={};
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
  const affixCount={common:0,magic:1,rare:2,legendary:3}[rarity],pool=[...AFFIXES],affixes=[];
  for(let i=0;i<affixCount;i++){const affix=pool.splice(Math.floor(rng()*pool.length),1)[0],amount=Math.max(1,Math.round((affix.base+level*affix.perLevel)*power*roll()));stats[affix.stat]=(stats[affix.stat]||0)+amount;affixes.push({id:affix.id,label:affix.label});}
  const baseIndex=Math.floor(rng()*NAMES[slot].length),base=NAMES[slot][baseIndex],prefix=affixes.find(affix=>AFFIXES.find(def=>def.id===affix.id)?.position==='prefix'),suffix=affixes.find(affix=>AFFIXES.find(def=>def.id===affix.id)?.position==='suffix'),name=`${prefix?`${prefix.label} `:''}${base}${suffix?` · ${suffix.label}`:''}`;
  return{id:id||`loot-${Date.now().toString(36)}-${Math.floor(rng()*1e7).toString(36)}`,slot,rarity,level,name,icon:ICONS[slot][baseIndex],stats,affixes,value:Math.round((5+level*4)*power*(1+affixCount*.18))};
}
export function itemIconKey(item){
  if(item?.icon&&ITEM_ICON_PATHS[item.icon])return item.icon;const name=item?.name||'';
  if(item?.slot==='weapon')return name.includes('도끼')?'gravekeeper-axe':name.includes('철퇴')?'ash-warhammer':name.includes('파수꾼')?'royal-flame-sword':'iron-longsword';
  if(item?.slot==='shield')return'steel-shield';if(item?.slot==='helmet')return'knight-helmet';if(item?.slot==='gloves')return'armored-gloves';if(item?.slot==='boots')return'plated-boots';if(item?.slot==='belt')return'utility-belt';if(item?.slot==='amulet')return'ruby-amulet';if(item?.slot==='ring')return'gold-ring';
  if(item?.slot==='armor')return name.includes('사슬')?'torn-chainmail':name.includes('흉갑')?'iron-breastplate':name.includes('외투')?'wanderer-cloak':'royal-plate';
  return name.includes('인장')?'cracked-seal':name.includes('까마귀')?'raven-talisman':name.includes('핏빛')?'blood-rune':'guardian-stone';
}
export function itemPower(item){return item?Math.round(item.level*8+(item.stats.damage||0)*5+(item.stats.armor||0)*4+(item.stats.health||0)*.3+(item.stats.crit||0)*1.5+(item.stats.speed||0)):0;}
export function equippedIds(inventory){return new Set(Object.values(inventory.equipment).filter(Boolean));}
export function carriedItems(inventory){const equipped=equippedIds(inventory);return inventory.items.filter(item=>!equipped.has(item.id));}
export function addItem(inventory,item){const normalized=normalizeItem(item);if(!normalized||inventory.items.some(existing=>existing.id===normalized.id)||carriedItems(inventory).length>=inventory.limit)return false;inventory.items.push(normalized);return true;}
export function equipItem(inventory,itemId){const item=inventory.items.find(x=>x.id===itemId);if(!item||!(item.slot in inventory.equipment))return false;inventory.equipment[item.slot]=item.id;return true;}
export function unequipSlot(inventory,slot){if(!(slot in inventory.equipment)||!inventory.equipment[slot]||carriedItems(inventory).length>=inventory.limit)return false;inventory.equipment[slot]=null;return true;}
export function discardItem(inventory,itemId){if(Object.values(inventory.equipment).includes(itemId))return false;const i=inventory.items.findIndex(x=>x.id===itemId);if(i<0)return false;inventory.items.splice(i,1);return true;}
export function sortInventory(inventory){const slots=Object.keys(SLOTS),rarity={legendary:0,rare:1,magic:2,common:3};inventory.items.sort((a,b)=>slots.indexOf(a.slot)-slots.indexOf(b.slot)||(rarity[a.rarity]??9)-(rarity[b.rarity]??9)||(b.level||0)-(a.level||0)||a.name.localeCompare(b.name,'ko'));return true;}
export function bonuses(inventory){const total={damage:0,armor:0,health:0,crit:0,speed:0};for(const id of Object.values(inventory.equipment)){const item=inventory.items.find(x=>x.id===id);if(item)for(const [key,value] of Object.entries(item.stats))total[key]=(total[key]||0)+value;}return total;}
export function saveInventory(inventory,storage=globalThis.localStorage){try{storage?.setItem('ashen-siege-inventory-v1',JSON.stringify(inventory));return true;}catch{return false;}}
export function loadInventory(storage=globalThis.localStorage){try{const data=JSON.parse(storage?.getItem('ashen-siege-inventory-v1'));if(data?.version===1&&Array.isArray(data.items)&&data.equipment&&typeof data.equipment==='object'){const inventory=createInventory(Number.isInteger(data.limit)&&data.limit>0&&data.limit<=100?data.limit:20),seen=new Set();for(const raw of data.items){const item=normalizeItem(raw);if(item&&!seen.has(item.id)){inventory.items.push(item);seen.add(item.id);}}for(const slot of Object.keys(SLOTS)){const id=data.equipment[slot],item=inventory.items.find(candidate=>candidate.id===id);inventory.equipment[slot]=item?.slot===slot?id:null;}const equipped=equippedIds(inventory);let carried=0;inventory.items=inventory.items.filter(item=>equipped.has(item.id)||carried++<inventory.limit);return inventory;}}catch{}return createInventory();}
