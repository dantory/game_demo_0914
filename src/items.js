export const SLOTS={
  weapon:{label:'무기',icon:'⚔'},shield:{label:'방패',icon:'◈'},helmet:{label:'투구',icon:'⌒'},
  armor:{label:'흉갑',icon:'♜'},gloves:{label:'장갑',icon:'✥'},boots:{label:'장화',icon:'▥'},
  belt:{label:'허리띠',icon:'▬'},amulet:{label:'목걸이',icon:'◇'},ring:{label:'반지',icon:'○'},charm:{label:'부적',icon:'◆'},
};
export const RARITIES={
  common:{label:'일반',color:'#b8b7ae',power:1,affixes:0},
  magic:{label:'마법',color:'#5aa8e8',power:1.3,affixes:1},
  rare:{label:'희귀',color:'#e3c151',power:1.7,affixes:2},
  legendary:{label:'전설',color:'#e8793e',power:2.25,affixes:3},
};
const NAMES={
  weapon:['녹슨 장검','묘지기의 도끼','잿빛 철퇴','파수꾼의 검'],shield:['망자의 철제 방패'],
  helmet:['핏빛 갈기 투구'],armor:['해진 사슬갑옷','철벽 흉갑','방랑자의 외투','수호자의 판금'],
  gloves:['성채의 건틀릿'],boots:['철기병의 장화'],belt:['용병의 도구 허리띠'],
  amulet:['핏빛 서약 목걸이'],ring:['왕실 인장 반지'],charm:['금 간 인장','까마귀 부적','핏빛 룬','고대 수호석'],
};
const ICONS={
  weapon:['iron-longsword','gravekeeper-axe','ash-warhammer','royal-flame-sword'],shield:['steel-shield'],
  helmet:['knight-helmet'],armor:['torn-chainmail','iron-breastplate','wanderer-cloak','royal-plate'],
  gloves:['armored-gloves'],boots:['plated-boots'],belt:['utility-belt'],amulet:['ruby-amulet'],
  ring:['gold-ring'],charm:['cracked-seal','raven-talisman','blood-rune','guardian-stone'],
};
export const ITEM_ICON_PATHS=Object.values(ICONS).flat().reduce((all,key)=>(all[key]='assets/items/'+key+'.png',all),{});
const STAT_KEYS=new Set(['damage','armor','health','crit','speed']);
const ALL_SLOTS=Object.keys(SLOTS);
export const LOOT_TABLES={
  slime:{label:'일반',gold:3,xp:2,equipmentChance:.18,rarityBonus:0,guaranteedItems:0,boss:false},
  ember:{label:'정예',gold:5,xp:3,equipmentChance:.3,rarityBonus:.06,guaranteedItems:0,boss:false},
  cultist:{label:'정예',gold:6,xp:3,equipmentChance:.4,rarityBonus:.12,guaranteedItems:0,boss:false},
  brute:{label:'보스',gold:24,xp:10,equipmentChance:1,rarityBonus:0,guaranteedItems:2,boss:true},
};

const TIERS={
  damage:[{tier:5,minLevel:1,min:1,max:2},{tier:4,minLevel:2,min:2,max:3},{tier:3,minLevel:3,min:3,max:5},{tier:2,minLevel:5,min:5,max:7},{tier:1,minLevel:8,min:8,max:11}],
  armor:[{tier:5,minLevel:1,min:1,max:2},{tier:4,minLevel:2,min:2,max:3},{tier:3,minLevel:3,min:3,max:5},{tier:2,minLevel:5,min:5,max:7},{tier:1,minLevel:8,min:8,max:10}],
  health:[{tier:5,minLevel:1,min:4,max:7},{tier:4,minLevel:2,min:8,max:12},{tier:3,minLevel:3,min:13,max:19},{tier:2,minLevel:5,min:20,max:28},{tier:1,minLevel:8,min:29,max:40}],
  crit:[{tier:5,minLevel:1,min:1,max:2},{tier:4,minLevel:2,min:2,max:4},{tier:3,minLevel:3,min:4,max:6},{tier:2,minLevel:5,min:6,max:9},{tier:1,minLevel:8,min:10,max:13}],
  speed:[{tier:5,minLevel:1,min:1,max:2},{tier:4,minLevel:2,min:3,max:4},{tier:3,minLevel:3,min:5,max:7},{tier:2,minLevel:5,min:8,max:10},{tier:1,minLevel:8,min:11,max:14}],
};
const OFFENSE=['weapon','gloves','amulet','ring','charm','helmet'];
const DEFENSE=['shield','helmet','armor','gloves','boots','belt'];
export const AFFIX_DEFINITIONS=[
  {id:'assault',position:'prefix',group:'damage',label:'맹공의',stat:'damage',slots:OFFENSE,tiers:TIERS.damage},
  {id:'bulwark',position:'prefix',group:'armor',label:'철벽의',stat:'armor',slots:DEFENSE,tiers:TIERS.armor},
  {id:'vigor',position:'prefix',group:'health',label:'생명의',stat:'health',slots:ALL_SLOTS,tiers:TIERS.health},
  {id:'precision',position:'prefix',group:'crit',label:'예리한',stat:'crit',slots:OFFENSE,tiers:TIERS.crit},
  {id:'slaughter',position:'suffix',group:'crit',label:'학살',stat:'crit',slots:OFFENSE,tiers:TIERS.crit},
  {id:'gale',position:'suffix',group:'speed',label:'질풍',stat:'speed',slots:ALL_SLOTS,tiers:TIERS.speed},
  {id:'guardian',position:'suffix',group:'armor',label:'수호',stat:'armor',slots:DEFENSE,tiers:TIERS.armor},
  {id:'colossus',position:'suffix',group:'health',label:'거신',stat:'health',slots:ALL_SLOTS,tiers:TIERS.health},
];

const clampRoll=rng=>Math.min(.999999,Math.max(0,Number(rng())||0));
const rollInt=(min,max,rng)=>min+Math.floor(clampRoll(rng)*(max-min+1));
const tierFor=(definition,level)=>[...definition.tiers].reverse().find(tier=>level>=tier.minLevel)||definition.tiers[0];
const aggregateStats=(implicit,affixes)=>{
  const stats={};
  for(const roll of [...implicit,...affixes])if(STAT_KEYS.has(roll.stat)&&Number.isFinite(roll.value))stats[roll.stat]=(stats[roll.stat]||0)+roll.value;
  return stats;
};
const normalizeRoll=(roll,type)=>{
  if(!roll||!STAT_KEYS.has(roll.stat)||!Number.isFinite(roll.value)||roll.value<0)return null;
  const min=Number.isFinite(roll.min)?roll.min:roll.value,max=Number.isFinite(roll.max)?roll.max:roll.value;
  if(min<0||max<min||roll.value<min||roll.value>max)return null;
  if(type==='implicit')return{stat:roll.stat,value:roll.value,min,max};
  if(typeof roll.id!=='string'||!roll.id||typeof roll.label!=='string'||!['prefix','suffix'].includes(roll.position)||!Number.isInteger(roll.tier)||roll.tier<1||roll.tier>5)return null;
  return{id:roll.id,position:roll.position,group:typeof roll.group==='string'&&roll.group?roll.group:roll.stat,label:roll.label,stat:roll.stat,tier:roll.tier,value:roll.value,min,max};
};

function normalizeItem(item){
  if(!item||typeof item.id!=='string'||!item.id||!SLOTS[item.slot]||!RARITIES[item.rarity]||typeof item.name!=='string'||!item.name||!Number.isFinite(item.level)||item.level<1||!item.stats||typeof item.stats!=='object')return null;
  const legacyStats={};
  for(const [key,value] of Object.entries(item.stats)){if(!STAT_KEYS.has(key)||!Number.isFinite(value)||value<0)return null;legacyStats[key]=value;}
  if(!Object.keys(legacyStats).length)return null;
  const implicit=Array.isArray(item.implicit)?item.implicit.map(roll=>normalizeRoll(roll,'implicit')).filter(Boolean):[];
  const affixLimit=RARITIES[item.rarity].affixes;
  const affixes=Array.isArray(item.affixes)?item.affixes.slice(0,affixLimit).map(affix=>{
    const detailed=normalizeRoll(affix,'affix');
    if(detailed)return detailed;
    return affix&&typeof affix.id==='string'&&typeof affix.label==='string'?{id:affix.id,label:affix.label}:null;
  }).filter(Boolean):[];
  const detailed=implicit.length||affixes.some(affix=>affix.position);
  const stats=detailed?aggregateStats(implicit,affixes.filter(affix=>affix.position)):legacyStats;
  if(!Object.keys(stats).length)return null;
  return{
    id:item.id,slot:item.slot,rarity:item.rarity,level:Math.floor(item.level),name:item.name,
    baseName:typeof item.baseName==='string'&&item.baseName?item.baseName:item.name,
    icon:ITEM_ICON_PATHS[item.icon]?item.icon:undefined,stats,implicit,affixes,
    value:Number.isFinite(item.value)?Math.max(0,Math.floor(item.value)):0,
  };
}

export function createInventory(limit=20){return{version:2,limit,items:[],equipment:Object.fromEntries(Object.keys(SLOTS).map(slot=>[slot,null]))};}
function rarityFor(wave,boss,rarityBonus,rng){
  if(boss)return clampRoll(rng)<.35?'legendary':'rare';
  const n=clampRoll(rng),legend=.005*wave+rarityBonus*.15,rare=.05+.025*wave+rarityBonus*.45,magic=.25+.04*wave+rarityBonus*.4;
  return n<legend?'legendary':n<legend+rare?'rare':n<legend+rare+magic?'magic':'common';
}
function positionPlan(rarity,rng){
  if(rarity==='common')return[];
  if(rarity==='magic')return[clampRoll(rng)<.5?'prefix':'suffix'];
  if(rarity==='rare')return['prefix','suffix'];
  return clampRoll(rng)<.5?['prefix','prefix','suffix']:['prefix','suffix','suffix'];
}
function rollImplicit(slot,level,power,rng){
  const implicit=[],add=(stat,base,minimum=0)=>{
    const min=Math.max(minimum,Math.round(base*power*.85)),max=Math.max(min,Math.round(base*power*1.15)),value=rollInt(min,max,rng);
    implicit.push({stat,value,min,max});
  };
  if(slot==='weapon'){add('damage',.8+level*.55,1);add('crit',1+level*.7);}
  if(slot==='armor'){add('armor',.7+level*.45,1);add('health',4+level*3.5);}
  if(slot==='shield'){add('armor',1+level*.5,1);add('health',2+level*2);}
  if(slot==='helmet'){add('armor',.5+level*.35,1);add('crit',1+level*.35);}
  if(slot==='gloves'){add('damage',.4+level*.3,1);add('crit',1+level*.55);}
  if(slot==='boots'){add('armor',.35+level*.25,1);add('speed',2+level*.7);}
  if(slot==='belt'){add('health',3+level*2.5);add('armor',.3+level*.2,1);}
  if(slot==='amulet'){add('damage',.3+level*.25,1);add('crit',2+level*.65);}
  if(slot==='ring'){add('crit',2+level*.6);add('speed',1+level*.35);}
  if(slot==='charm'){add('crit',1.5+level);add('speed',1+level*.8);}
  return implicit;
}
function rollAffixes(slot,level,rarity,rng){
  const affixes=[],usedGroups=new Set();
  for(const position of positionPlan(rarity,rng)){
    const pool=AFFIX_DEFINITIONS.filter(definition=>definition.position===position&&definition.slots.includes(slot)&&!usedGroups.has(definition.group));
    if(!pool.length)continue;
    const definition=pool[Math.floor(clampRoll(rng)*pool.length)],tier=tierFor(definition,level),value=rollInt(tier.min,tier.max,rng);
    usedGroups.add(definition.group);
    affixes.push({id:definition.id,position:definition.position,group:definition.group,label:definition.label,stat:definition.stat,tier:tier.tier,value,min:tier.min,max:tier.max});
  }
  return affixes;
}
export function lootProfile(enemyType='slime'){return LOOT_TABLES[enemyType]||LOOT_TABLES.slime;}
export function generateItem({wave=1,boss=false,source='slime',rng=Math.random,id}={}){
  const profile=lootProfile(source),slot=ALL_SLOTS[Math.floor(clampRoll(rng)*ALL_SLOTS.length)],rarity=rarityFor(wave,boss||profile.boss,profile.rarityBonus,rng),power=RARITIES[rarity].power,level=Math.max(1,Math.floor(wave));
  const baseIndex=Math.floor(clampRoll(rng)*NAMES[slot].length),baseName=NAMES[slot][baseIndex],implicit=rollImplicit(slot,level,power,rng),affixes=rollAffixes(slot,level,rarity,rng),stats=aggregateStats(implicit,affixes);
  const strongest=position=>affixes.filter(affix=>affix.position===position).sort((a,b)=>a.tier-b.tier)[0];
  const prefix=strongest('prefix'),suffix=strongest('suffix'),name=(prefix?prefix.label+' ':'')+baseName+(suffix?' · '+suffix.label:'');
  return{id:id||'loot-'+Date.now().toString(36)+'-'+Math.floor(clampRoll(rng)*1e7).toString(36),slot,rarity,level,name,baseName,icon:ICONS[slot][baseIndex],stats,implicit,affixes,value:Math.round((5+level*4)*power*(1+affixes.length*.18))};
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
export function equipItem(inventory,itemId){const item=inventory.items.find(candidate=>candidate.id===itemId);if(!item||!(item.slot in inventory.equipment))return false;inventory.equipment[item.slot]=item.id;return true;}
export function unequipSlot(inventory,slot){if(!(slot in inventory.equipment)||!inventory.equipment[slot]||carriedItems(inventory).length>=inventory.limit)return false;inventory.equipment[slot]=null;return true;}
export function discardItem(inventory,itemId){if(Object.values(inventory.equipment).includes(itemId))return false;const index=inventory.items.findIndex(item=>item.id===itemId);if(index<0)return false;inventory.items.splice(index,1);return true;}
export function sortInventory(inventory){const slots=Object.keys(SLOTS),rarity={legendary:0,rare:1,magic:2,common:3};inventory.items.sort((a,b)=>slots.indexOf(a.slot)-slots.indexOf(b.slot)||(rarity[a.rarity]??9)-(rarity[b.rarity]??9)||(b.level||0)-(a.level||0)||a.name.localeCompare(b.name,'ko'));return true;}
export function bonuses(inventory){const total={damage:0,armor:0,health:0,crit:0,speed:0};for(const id of Object.values(inventory.equipment)){const item=inventory.items.find(candidate=>candidate.id===id);if(item)for(const [key,value] of Object.entries(item.stats))total[key]=(total[key]||0)+value;}return total;}
export function saveInventory(inventory,storage=globalThis.localStorage){try{storage?.setItem('ashen-siege-inventory-v1',JSON.stringify({...inventory,version:2}));return true;}catch{return false;}}
export function loadInventory(storage=globalThis.localStorage){
  try{
    const data=JSON.parse(storage?.getItem('ashen-siege-inventory-v1'));
    if([1,2].includes(data?.version)&&Array.isArray(data.items)&&data.equipment&&typeof data.equipment==='object'){
      const inventory=createInventory(Number.isInteger(data.limit)&&data.limit>0&&data.limit<=100?data.limit:20),seen=new Set();
      for(const raw of data.items){const item=normalizeItem(raw);if(item&&!seen.has(item.id)){inventory.items.push(item);seen.add(item.id);}}
      for(const slot of Object.keys(SLOTS)){const id=data.equipment[slot],item=inventory.items.find(candidate=>candidate.id===id);inventory.equipment[slot]=item?.slot===slot?id:null;}
      const equipped=equippedIds(inventory);let carried=0;inventory.items=inventory.items.filter(item=>equipped.has(item.id)||carried++<inventory.limit);
      return inventory;
    }
  }catch{}
  return createInventory();
}
