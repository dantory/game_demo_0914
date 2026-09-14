import test from 'node:test';
import assert from 'node:assert/strict';
import {Courtyard} from '../src/game.js';

function game(){const g=Object.create(Courtyard.prototype);g.keys=new Set();g.walls=[];g.reset();g.walls=[];return g;}
function enemy(x,y,hp=2){return{x,y,r:14,hp,maxHp:hp,inv:0,clock:0,type:'slime',speed:0};}

test('walls and courtyard boundaries block movement',()=>{const g=game();g.walls=[{x:220,y:150,w:90,h:44}];g.player.x=205;g.player.y=175;g.move(g.player,10,0);assert.equal(g.player.x,205);assert.equal(g.blocked(20,100,13),true);assert.equal(g.blocked(100,100,13),false);});
test('only WASD moves the player',()=>{const g=game();g.keys.add('arrowright');g.update(.1);assert.equal(g.player.x,150);g.keys.clear();g.keys.add('d');g.update(.1);assert.ok(g.player.x>150);});
test('mouse aim attacks only enemies in the clicked direction',()=>{const g=game();g.player.x=200;g.player.y=250;g.enemies=[enemy(260,250,3),enemy(140,250,3)];g.waveTarget=2;g.setAim(400,250);g.queueAttack();g.update(.016);assert.equal(g.enemies[0].hp,1);assert.equal(g.enemies[1].hp,3);});
test('a wall blocks a mouse-directed attack',()=>{const g=game();g.player.x=205;g.player.y=175;g.walls=[{x:220,y:150,w:30,h:44}];g.enemies=[enemy(265,175)];g.waveTarget=1;g.setAim(300,175);g.queueAttack();g.update(.016);assert.equal(g.enemies[0].hp,2);});
test('clearing a wave advances to the next assault',()=>{const g=game();g.enemies=[enemy(190,286,1)];g.waveTarget=1;g.setAim(300,286);g.queueAttack();g.update(.016);assert.equal(g.waveKills,1);assert.ok(g.waveDelay>0);g.update(1.2);assert.equal(g.wave,2);assert.equal(g.enemies.length,13);});
test('holding the mouse repeats attacks after cooldown',()=>{const g=game();g.player.x=200;g.player.y=250;g.enemies=[enemy(270,250,8)];g.waveTarget=1;g.setAim(400,250);g.setAttackHeld(true);g.update(.016);const first=g.enemies[0].hp;for(let i=0;i<40;i++)g.update(.016);assert.ok(g.enemies[0].hp<first);});
test('cultists fire projectiles from range',()=>{const g=game();g.player.x=200;g.player.y=250;g.enemies=[{...enemy(400,250,4),type:'cultist',shot:0,speed:0}];g.waveTarget=1;g.update(.016);assert.equal(g.projectiles.length,1);});
test('pause freezes gameplay',()=>{const g=game();g.paused=true;g.keys.add('d');g.update(1);assert.equal(g.player.x,150);assert.equal(g.time,0);});
