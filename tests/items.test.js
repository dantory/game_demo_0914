import test from 'node:test';
import assert from 'node:assert/strict';
import {addItem,bonuses,createInventory,discardItem,equipItem,generateItem,itemIconKey,ITEM_ICON_PATHS,loadInventory,saveInventory,SLOTS} from '../src/items.js';

const sequence=(...values)=>{let i=0;return()=>values[i++%values.length];};
test('generated loot has a valid slot, rarity, icon and combat stats',()=>{for(let i=0;i<Object.keys(SLOTS).length;i++){const item=generateItem({wave:2,rng:sequence((i+.01)/Object.keys(SLOTS).length,.9,.5,.2,.1,.3),id:`item-${i}`});assert.ok(SLOTS[item.slot]);assert.ok(item.name);assert.ok(ITEM_ICON_PATHS[itemIconKey(item)]);assert.ok(Object.values(item.stats).some(x=>x>0));}});
test('boss loot is always rare or legendary',()=>{const item=generateItem({wave:3,boss:true,rng:sequence(.5,.2,.5,.5,.5),id:'boss'});assert.ok(['rare','legendary'].includes(item.rarity));});
test('equipped items contribute bonuses and cannot be discarded',()=>{const bag=createInventory(),item={id:'sword',slot:'weapon',rarity:'rare',name:'검',level:1,value:1,stats:{damage:4,crit:3}};assert.equal(addItem(bag,item),true);assert.equal(equipItem(bag,'sword'),true);assert.deepEqual(bonuses(bag),{damage:4,armor:0,health:0,crit:3,speed:0});assert.equal(discardItem(bag,'sword'),false);});
test('inventory capacity is enforced',()=>{const bag=createInventory(1);assert.equal(addItem(bag,{id:'1'}),true);assert.equal(addItem(bag,{id:'2'}),false);});
test('inventory round-trips through storage',()=>{const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};const bag=createInventory();bag.items.push({id:'saved',slot:'charm',stats:{crit:2}});assert.equal(saveInventory(bag,storage),true);assert.equal(loadInventory(storage).items[0].id,'saved');});