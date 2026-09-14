import test from 'node:test';
import assert from 'node:assert/strict';
import {Courtyard} from '../src/game.js';
function game(){const g=Object.create(Courtyard.prototype);g.keys=new Set();g.walls=[{x:220,y:150,w:90,h:44}];g.reset();return g;}
test('wall and courtyard boundaries block movement',()=>{const g=game();g.player.x=205;g.player.y=175;g.move(g.player,10,0);assert.equal(g.player.x,205);assert.equal(g.blocked(20,100,13),true);assert.equal(g.blocked(100,100,13),false);});
test('attack hurts nearby facing enemy but cannot pass through a wall',()=>{const g=game();g.player.x=205;g.player.y=175;g.player.face='right';g.enemies=[{x:250,y:175,r:14,hp:3,inv:0,clock:0}];g.keys.add(' ');g.update(.016);assert.equal(g.enemies[0].hp,3);g.walls=[];g.player.cool=0;g.player.action='idle';g.attackHeld=false;g.update(.016);assert.equal(g.enemies[0].hp,2);});
test('last enemy defeat wins, reset clears victory and health',()=>{const g=game();g.player.face='right';g.enemies=[{x:150,y:270,r:14,hp:1,inv:0,clock:0}];g.keys.add(' ');g.update(.016);assert.equal(g.state,'won');assert.equal(g.kills,1);g.reset();assert.equal(g.state,'playing');assert.equal(g.player.hp,5);assert.equal(g.enemies.length,5);assert.equal(g.keys.size,0);});
test('pause freezes gameplay',()=>{const g=game();g.paused=true;g.keys.add('d');g.update(1);assert.equal(g.player.x,110);assert.equal(g.time,0);});
