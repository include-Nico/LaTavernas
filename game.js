// --- INIZIALIZZAZIONE CANVAS E CONTROLLI ---
const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

const joyZone = document.getElementById('joystick-zone'); 
const joyBase = document.getElementById('joystick-base'); 
const joyStick = document.getElementById('joystick-stick');

window.addEventListener('keydown', e => { let key = e.key.toLowerCase(); keys[key] = true; if (key === 'p' || e.key === 'Escape') togglePause(); }); 
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

joyZone.addEventListener('touchstart', handleJoyStart, {passive: false}); 
joyZone.addEventListener('touchmove', handleJoyMove, {passive: false}); 
joyZone.addEventListener('touchend', handleJoyEnd);

function handleJoyStart(e) { e.preventDefault(); let touch = e.touches[0]; joyStartX = touch.clientX; joyStartY = touch.clientY; joyBase.style.display = 'block'; joyBase.style.left = joyStartX + 'px'; joyBase.style.top = joyStartY + 'px'; isDraggingJoy = true; handleJoyMove(e); }
function handleJoyMove(e) { if (!isDraggingJoy) return; e.preventDefault(); let touch = e.touches[0]; let dxTouch = touch.clientX - joyStartX; let dyTouch = touch.clientY - joyStartY; let dist = Math.hypot(dxTouch, dyTouch); if (dist > maxJoyDist) { dxTouch = (dxTouch / dist) * maxJoyDist; dyTouch = (dyTouch / dist) * maxJoyDist; } joyStick.style.transform = `translate(calc(-50% + ${dxTouch}px), calc(-50% + ${dyTouch}px))`; joyX = dxTouch / maxJoyDist; joyY = dyTouch / maxJoyDist; }
function handleJoyEnd(e) { if(e.touches.length === 0) { isDraggingJoy = false; joyBase.style.display = 'none'; joyStick.style.transform = `translate(-50%, -50%)`; joyX = 0; joyY = 0; } }

// --- FUNZIONI DI UTILITA' ---
function updateBarsUI() { document.getElementById('hp-bar-fill').style.width = (Math.max(0, player.hp) / player.maxHp * 100) + '%'; if(player.maxShield > 0) { document.getElementById('shield-bar-fill').style.width = (Math.max(0, player.shield) / player.maxShield * 100) + '%'; } }
function updateWeaponsUI() { const ui = document.getElementById('weapons-ui'); ui.innerHTML = ''; player.weapons.forEach(w => { ui.innerHTML += `<div class="weapon-slot" style="color:${w.color}">${w.name} <span class="weapon-lvl">Lv.${w.level}</span></div>`; }); }
function showItemFeedback(text, color) { let el = document.createElement('div'); el.className = 'item-feedback'; el.innerHTML = text; el.style.color = color; el.style.left = (canvas.width/2 - 150) + 'px'; el.style.top = (canvas.height/2 - 80) + 'px'; el.style.width = "300px"; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); }
function isPositionFree(x, y, radius) { for (let r of rocks) { if (Math.hypot(x - r.x, y - r.y) < radius + r.size + 10) return false; } return true; }

// --- LOGICA DI PARTITA E COMBATTIMENTO ---
function startGame() {
    gameState = "PLAYING"; savePlayerName(); activePlayerName = savedName !== "" ? savedName : "Eroe"; sessionCrystals = 0; document.getElementById('crystal-count').innerText = 0;
    
    let amuletHTML = ""; 
    if (equippedItems.amuleto1) amuletHTML += EQUIP_DB.amuleto.find(x => x.id === equippedItems.amuleto1).icon;
    if (equippedItems.amuleto2) amuletHTML += " " + EQUIP_DB.amuleto.find(x => x.id === equippedItems.amuleto2).icon;
    document.getElementById('amulet-icon-ui').innerText = amuletHTML; document.getElementById('amulet-icon-ui').style.opacity = '1';
    
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('character-select').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'none'; document.getElementById('game-ui').style.display = 'block'; canvas.style.display = 'block';
    document.getElementById('joystick-zone').style.display = (controlMode === 'mobile') ? 'block' : 'none';
    
    let cLevel = charLevels[selectedCharId] || 1; let maxWeps = cLevel === 3 ? 3 : 2;
    rockTelegraphs = [];

    player = { x: 0, y: 0, size: 20, speed: 4, hp: 100, maxHp: 100, pickupRange: 80, weapons: [], maxWeapons: maxWeps, charLevel: cLevel, shield: 0, maxShield: 0, lastHitTimer: 0, iFrames: 0, hasOrbs: false, orbAngle: 0, orbTrail: [], miniMes: [], lastBossLevel: 0, charId: selectedCharId, hasRevived: false };
    enemies = []; bullets = []; beams = []; explosions = []; elementalTrails = []; enemyBullets = []; gems = []; rocks = []; chests = []; xp = 0; level = 1; xpNeeded = 15; frameCount = 0; keys = {}; paused = false; joyX = 0; joyY = 0;
    bossArena = { active: false, x: 0, y: 0, radius: 800 };
    
    for(let i = 0; i < 15; i++) { let valid = false; let attempts = 0; let rx, ry, rSize; while(!valid && attempts < 10) { let angle = Math.random() * Math.PI * 2; let dist = 300 + Math.random() * 1500; rx = Math.cos(angle) * dist; ry = Math.sin(angle) * dist; rSize = 25 + Math.random() * 20; valid = isPositionFree(rx, ry, rSize); attempts++; } if (valid) rocks.push({ x: rx, y: ry, size: rSize, hp: 30 }); }
    giveWeapon(WEAPONS_DB.pistola); updateBarsUI(); document.getElementById('lvl').innerText = level; document.getElementById('shield-ui').style.display = 'none'; 
    requestAnimationFrame(gameLoop);
}

function damagePlayer(amount) { 
    player.lastHitTimer = 0; 
    if (player.shield > 0) { player.shield -= amount; if (player.shield < 0) { player.hp += player.shield; player.shield = 0; } } else { player.hp -= amount; } 
    if(player.hp <= 0 && hasAmulet('amu_revive') && !player.hasRevived) {
        player.hp = player.maxHp * 0.5; player.hasRevived = true; showItemFeedback("🔥 FENICE!", "#ff4500");
        enemies.forEach(e => { if(Math.hypot(e.x-player.x, e.y-player.y) < 500) { e.hp -= 2000; if(e.hp<=0 && !e.dead) { e.dead=true; handleEnemyDeath(e, -1); } } }); 
        document.getElementById('amulet-icon-ui').style.opacity = '0.3';
    } else if (player.hp <= 0) { triggerGameOver(); }
    updateBarsUI(); 
}

function giveWeapon(weaponData) { player.weapons.push({ ...weaponData, level: 1, currentDamage: weaponData.baseDamage, currentFireRate: weaponData.fireRate, fireTimer: 0 }); updateWeaponsUI(); }

function handleEnemyDeath(e, ei) {
    gameStats.enemiesKilled++; 
    if (gameStats.enemiesKilled % 50 === 0) saveGameStats();

    if (e.type === 'miniboss') { 
        gameStats.bossesKilled++; saveGameStats();
        dailyMissions.bossesKilled++; saveDailyMissions();
        chests.push({ x: e.x, y: e.y, size: 35, isSpecial: true, isEpic: false, isBossChest: true }); 
        showItemFeedback("🏆 CASSA SUPREMA!", "gold"); 
        for(let c=0; c<15; c++) gems.push({ x: e.x + Math.random()*80-40, y: e.y + Math.random()*80-40, isCrystal: true }); 
        bossArena.active = false; 
    } 
    else { if (Math.random() < 0.02) { gems.push({ x: e.x, y: e.y, isCrystal: true }); } else { gems.push({ x: e.x, y: e.y, isSuper: false }); } } 
    if (ei > -1) enemies.splice(ei, 1);
}

function drawProjectile(b, camX, camY) {
    ctx.shadowBlur = 10; ctx.shadowColor = b.color; let px = b.x - camX; let py = b.y - camY;
    if (b.weaponId === 'razzo') { let s = b.size; ctx.fillStyle = b.color; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s/2, -s/2); ctx.lineTo(-s/2, s/2); ctx.fill(); ctx.restore(); } 
    else if (b.weaponId === 'bastone') { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); } 
    else if (b.weaponId === 'granata') { ctx.fillStyle = "#2a4d20"; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#eeddaa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py - b.size*0.8); ctx.lineTo(px + b.size, py - b.size*1.5); ctx.stroke(); } 
    else if (b.weaponId === 'freezer') { let s = b.size; ctx.fillStyle = b.color; ctx.save(); ctx.translate(px, py); ctx.rotate(frameCount*0.1); ctx.beginPath(); let inner=s/3; let outer=s; for(let i=0;i<8;i++){let rad=(i%2===0)?outer:inner;let a=i*Math.PI/4;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);} ctx.fill(); ctx.restore(); } 
    else if (b.weaponId === 'fucile' || b.weaponId === 'uzi' || b.weaponId === 'cerbottana') { ctx.strokeStyle = b.color; ctx.lineWidth = b.size; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - b.vx*1.5, py - b.vy*1.5); ctx.stroke(); } 
    else { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); }
    ctx.shadowBlur = 0;
}
function update() {
    frameCount++; let dx = 0; let dy = 0;
    if (controlMode === 'pc') { if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1; if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1; if (dx !== 0 && dy !== 0) { let len = Math.hypot(dx, dy); dx /= len; dy /= len; } } else { dx = joyX; dy = joyY; }
    let moveX = dx * player.speed; let moveY = dy * player.speed; let canMoveX = true; let canMoveY = true;
    
    // COLLISIONI MURI ARENA BOSS E SPAWN SASSI
    if (bossArena.active) {
        if (Math.hypot((player.x + moveX) - bossArena.x, player.y - bossArena.y) > bossArena.radius - player.size) canMoveX = false;
        if (Math.hypot(player.x - bossArena.x, (player.y + moveY) - bossArena.y) > bossArena.radius - player.size) canMoveY = false;
        
        if (frameCount % 40 === 0) { 
            let angle = Math.random() * Math.PI * 2;
            let dist = Math.random() * (bossArena.radius - 80);
            rockTelegraphs.push({ x: bossArena.x + Math.cos(angle)*dist, y: bossArena.y + Math.sin(angle)*dist, radius: 30, timer: 60 }); 
        }
    }
    
    for (let i = rockTelegraphs.length - 1; i >= 0; i--) {
        let rt = rockTelegraphs[i]; rt.timer--;
        if (rt.timer <= 0) {
            if (isPositionFree(rt.x, rt.y, rt.radius)) { rocks.push({ x: rt.x, y: rt.y, size: rt.radius, hp: 60, dead: false }); }
            rockTelegraphs.splice(i, 1);
        }
    }
    
    for (let r of rocks) { if (Math.hypot((player.x + moveX) - r.x, player.y - r.y) < player.size + r.size) canMoveX = false; if (Math.hypot(player.x - r.x, (player.y + moveY) - r.y) < player.size + r.size) canMoveY = false; }
    if (canMoveX) player.x += moveX; if (canMoveY) player.y += moveY;

    if (player.maxShield > 0) { player.lastHitTimer++; if (player.lastHitTimer > 180 && player.shield < player.maxShield) { player.shield = Math.min(player.maxShield, player.shield + 0.3); updateBarsUI(); } }
    if (player.iFrames > 0) player.iFrames--;

    if (player.hasOrbs) { player.orbAngle += 0.05; let orbDist = 100; let o1x = player.x + Math.cos(player.orbAngle)*orbDist; let o1y = player.y + Math.sin(player.orbAngle)*orbDist; let o2x = player.x + Math.cos(player.orbAngle + Math.PI)*orbDist; let o2y = player.y + Math.sin(player.orbAngle + Math.PI)*orbDist; if (frameCount % 4 === 0) { player.orbTrail.push({x: o1x, y: o1y, life: 60}); player.orbTrail.push({x: o2x, y: o2y, life: 60}); } player.orbTrail.forEach(t => { t.life--; enemies.forEach(e => { if (Math.hypot(e.x - t.x, e.y - t.y) < e.size + 10) { e.hp -= 0.6; e.hitTimer = 5; if(e.hp<=0 && !e.dead) { e.dead=true; handleEnemyDeath(e, -1); } } }); }); player.orbTrail = player.orbTrail.filter(t => t.life > 0); }

    player.miniMes.forEach((m, index) => { 
        let targetAngle = (index * Math.PI * 2) / Math.max(1, player.miniMes.length) + (frameCount * 0.02); 
        let tx = player.x + Math.cos(targetAngle) * 60; let ty = player.y + Math.sin(targetAngle) * 60; 
        m.x += (tx - m.x) * 0.1; m.y += (ty - m.y) * 0.1; 
        m.fireTimer++;
        if (m.fireTimer >= 35) { 
            let targets = enemies.filter(t => Math.hypot(t.x - m.x, t.y - m.y) <= 500); 
            if (targets.length > 0) { 
                if (m.fireTimer % 4 === 0) {
                    let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - m.x, curr.y - m.y) < Math.hypot(prev.x - m.x, prev.y - m.y) ? curr : prev); 
                    let angle = Math.atan2(closest.y - m.y, closest.x - m.x); 
                    bullets.push({ x: m.x, y: m.y, startX: m.x, startY: m.y, vx: Math.cos(angle)*18, vy: Math.sin(angle)*18, damage: 12, size: 6, color: "cyan", range: 500, weaponId: 'fucile' }); 
                    m.burstCount = (m.burstCount || 0) + 1;
                    if (m.burstCount >= 4) { m.fireTimer = 0; m.burstCount = 0; }
                }
            } else { m.fireTimer = 35; m.burstCount = 0; }
        }
    });

    let applyIce = hasAmulet('amu_ice');
    let applyFire = hasAmulet('amu_fire');

    player.weapons.forEach((w, index) => {
        w.fireTimer++;
        if (w.fireTimer >= w.currentFireRate) {
            
            if (w.id === 'bastone_veleno') {
                let pRadius = Math.min(350, w.range + (w.level * 15));
                explosions.push({x: player.x, y: player.y, radius: pRadius, damage: w.currentDamage, life: 15, maxLife: 15, type: 'poison'});
                w.fireTimer = 0;
                return; 
            }

            let targets = enemies.concat(rocks).filter(t => Math.hypot(t.x - player.x, t.y - player.y) <= w.range);
            if (targets.length > 0) {
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev);
                let angle = Math.atan2(closest.y - player.y, closest.x - player.x);
                
                let handOffsetX = 15; let handOffsetY = 0; 
                if (index === 0) handOffsetY = 15; 
                else if (index === 1) handOffsetY = -15; 
                else if (index === 2) { handOffsetX = 25; handOffsetY = 0; }

                let cosA = Math.cos(angle); let sinA = Math.sin(angle);
                let weaponBaseX = player.x + (handOffsetX * cosA - handOffsetY * sinA);
                let weaponBaseY = player.y + (handOffsetX * sinA + handOffsetY * cosA);
                let spawnX = weaponBaseX + (w.muzzleOffset * cosA); let spawnY = weaponBaseY + (w.muzzleOffset * sinA);

                if (w.id === 'laser') {
                    let numBeams = w.level >= 6 ? 3 : 1; let spread = 0.2; 
                    for (let i = 0; i < numBeams; i++) {
                        let beamAngle = angle; if (numBeams === 3) beamAngle = angle + (i - 1) * spread;
                        beams.push({ x: spawnX, y: spawnY, angle: beamAngle, range: w.range, color: w.color, life: 10, maxLife: 10 });
                        let endX = spawnX + Math.cos(beamAngle) * w.range; let endY = spawnY + Math.sin(beamAngle) * w.range;

                        enemies.forEach(e => {
                            if (e.hp > 0 && distToSegment(e.x, e.y, spawnX, spawnY, endX, endY) < e.size + 40) {
                                e.hp -= w.currentDamage; e.hitTimer = 5;
                                if (applyIce) { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.2; } 
                                if (applyFire) { e.burnTimer = 180; }
                                if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); }
                            }
                        });
                        rocks.forEach(r => { if (r.hp > 0 && distToSegment(r.x, r.y, spawnX, spawnY, endX, endY) < r.size + 20) { r.hp -= w.currentDamage; if(r.hp <= 0 && !r.dead){ r.dead=true; gems.push({ x: r.x, y: r.y, isSuper: true }); } } });
                    }
                } else {
                    bullets.push({ x: spawnX, y: spawnY, startX: spawnX, startY: spawnY, vx: cosA * w.speed, vy: sinA * w.speed, damage: w.currentDamage, size: w.bulletSize, color: w.color, range: w.range, weaponId: w.id, level: w.level, poisonDmg: w.poisonDamage || 0 });
                }
                w.fireTimer = 0;
            }
        }
    });

    beams.forEach(b => b.life--); beams = beams.filter(b => b.life > 0);

    for (let i = bullets.length - 1; i >= 0; i--) { 
        let b = bullets[i]; let oldX = b.x; let oldY = b.y; b.x += b.vx; b.y += b.vy; 
        
        if (frameCount % 3 === 0) { 
            if (applyIce) elementalTrails.push({ x: b.x, y: b.y, type: 'ice', radius: 12, life: 60, maxLife: 60 });
            if (applyFire) elementalTrails.push({ x: b.x, y: b.y, type: 'fire', radius: 12, life: 60, maxLife: 60 });
        }

        let outOfRange = Math.hypot(b.x - b.startX, b.y - b.startY) > b.range;
        let hitArenaWall = bossArena.active && Math.hypot(b.x - bossArena.x, b.y - bossArena.y) + b.size > bossArena.radius;

        if (outOfRange || hitArenaWall) { 
            if (b.weaponId === 'granata') explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'});
            else if (b.weaponId === 'freezer') explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: 0, life: 180, maxLife: 180, type: 'ice'});
            bullets.splice(i, 1); continue; 
        } 
        let hitRock = false;
        for (let ri = rocks.length - 1; ri >= 0; ri--) { 
            let r = rocks[ri]; 
            if (distToSegment(r.x, r.y, oldX, oldY, b.x, b.y) < r.size + b.size/2 + 5) { 
                if (b.weaponId === 'granata') { explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'}); } 
                else if (b.weaponId === 'freezer') { explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: 0, life: 180, maxLife: 180, type: 'ice'}); } 
                else { r.hp -= b.damage; if (r.hp <= 0 && !r.dead) { r.dead=true; gems.push({ x: r.x, y: r.y, isSuper: true }); } }
                bullets.splice(i, 1); hitRock = true; break; 
            } 
        } 
        if (hitRock) continue;
    }

    elementalTrails.forEach(t => {
        t.life--;
        if (t.life % 10 === 0) { 
            enemies.forEach(e => {
                if (!e.dead && Math.hypot(e.x - t.x, e.y - t.y) < t.radius + e.size) {
                    if (t.type === 'ice') { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.2; } else { e.burnTimer = 180; }
                }
            });
        }
    });
    elementalTrails = elementalTrails.filter(t => t.life > 0);

    explosions.forEach(exp => {
        if (exp.type === 'ice') {
            if (frameCount % 10 === 0 || exp.life === exp.maxLife) {
                enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.3; } });
            }
        } else if (exp.type === 'poison') {
            if (exp.life === exp.maxLife) { 
                enemies.forEach(e => {
                    if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) {
                        e.hp -= exp.damage; e.hitTimer = 5; e.poisonTimer = 30; e.poisonDmg = exp.damage; 
                        if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); }
                    }
                });
                rocks.forEach(r => { if (!r.dead && Math.hypot(r.x - exp.x, r.y - exp.y) < exp.radius + r.size) { r.hp -= exp.damage; if (r.hp <= 0 && !r.dead) { r.dead=true; gems.push({ x: r.x, y: r.y, isSuper: true }); } } });
            }
        } else {
            if (exp.life === exp.maxLife) { 
                enemies.forEach(e => {
                    if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) {
                        e.hp -= exp.damage; e.hitTimer = 5;
                        if (applyIce) { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.2; } 
                        if (applyFire) { e.burnTimer = 180; }
                        if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); }
                    }
                });
                rocks.forEach(r => { if (!r.dead && Math.hypot(r.x - exp.x, r.y - exp.y) < exp.radius + r.size) { r.hp -= exp.damage; if (r.hp <= 0 && !r.dead) { r.dead=true; gems.push({ x: r.x, y: r.y, isSuper: true }); } } });
            }
        }
        exp.life--;
    });
    explosions = explosions.filter(e => e.life > 0);
    
    let elmoDodge = getEquipStat('elmo');
    for (let i = enemyBullets.length - 1; i >= 0; i--) { 
        let b = enemyBullets[i]; let oldX = b.x; let oldY = b.y; b.x += b.vx; b.y += b.vy; 
        
        let hitArenaWall = bossArena.active && Math.hypot(b.x - bossArena.x, b.y - bossArena.y) > bossArena.radius;
        if (Math.hypot(b.x - player.x, b.y - player.y) > 1500 || hitArenaWall) { enemyBullets.splice(i, 1); continue; } 
        
        let hitRock = false; for (let r of rocks) { if (distToSegment(r.x, r.y, oldX, oldY, b.x, b.y) < r.size) { hitRock = true; break; } } 
        if(hitRock) { enemyBullets.splice(i, 1); continue; } 
        if (distToSegment(player.x, player.y, oldX, oldY, b.x, b.y) < player.size + 5) { 
            if (Math.random() < elmoDodge) { showItemFeedback("SCHIVATA!", "#00ffff"); } else { damagePlayer(b.damage); }
            enemyBullets.splice(i, 1); 
        } 
    }
    
    // Generazione Casse Base
    let normalChestsCount = chests.filter(c => !c.isSpecial && !c.isEpic).length;
    if (Math.random() < 0.0015 && normalChestsCount < 3) { let angle = Math.random() * Math.PI * 2; let dist = 500 + Math.random() * 1000; let cx = player.x + Math.cos(angle) * dist; let cy = player.y + Math.sin(angle) * dist; if(isPositionFree(cx, cy, 25)) chests.push({ x: cx, y: cy, size: 25, isSpecial: false, isEpic: false, isBossChest: false }); }
    
    // Generazione Cassa Epica (MOLTO PIU RARA) con 12 rocce in cerchio perfetto
    if (Math.random() < 0.00005) {
        let angle = Math.random() * Math.PI * 2; let dist = 800 + Math.random() * 1000; let cx = player.x + Math.cos(angle) * dist; let cy = player.y + Math.sin(angle) * dist; 
        if(isPositionFree(cx, cy, 150)) {
            chests.push({ x: cx, y: cy, size: 50, isEpic: true, isSpecial: false, isBossChest: false }); 
            for(let i=0; i<12; i++) { 
                let ra = i * (Math.PI * 2 / 12); 
                rocks.push({ x: cx + Math.cos(ra)*120, y: cy + Math.sin(ra)*120, size: 35, hp: 400, dead: false }); 
            } 
        }
    }

    for (let i = chests.length - 1; i >= 0; i--) { 
        let c = chests[i]; 
        
        // DESPAWN CASSE LONTANE (tranne il Boss)
        if (!c.isBossChest && Math.hypot(player.x - c.x, player.y - c.y) > 3000) {
            chests.splice(i, 1);
            continue;
        }

        if (Math.hypot(player.x - c.x, player.y - c.y) < player.size + c.size) { 
            chests.splice(i, 1); 
            if (c.isEpic) { showEpicChestModal(); }
            else if (c.isSpecial) { showBossRelicModal(); } 
            else { 
                let rand = Math.random(); 
                if (rand < 0.4) { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5); updateBarsUI(); showItemFeedback("✚ CURA", "#00ff00"); } 
                else if (rand < 0.7) { 
                    // BOMBA CORRETTA: Uccide i nemici!
                    let sd = Math.max(canvas.width, canvas.height); 
                    for(let k = enemies.length - 1; k >= 0; k--) {
                        let eTarget = enemies[k];
                        if(Math.hypot(eTarget.x - player.x, eTarget.y - player.y) < sd) { 
                            if (eTarget.type !== 'miniboss') eTarget.hp -= 10000; else eTarget.hp -= 500; 
                            eTarget.hitTimer = 5; 
                            if (eTarget.hp <= 0 && !eTarget.dead) { eTarget.dead = true; handleEnemyDeath(eTarget, k); }
                        } 
                    }
                    showItemFeedback("💣 BOMBA!", "#ff4500"); 
                } 
                else { showItemFeedback("⬆️ POTENZIAMENTO!", "#ffff00"); freeUpgrade(); } 
            } 
        } 
    }
    for (let i = rocks.length - 1; i >= 0; i--) { if(rocks[i].dead) { rocks.splice(i,1); } else if (Math.hypot(player.x - rocks[i].x, player.y - rocks[i].y) > 2000) rocks.splice(i, 1); }
    while(rocks.length < 15) { let valid = false; let attempts = 0; let rx, ry, rSize; while(!valid && attempts < 10) { let angle = Math.random() * Math.PI * 2; rx = player.x + Math.cos(angle) * (1000 + Math.random() * 500); ry = player.y + Math.sin(angle) * (1000 + Math.random() * 500); rSize = 25 + Math.random() * 20; valid = isPositionFree(rx, ry, rSize); attempts++; } if (valid) rocks.push({ x: rx, y: ry, size: rSize, hp: 30 }); }
    
    let spawnDelay = Math.max(30, 120 - (level * 10)); 
    if (bossArena.active) spawnDelay *= 5; 

    if (frameCount % spawnDelay === 0) { 
        let numToSpawn = 1 + Math.floor(level / 3); 
        for(let i = 0; i < numToSpawn; i++) { 
            let valid = false; let attempts = 0; let ex, ey; 
            while(!valid && attempts < 10) { let angle = Math.random() * Math.PI * 2; let radius = Math.max(canvas.width, canvas.height) / 1.5; ex = player.x + Math.cos(angle) * radius; ey = player.y + Math.sin(angle) * radius; valid = isPositionFree(ex, ey, 22); attempts++; } 
            if(valid) { 
                let type = 'melee'; let color = 'red'; let hp = 10 + (level * 5); let speed = 1.5 + Math.random(); let size = 12; 
                if (level >= 2 && Math.random() < 0.25) { type = 'shooter'; color = 'purple'; speed = 0.8; hp = hp * 0.8; } 
                else if (level >= 4 && Math.random() < 0.15) { type = 'tank'; color = 'darkred'; hp = hp * 2; speed = 0.6; size = 22; } 
                enemies.push({ x: ex, y: ey, hp: hp, maxHp: hp, speed: speed, originalSpeed: speed, size: size, type: type, color: color, fireTimer: 0, hitTimer: 0, frozenTimer: 0, burnTimer: 0, poisonTimer: 0, dead: false }); 
            } 
        } 
    }
    
    let corazzaDodge = getEquipStat('corazza');
    for (let ei = enemies.length - 1; ei >= 0; ei--) { 
        let e = enemies[ei]; 
        if (e.dead) { enemies.splice(ei, 1); continue; } 
        if (Math.hypot(player.x - e.x, player.y - e.y) > 2500) { enemies.splice(ei, 1); continue; } 
        
        if (bossArena.active && e.type === 'miniboss') {
            if (Math.hypot(e.x - bossArena.x, e.y - bossArena.y) > bossArena.radius - e.size) {
                let pullA = Math.atan2(e.y - bossArena.y, e.x - bossArena.x);
                e.x = bossArena.x + Math.cos(pullA) * (bossArena.radius - e.size);
                e.y = bossArena.y + Math.sin(pullA) * (bossArena.radius - e.size);
                if (e.state === 'dashing') { e.state = 'idle'; e.stateTimer = 0; }
            }
        }
        
        if (bossArena.active && e.type !== 'miniboss') {
            if (Math.hypot(e.x - bossArena.x, e.y - bossArena.y) < bossArena.radius + e.size) {
                let pushA = Math.atan2(e.y - bossArena.y, e.x - bossArena.x);
                e.x = bossArena.x + Math.cos(pushA) * (bossArena.radius + e.size); e.y = bossArena.y + Math.sin(pushA) * (bossArena.radius + e.size);
            }
        }
        
        for (let r of rocks) {
            if (!r.dead) {
                let distToRock = Math.hypot(e.x - r.x, e.y - r.y);
                if (distToRock < e.size + r.size) {
                    let pushA = Math.atan2(e.y - r.y, e.x - r.x); let overlap = (e.size + r.size) - distToRock;
                    e.x += Math.cos(pushA) * overlap; e.y += Math.sin(pushA) * overlap;
                }
            }
        }

        if (e.hitTimer > 0) e.hitTimer--;
        if (e.frozenTimer > 0) { e.frozenTimer--; if (e.frozenTimer <= 0) e.speed = e.originalSpeed; }
        if (e.burnTimer > 0) { e.burnTimer--; if (e.burnTimer % 30 === 0) { e.hp -= 10; e.hitTimer = 5; if(e.hp <= 0 && !e.dead) { e.dead=true; handleEnemyDeath(e, ei); continue; } } }
        if (e.poisonTimer > 0) { e.poisonTimer--; if (e.poisonTimer % 20 === 0) { e.hp -= e.poisonDmg; e.hitTimer = 5; if(e.hp <= 0 && !e.dead) { e.dead=true; handleEnemyDeath(e, ei); continue; } } }

        let angle = Math.atan2(player.y - e.y, player.x - e.x); 

        if (e.type === 'miniboss' && e.advanced) {
            e.stateTimer++;
            if (e.state === 'idle') {
                e.x += Math.cos(angle) * (e.speed * 0.6); e.y += Math.sin(angle) * (e.speed * 0.6);
                let attackDelay = Math.max(60, 150 - (e.phaseMultiplier * 20));
                if (e.stateTimer > attackDelay) { e.stateTimer = 0; e.state = Math.random() < 0.5 ? 'telegraph_dash' : 'telegraph_fire'; }
            } 
            else if (e.state === 'telegraph_dash') {
                if (e.stateTimer === 1) { e.targetX = player.x; e.targetY = player.y; } 
                let telegraphTime = Math.max(30, 70 - (e.phaseMultiplier * 10));
                if (e.stateTimer > telegraphTime) { e.stateTimer = 0; e.state = 'dashing'; }
            }
            else if (e.state === 'dashing') {
                let dashSpeed = 18 + (e.phaseMultiplier * 3);
                let dAngle = Math.atan2(e.targetY - e.y, e.targetX - e.x);
                e.x += Math.cos(dAngle) * dashSpeed; e.y += Math.sin(dAngle) * dashSpeed;
                if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) { damagePlayer(1.5); e.state = 'idle'; e.stateTimer = 0; }
                if (Math.hypot(e.targetX - e.x, e.targetY - e.y) < dashSpeed) { e.state = 'idle'; e.stateTimer = 0; }
            }
            else if (e.state === 'telegraph_fire') {
                if (e.stateTimer > 40) { e.stateTimer = 0; e.state = 'shooting'; e.shotsFired = 0; }
            }
            else if (e.state === 'shooting') {
                let totalShots = 3 + e.phaseMultiplier;
                if (e.stateTimer % 15 === 0) {
                    let shootA = Math.atan2(player.y - e.y, player.x - e.x);
                    enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(shootA)*8, vy: Math.sin(shootA)*8, damage: 20, isFireball: true });
                    e.shotsFired++;
                    if (e.shotsFired >= totalShots) { e.state = 'idle'; e.stateTimer = 0; }
                }
            }
        } 
        else {
            e.x += Math.cos(angle) * e.speed; e.y += Math.sin(angle) * e.speed; 
            if (e.type === 'shooter') { e.fireTimer++; if (e.fireTimer >= 100) { enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle)*5, vy: Math.sin(angle)*5, damage: 10 }); e.fireTimer = 0; } } 
        }

        if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) { 
            if (player.iFrames <= 0) { if (Math.random() < corazzaDodge) { showItemFeedback("SCHIVATA!", "#00ff00"); player.iFrames = 20; } else { damagePlayer(1); player.iFrames = 10; } }
        } 
        
        // --- IL BLOCCO FONDAMENTALE DELLE COLLISIONI PROIETTILI - NEMICI ---
        for (let bi = bullets.length - 1; bi >= 0; bi--) { 
            let b = bullets[bi]; 
            if (distToSegment(e.x, e.y, b.x - b.vx, b.y - b.vy, b.x, b.y) < e.size + b.size + 35) { 
                if (b.weaponId === 'granata') { explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'}); } 
                else if (b.weaponId === 'freezer') { explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: 0, life: 180, maxLife: 180, type: 'ice'}); } 
                else if (b.weaponId === 'cerbottana') { e.hp -= b.damage; e.hitTimer = 5; e.poisonTimer = 300; e.poisonDmg = b.poisonDmg + (b.level * 2); }
                else { e.hp -= b.damage; e.hitTimer = 5; }
                bullets.splice(bi, 1); 
            } 
        } 
        if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, ei); } 
    }

    for (let gi = gems.length - 1; gi >= 0; gi--) { 
        let g = gems[gi]; if (Math.hypot(player.x - g.x, player.y - g.y) > 2500) { gems.splice(gi, 1); continue; } 
        let dist = Math.hypot(player.x - g.x, player.y - g.y); 
        if (dist < player.pickupRange) { let angle = Math.atan2(player.y - g.y, player.x - g.x); g.x += Math.cos(angle) * 10; g.y += Math.sin(angle) * 10; } 
        if (dist < player.size) { 
            if (g.isCrystal) { 
                totalCrystals++; sessionCrystals++; 
                localStorage.setItem('survivorCrystals', totalCrystals); 
                document.getElementById('crystal-count').innerText = sessionCrystals; 
                showItemFeedback("+1 💎", "#bf00ff"); 
            } else { 
                xp += g.isSuper ? 3 : 1; 
            }
            gems.splice(gi, 1); 
        } 
    }

    document.getElementById('xp-bar').style.width = Math.min((xp / xpNeeded * 100), 100) + '%';
    if (xp >= xpNeeded && !paused) { levelUp(); }
}

function draw() {
    let zoom = window.innerWidth < 768 ? 0.6 : 1; 
    let viewW = canvas.width / zoom; let viewH = canvas.height / zoom;
    let camX = player.x - viewW / 2; let camY = player.y - viewH / 2;

    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(zoom, zoom); 

    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; let gridSize = 100; let offsetX = camX % gridSize; let offsetY = camY % gridSize; 
    for(let x = -offsetX; x < viewW; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, viewH); ctx.stroke(); } 
    for(let y = -offsetY; y < viewH; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(viewW, y); ctx.stroke(); }
    
    if (bossArena.active) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.6)"; ctx.lineWidth = 10; ctx.setLineDash([20, 15]);
        ctx.beginPath(); ctx.arc(bossArena.x - camX, bossArena.y - camY, bossArena.radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "rgba(100, 0, 0, 0.1)"; ctx.fill();
    }

    rockTelegraphs.forEach(rt => {
        ctx.strokeStyle = "red"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(rt.x - camX, rt.y - camY, rt.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; ctx.fill();
        ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "white";
        ctx.fillText("⚠️", rt.x - camX, rt.y - camY);
    });

    elementalTrails.forEach(t => { let alpha = t.life / t.maxLife; ctx.fillStyle = t.type === 'ice' ? `rgba(0, 255, 255, ${alpha * 0.4})` : `rgba(255, 100, 0, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(t.x - camX, t.y - camY, t.radius, 0, Math.PI*2); ctx.fill(); });
    ctx.fillStyle = '#666'; ctx.strokeStyle = '#444'; ctx.lineWidth = 4; rocks.forEach(r => { ctx.beginPath(); ctx.arc(r.x - camX, r.y - camY, r.size, 0, Math.PI*2); ctx.fill(); ctx.stroke(); });
    
    explosions.forEach(exp => { 
        let alpha = exp.life / exp.maxLife; 
        if(exp.type === 'ice') { ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = `rgba(100, 255, 255, ${alpha})`; ctx.lineWidth = 2; ctx.stroke(); } 
        else if(exp.type === 'poison') { ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = `rgba(0, 200, 0, ${alpha})`; ctx.lineWidth = 3; ctx.stroke(); } 
        else { ctx.fillStyle = `rgba(255, 80, 0, ${alpha * 0.5})`; ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`; ctx.lineWidth = 3; ctx.stroke(); }
    });

    chests.forEach(c => { 
        let chestWidth = c.size * 2.8; let chestHeight = c.size * 1.8; let drawX = c.x - camX - (chestWidth / 2); let drawY = c.y - camY - (chestHeight / 2); 
        if (c.isSpecial) { 
            ctx.shadowBlur = 30; ctx.shadowColor = 'red'; ctx.fillStyle = '#800000'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); 
            ctx.fillStyle = '#ffaa00'; ctx.fillRect(drawX - 5, drawY - 5, chestWidth + 10, 10); ctx.fillRect(drawX - 5, drawY + chestHeight - 5, chestWidth + 10, 10);
            ctx.fillStyle = 'gold'; ctx.fillRect(drawX + chestWidth/2 - 15, drawY + chestHeight/2 - 15, 30, 30); ctx.shadowBlur = 0; 
        } else if (c.isEpic) {
            if(chestEpicImg.complete && chestEpicImg.naturalWidth > 0) { ctx.drawImage(chestEpicImg, drawX, drawY, chestWidth, chestHeight); }
            else { ctx.fillStyle = '#bf00ff'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); ctx.fillStyle = 'gold'; ctx.fillRect(drawX + chestWidth/2 - 4, drawY + chestHeight/2 - 6, 8, 12); }
        } else if(chestImg.complete && chestImg.naturalWidth > 0) { ctx.drawImage(chestImg, drawX, drawY, chestWidth, chestHeight); } 
        else { ctx.fillStyle = '#8B4513'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); ctx.fillStyle = '#3a1c05'; ctx.fillRect(drawX, drawY + chestHeight/2 - 4, chestWidth, 8); ctx.fillStyle = 'gold'; ctx.fillRect(drawX + chestWidth/2 - 4, drawY + chestHeight/2 - 6, 8, 12); } 
    });

    if(player.hasOrbs) { let orbDist = 100; player.orbTrail.forEach(t => { ctx.fillStyle = `rgba(255, 255, 255, ${t.life/60})`; ctx.beginPath(); ctx.arc(t.x - camX, t.y - camY, 8, 0, Math.PI*2); ctx.fill(); }); let o1x = player.x + Math.cos(player.orbAngle)*orbDist; let o1y = player.y + Math.sin(player.orbAngle)*orbDist; let o2x = player.x + Math.cos(player.orbAngle + Math.PI)*orbDist; let o2y = player.y + Math.sin(player.orbAngle + Math.PI)*orbDist; ctx.fillStyle = 'white'; ctx.shadowBlur = 10; ctx.shadowColor = 'white'; ctx.beginPath(); ctx.arc(o1x - camX, o1y - camY, 5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(o2x - camX, o2y - camY, 5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
    
    player.miniMes.forEach(m => { let cx = m.x - camX; let cy = m.y - camY; ctx.fillStyle = '#00aaaa'; ctx.fillRect(cx - 8, cy - 8, 16, 20); ctx.beginPath(); ctx.arc(cx, cy - 10, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(cx, cy - 10, 4, 0, Math.PI*2); ctx.fill(); });
    
    gems.forEach(g => { 
        if (g.isCrystal) { ctx.fillStyle = '#bf00ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#bf00ff'; let dx = g.x - camX; let dy = g.y - camY; ctx.beginPath(); ctx.moveTo(dx, dy - 10); ctx.lineTo(dx + 8, dy); ctx.lineTo(dx, dy + 10); ctx.lineTo(dx - 8, dy); ctx.fill(); ctx.shadowBlur = 0; } 
        else { ctx.fillStyle = g.isSuper ? '#ffa500' : '#00ffff'; ctx.beginPath(); ctx.arc(g.x - camX, g.y - camY, g.isSuper ? 8 : 4, 0, Math.PI*2); ctx.fill(); }
    });

    enemyBullets.forEach(b => { 
        if (b.isFireball) {
            ctx.fillStyle = '#ff4500'; ctx.shadowBlur = 15; ctx.shadowColor = 'red';
            ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 12, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = 'yellow'; ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 6, 0, Math.PI*2); ctx.fill(); 
        } else {
            ctx.fillStyle = '#ff00ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff'; 
            ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 6, 0, Math.PI*2); ctx.fill(); 
        }
    }); 
    ctx.shadowBlur = 0;

    bullets.forEach(b => { drawProjectile(b, camX, camY); });
    beams.forEach(b => { ctx.save(); let alpha = b.life / b.maxLife; ctx.globalAlpha = alpha; ctx.strokeStyle = b.color; ctx.lineWidth = 15 * alpha; ctx.lineCap = "round"; ctx.shadowBlur = 20; ctx.shadowColor = b.color; ctx.beginPath(); ctx.moveTo(b.x - camX, b.y - camY); ctx.lineTo(b.x - camX + Math.cos(b.angle)*b.range, b.y - camY + Math.sin(b.angle)*b.range); ctx.stroke(); ctx.strokeStyle = "white"; ctx.lineWidth = 5 * alpha; ctx.stroke(); ctx.restore(); });

    enemies.forEach(e => { 
        let bx = e.x - camX; let by = e.y - camY; 
        let currentFill = e.color; 
        if (e.hitTimer > 0) currentFill = "white"; 
        else if (e.frozenTimer > 0) currentFill = "#aaddff"; 
        else if (e.poisonTimer > 0) currentFill = "#800080"; 
        else if (e.burnTimer > 0) currentFill = "#ff6600";
        
        let armColor = '#8b0000'; if(e.type === 'miniboss') armColor = '#b8860b'; else if(e.type === 'tank') armColor = '#5a0000'; else if(e.type === 'shooter') armColor = '#4b0082'; 
        if(e.type === 'miniboss') { ctx.shadowBlur = 20; ctx.shadowColor = 'gold'; } 
        let armOffset = Math.sin(frameCount * 0.05 + e.x) * (e.size * 0.5); let bodyW = e.size * 0.8; let bodyH = e.size * 1.2; let armW = e.size * 1.0; let armH = e.size * 1.8; 
        ctx.fillStyle = armColor; ctx.fillRect(bx - bodyW/2 - armW + 2, by - bodyH/2 + armOffset, armW, armH); ctx.fillRect(bx + bodyW/2 - 2, by - bodyH/2 - armOffset, armW, armH); 
        if(e.type === 'shooter') { ctx.fillStyle = '#555'; let handY = by - bodyH/2 - armOffset + armH - 4; ctx.fillRect(bx + bodyW/2 + armW/2, handY, e.size*1.5, 5); ctx.fillRect(bx + bodyW/2 + armW/2, handY, 5, 10); } 
        ctx.fillStyle = currentFill; ctx.fillRect(bx - bodyW/2, by - bodyH/2, bodyW, bodyH); ctx.beginPath(); ctx.arc(bx, by - bodyH/2 - e.size*0.3, e.size * 0.9, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; 
        if(e.type === 'miniboss') { ctx.fillStyle = 'black'; ctx.fillRect(bx - 40, by - e.size*2.5, 80, 8); ctx.fillStyle = 'red'; ctx.fillRect(bx - 40, by - e.size*2.5, 80 * (Math.max(0, e.hp)/e.maxHp), 8); } 

        if (e.type === 'miniboss' && e.advanced && e.state === 'telegraph_dash') {
            let tx = e.targetX - camX; let ty = e.targetY - camY;
            ctx.strokeStyle = "rgba(255, 0, 0, 0.8)"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(tx, ty, e.size, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx - 20, ty); ctx.lineTo(tx + 20, ty); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx, ty - 20); ctx.lineTo(tx, ty + 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
        }
    });

    let screenCenterX = viewW / 2; let screenCenterY = viewH / 2;
    
    player.weapons.forEach((w, index) => {
        let angle = 0;
        if (w.id === 'bastone_veleno') {
            angle = -Math.PI / 2; 
            if (w.fireTimer < 20) { angle = 0 - (Math.PI / 2) * (w.fireTimer / 20); }
        } else {
            let targets = enemies.concat(rocks).filter(t => Math.hypot(t.x - player.x, t.y - player.y) <= w.range);
            if (targets.length > 0) { 
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev); 
                angle = Math.atan2(closest.y - player.y, closest.x - player.x); 
            }
        }
        
        ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle); 
        
        let handOffsetX = 15; let handOffsetY = 0; 
        if (index === 0) handOffsetY = 15; 
        else if (index === 1) handOffsetY = -15; 
        else if (index === 2) { handOffsetX = 25; handOffsetY = 0; }
        
        ctx.translate(handOffsetX, handOffsetY); 
        if (Math.abs(angle) > Math.PI / 2 && w.id !== 'bastone_veleno') { ctx.scale(1, -1); }
        if (WEAPON_MODELS[w.id]) { WEAPON_MODELS[w.id](ctx, w.weaponSize, w.color); } ctx.restore();
    });

    if (player.iFrames > 0 && frameCount % 4 < 2) { ctx.globalAlpha = 0.3; } 
    if (player.shield > 0) { ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY, player.size + 10, 0, Math.PI*2); ctx.fillStyle = 'rgba(0, 150, 255, 0.3)'; ctx.fill(); }
    
    let pBodyW = player.size * 1.2; let pBodyH = player.size * 1.8;
    let eqColors = { '1': '#8B4513', '2': '#aaaaaa', '3': '#00ffff' }; 
    let eColor = equippedItems.elmo ? eqColors[equippedItems.elmo.split('_')[1]] : null;
    let cColor = equippedItems.corazza ? eqColors[equippedItems.corazza.split('_')[1]] : null;

    ctx.fillStyle = '#00ff00'; 
    if (player.charId === 0) { ctx.fillRect(screenCenterX - pBodyW/2, screenCenterY - pBodyH/2 + 5, pBodyW, pBodyH); } else if (player.charId === 1) { ctx.beginPath(); ctx.moveTo(screenCenterX - pBodyW, screenCenterY - pBodyH/2 + 5); ctx.lineTo(screenCenterX + pBodyW, screenCenterY - pBodyH/2 + 5); ctx.lineTo(screenCenterX, screenCenterY + pBodyH/2 + 5); ctx.fill(); } else if (player.charId === 2) { ctx.beginPath(); ctx.moveTo(screenCenterX, screenCenterY - pBodyH/2 + 5); ctx.lineTo(screenCenterX + pBodyW, screenCenterY + pBodyH/2 + 5); ctx.lineTo(screenCenterX - pBodyW, screenCenterY + pBodyH/2 + 5); ctx.fill(); }
    
    if (cColor) { ctx.fillStyle = cColor; ctx.fillRect(screenCenterX - pBodyW*0.6, screenCenterY - pBodyH*0.2, pBodyW*1.2, pBodyH*0.6); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(screenCenterX - pBodyW*0.6, screenCenterY - pBodyH*0.2, pBodyW*1.2, pBodyH*0.6); }

    ctx.fillStyle = '#00ff00'; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2, player.size * 0.6, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY, player.pickupRange, 0, Math.PI*2); ctx.stroke();
    
    if (eColor) { ctx.fillStyle = eColor; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2 - 2, player.size * 0.65, Math.PI, Math.PI*2); ctx.fill(); ctx.fillRect(screenCenterX - player.size*0.65, screenCenterY - pBodyH/2 - 2, player.size*1.3, 6); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2 - 2, player.size * 0.65, Math.PI, Math.PI*2); ctx.stroke(); }
    ctx.globalAlpha = 1;

    ctx.font = "bold 20px Arial"; ctx.fillStyle = "white"; ctx.shadowBlur = 5; ctx.shadowColor = "black"; ctx.fillText(activePlayerName, screenCenterX, screenCenterY - pBodyH/2 - player.size - 25); ctx.shadowBlur = 0;

    let normalChests = chests.filter(c => !c.isSpecial && !c.isEpic && !c.isBossChest);
    if (normalChests.length > 0) { let closestChest = normalChests.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev); let dist = Math.hypot(closestChest.x - player.x, closestChest.y - player.y); if (dist > 200 && dist < 1500) { let angle = Math.atan2(closestChest.y - player.y, closestChest.x - player.x); ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle); ctx.fillStyle = 'gold'; ctx.shadowColor = 'yellow'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(60, -15); ctx.lineTo(60, 15); ctx.fill(); ctx.restore(); } }
    
    let bossTarget = enemies.find(e => e.type === 'miniboss'); 
    let droppedBossChest = chests.find(c => c.isBossChest);
    
    if (bossTarget || droppedBossChest) {
        let targetX = bossTarget ? bossTarget.x : droppedBossChest.x; let targetY = bossTarget ? bossTarget.y : droppedBossChest.y;
        let dist = Math.hypot(targetX - player.x, targetY - player.y);
        
        if (dist > 150) { 
            let angle = Math.atan2(targetY - player.y, targetX - player.x);
            ctx.save(); ctx.translate(screenCenterX, screenCenterY); 
            let cx = Math.cos(angle) * 110; let cy = Math.sin(angle) * 110; 
            
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); 
            ctx.fillStyle = droppedBossChest ? '#ff00ff' : '#ff0000'; 
            ctx.shadowColor = droppedBossChest ? '#ff00ff' : 'red'; 
            ctx.shadowBlur = 20; 
            ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(0, -15); ctx.lineTo(0, 15); ctx.fill(); 
            ctx.restore(); 
            
            ctx.font = "28px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; 
            ctx.shadowColor = droppedBossChest ? '#ff00ff' : "red"; ctx.shadowBlur = 15; 
            ctx.fillText(droppedBossChest ? "💎" : "💀", cx - Math.cos(angle)*25, cy - Math.sin(angle)*25); 
            ctx.restore(); 
        } 
    }
    
    ctx.restore(); 
}
function gameLoop() { if (gameState !== "PLAYING") return; if (!paused) { update(); draw(); } requestAnimationFrame(gameLoop); }
