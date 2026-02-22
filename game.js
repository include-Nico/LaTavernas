const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

let gameState = "MENU"; 
let paused = false; let frameCount = 0;
let maxLevelReached = parseInt(localStorage.getItem('survivorMaxLevel')) || 1;
let selectedCharId = 0;
let controlMode = 'pc'; 

// --- NOME GIOCATORE ---
let savedName = localStorage.getItem('survivorPlayerName') || "";
let activePlayerName = "Eroe";

let chestImg = new Image(); chestImg.src = 'chest.png';

let joyX = 0, joyY = 0;
let isDraggingJoy = false;
let joyBaseRect;
const maxJoyDist = 55; 
const joyZone = document.getElementById('joystick-zone');
const joyStick = document.getElementById('joystick-stick');

let keys = {}; 
window.addEventListener('keydown', e => {
    let key = e.key.toLowerCase();
    keys[key] = true;
    if (key === 'p' || e.key === 'Escape') togglePause();
}); 
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const WEAPONS_DB = {
    pistola: { id: 'pistola', name: "Pistola", icon: "🔫", baseDamage: 12, fireRate: 45, range: 600, speed: 12, size: 5, color: "yellow" },
    fucile:  { id: 'fucile',  name: "Fucile",  icon: "💥", baseDamage: 8,  fireRate: 15, range: 800, speed: 20, size: 3, color: "white" },
    bastone: { id: 'bastone', name: "Bastone", icon: "🪄", baseDamage: 30, fireRate: 80, range: 1200, speed: 7, size: 12, color: "#ff3300" },
    laser:   { id: 'laser',   name: "Blaster", icon: "⚡", baseDamage: 18, fireRate: 25, range: 900, speed: 25, size: 4, color: "cyan" },
    granata: { id: 'granata', name: "Granate", icon: "💣", baseDamage: 50, fireRate: 90, range: 400, speed: 8,  size: 8, color: "gray" },
    razzo:   { id: 'razzo',   name: "Razzo",   icon: "🚀", baseDamage: 60, fireRate: 100,range: 1000,speed: 10, size: 9, color: "orange" },
    freezer: { id: 'freezer', name: "Freezer", icon: "❄️", baseDamage: 20, fireRate: 35, range: 600, speed: 15, size: 6, color: "#aaddff" }
};

const CHARACTERS = [
    { id: 0, name: "Recluta", desc: "Corpo Quadrato", reqLevel: 1, weapons: ['pistola', 'fucile', 'bastone'] },
    { id: 1, name: "Gelataio", desc: "Corpo a Cono", reqLevel: 10, weapons: ['pistola', 'laser', 'granata'] },
    { id: 2, name: "Punta", desc: "Corpo Piramidale", reqLevel: 15, weapons: ['pistola', 'razzo', 'freezer'] }
];

let player = {};
let enemies = []; let bullets = []; let enemyBullets = []; let gems = []; let rocks = []; let chests = [];
let xp = 0; let xpNeeded = 15; let level = 1; let currentChoices = []; let pendingWeapon = null;

// --- GESTIONE NOME ---
function savePlayerName() {
    let inputVal = document.getElementById('player-name-input').value.trim();
    localStorage.setItem('survivorPlayerName', inputVal);
    savedName = inputVal;
}

// --- GESTIONE PAUSA ---
function togglePause() {
    if (gameState !== "PLAYING") return;
    let lvlModal = document.getElementById('levelup-modal').style.display;
    let bossModal = document.getElementById('boss-modal').style.display;
    let repModal = document.getElementById('replace-modal').style.display;
    if (lvlModal === 'block' || bossModal === 'block' || repModal === 'block') return;

    let pauseModal = document.getElementById('pause-modal');
    if (paused) { paused = false; pauseModal.style.display = 'none'; } 
    else { paused = true; pauseModal.style.display = 'block'; }
}

function surrender() {
    document.getElementById('pause-modal').style.display = 'none';
    player.hp = 0; updateBarsUI(); triggerGameOver();
}

function toggleControls() {
    let btn = document.getElementById('btn-controls');
    if (controlMode === 'pc') { controlMode = 'mobile'; btn.innerText = "📱 CONTROLLI: TELEFONO"; } 
    else { controlMode = 'pc'; btn.innerText = "🕹️ CONTROLLI: PC"; }
}

function showMenu() {
    gameState = "MENU";
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('character-select').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'none';
    canvas.style.display = 'none';
    document.getElementById('player-name-input').value = savedName; // Carica il nome salvato
}
function backToMenu() { showMenu(); }

function showCharacterSelect() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('character-select').style.display = 'flex';
    const container = document.getElementById('char-cards-container');
    container.innerHTML = '';
    
    CHARACTERS.forEach(char => {
        let isUnlocked = maxLevelReached >= char.reqLevel;
        let isSelected = selectedCharId === char.id;
        let wIcons = char.weapons.map(w => WEAPONS_DB[w].icon).join(" ");
        
        let card = document.createElement('div');
        card.className = `char-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <h3>${char.name}</h3>
            <p style="color:#aaa; font-size:14px;">${char.desc}</p>
            <div style="font-size: 30px; margin: 10px 0;">${wIcons}</div>
            <p style="color:#00ffff; font-size:12px;">Armi disponibili</p>
            ${!isUnlocked ? `<div class="lock-icon">🔒<br><span style="font-size:14px;">Liv. ${char.reqLevel}</span></div>` : ''}
        `;
        if (isUnlocked) { card.onclick = () => { selectedCharId = char.id; showCharacterSelect(); }; }
        container.appendChild(card);
    });
}

function startGame() {
    gameState = "PLAYING";
    savePlayerName(); // Salva se l'utente non ha cliccato fuori
    activePlayerName = savedName !== "" ? savedName : "Eroe";

    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('character-select').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    canvas.style.display = 'block';
    
    document.getElementById('joystick-zone').style.display = (controlMode === 'mobile') ? 'flex' : 'none';

    player = { 
        x: 0, y: 0, size: 20, speed: 4, hp: 100, maxHp: 100, pickupRange: 80, weapons: [],
        shield: 0, maxShield: 0, lastHitTimer: 0, hasOrbs: false, orbAngle: 0, orbTrail: [], miniMes: [], lastBossLevel: 0, charId: selectedCharId
    };
    enemies = []; bullets = []; enemyBullets = []; gems = []; rocks = []; chests = [];
    xp = 0; level = 1; xpNeeded = 15; frameCount = 0; keys = {}; paused = false; joyX = 0; joyY = 0;

    for(let i = 0; i < 15; i++) { 
        let valid = false; let attempts = 0; let rx, ry, rSize;
        while(!valid && attempts < 10) {
            let angle = Math.random() * Math.PI * 2; let dist = 300 + Math.random() * 1500; 
            rx = Math.cos(angle) * dist; ry = Math.sin(angle) * dist; rSize = 25 + Math.random() * 20;
            valid = isPositionFree(rx, ry, rSize); attempts++;
        }
        if (valid) rocks.push({ x: rx, y: ry, size: rSize, hp: 30 });
    }

    giveWeapon(WEAPONS_DB.pistola); 
    updateBarsUI(); document.getElementById('lvl').innerText = level; document.getElementById('shield-ui').style.display = 'none';
    requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
    paused = true; gameState = "GAMEOVER";
    if (level > maxLevelReached) { maxLevelReached = level; localStorage.setItem('survivorMaxLevel', maxLevelReached); }
    document.getElementById('final-level').innerText = level;
    document.getElementById('game-ui').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'flex';
}

joyZone.addEventListener('touchstart', handleJoyStart, {passive: false});
joyZone.addEventListener('touchmove', handleJoyMove, {passive: false});
joyZone.addEventListener('touchend', handleJoyEnd);

function handleJoyStart(e) { e.preventDefault(); joyBaseRect = document.getElementById('joystick-base').getBoundingClientRect(); isDraggingJoy = true; handleJoyMove(e); }
function handleJoyMove(e) {
    if (!isDraggingJoy) return;
    e.preventDefault(); let touch = e.touches[0];
    let centerX = joyBaseRect.left + joyBaseRect.width / 2; let centerY = joyBaseRect.top + joyBaseRect.height / 2;
    let dx = touch.clientX - centerX; let dy = touch.clientY - centerY; let dist = Math.hypot(dx, dy);
    if (dist > maxJoyDist) { dx = (dx / dist) * maxJoyDist; dy = (dy / dist) * maxJoyDist; }
    joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joyX = dx / maxJoyDist; joyY = dy / maxJoyDist;
}
function handleJoyEnd(e) { isDraggingJoy = false; joyStick.style.transform = `translate(-50%, -50%)`; joyX = 0; joyY = 0; }

function updateBarsUI() { 
    document.getElementById('hp-bar-fill').style.width = (Math.max(0, player.hp) / player.maxHp * 100) + '%'; 
    if(player.maxShield > 0) { document.getElementById('shield-bar-fill').style.width = (Math.max(0, player.shield) / player.maxShield * 100) + '%'; }
}
function updateWeaponsUI() {
    const ui = document.getElementById('weapons-ui'); ui.innerHTML = '';
    player.weapons.forEach(w => { ui.innerHTML += `<div class="weapon-slot">${w.icon} ${w.name} <span class="weapon-lvl">Lv.${w.level}</span></div>`; });
}
function damagePlayer(amount) {
    player.lastHitTimer = 0; 
    if (player.shield > 0) { player.shield -= amount; if (player.shield < 0) { player.hp += player.shield; player.shield = 0; } } 
    else { player.hp -= amount; }
    updateBarsUI(); if(player.hp <= 0) triggerGameOver();
}
function giveWeapon(weaponData) { player.weapons.push({ ...weaponData, level: 1, currentDamage: weaponData.baseDamage, currentFireRate: weaponData.fireRate, fireTimer: 0 }); updateWeaponsUI(); }
function isPositionFree(x, y, radius) { for (let r of rocks) { if (Math.hypot(x - r.x, y - r.y) < radius + r.size + 10) return false; } return true; }
function showItemFeedback(text, color) {
    let el = document.createElement('div'); el.className = 'item-feedback'; el.innerHTML = text; el.style.color = color;
    el.style.left = (canvas.width/2 - 150) + 'px'; el.style.top = (canvas.height/2 - 80) + 'px'; el.style.width = "300px";
    document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
}

function gameLoop() {
    if (gameState !== "PLAYING") return;
    if (!paused) { update(); draw(); }
    requestAnimationFrame(gameLoop);
}

function update() {
    frameCount++;

    let dx = 0; let dy = 0;
    if (controlMode === 'pc') {
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
        if (dx !== 0 && dy !== 0) { let len = Math.hypot(dx, dy); dx /= len; dy /= len; }
    } else {
        dx = joyX; dy = joyY;
    }

    let moveX = dx * player.speed; let moveY = dy * player.speed;
    let canMoveX = true; let canMoveY = true;
    for (let r of rocks) {
        if (Math.hypot((player.x + moveX) - r.x, player.y - r.y) < player.size + r.size) canMoveX = false;
        if (Math.hypot(player.x - r.x, (player.y + moveY) - r.y) < player.size + r.size) canMoveY = false;
    }
    if (canMoveX) player.x += moveX; if (canMoveY) player.y += moveY;

    if (player.maxShield > 0) {
        player.lastHitTimer++;
        if (player.lastHitTimer > 180 && player.shield < player.maxShield) { player.shield = Math.min(player.maxShield, player.shield + 0.3); updateBarsUI(); }
    }

    if (player.hasOrbs) {
        player.orbAngle += 0.05; let orbDist = 100;
        let o1x = player.x + Math.cos(player.orbAngle)*orbDist; let o1y = player.y + Math.sin(player.orbAngle)*orbDist;
        let o2x = player.x + Math.cos(player.orbAngle + Math.PI)*orbDist; let o2y = player.y + Math.sin(player.orbAngle + Math.PI)*orbDist;
        if (frameCount % 4 === 0) { player.orbTrail.push({x: o1x, y: o1y, life: 60}); player.orbTrail.push({x: o2x, y: o2y, life: 60}); }
        player.orbTrail.forEach(t => { t.life--; enemies.forEach(e => { if (Math.hypot(e.x - t.x, e.y - t.y) < e.size + 10) e.hp -= 0.6; }); });
        player.orbTrail = player.orbTrail.filter(t => t.life > 0); 
    }

    player.miniMes.forEach((m, index) => {
        let targetAngle = (index * Math.PI * 2) / Math.max(1, player.miniMes.length) + (frameCount * 0.02);
        let tx = player.x + Math.cos(targetAngle) * 60; let ty = player.y + Math.sin(targetAngle) * 60;
        m.x += (tx - m.x) * 0.1; m.y += (ty - m.y) * 0.1; 
        m.fireTimer++;
        if (m.fireTimer >= 40) {
            let targets = enemies.filter(t => Math.hypot(t.x - m.x, t.y - m.y) <= 400);
            if (targets.length > 0) {
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - m.x, curr.y - m.y) < Math.hypot(prev.x - m.x, prev.y - m.y) ? curr : prev);
                let angle = Math.atan2(closest.y - m.y, closest.x - m.x);
                bullets.push({ x: m.x, y: m.y, startX: m.x, startY: m.y, vx: Math.cos(angle)*15, vy: Math.sin(angle)*15, damage: 8, size: 3, color: "cyan", range: 400 });
                m.fireTimer = 0;
            }
        }
        enemies.forEach(e => { if (Math.hypot(e.x - m.x, e.y - m.y) < e.size + 10) m.hp -= 1; });
        enemyBullets.forEach((b, bi) => { if (Math.hypot(b.x - m.x, b.y - m.y) < 15) { m.hp -= b.damage; enemyBullets.splice(bi, 1); } });
    });
    player.miniMes = player.miniMes.filter(m => m.hp > 0); 

    player.weapons.forEach((weapon, index) => {
        weapon.fireTimer++;
        if (weapon.fireTimer >= weapon.currentFireRate) {
            let targets = enemies.concat(rocks).filter(t => Math.hypot(t.x - player.x, t.y - player.y) <= weapon.range);
            if (targets.length > 0) {
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev);
                let weaponX = player.x + (index === 0 ? 35 : -35); let weaponY = player.y;
                let angle = Math.atan2(closest.y - weaponY, closest.x - weaponX);
                bullets.push({ x: weaponX, y: weaponY, startX: weaponX, startY: weaponY, vx: Math.cos(angle)*weapon.speed, vy: Math.sin(angle)*weapon.speed, damage: weapon.currentDamage, size: weapon.size, color: weapon.color, range: weapon.range });
                weapon.fireTimer = 0;
            }
        }
    });

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; b.x += b.vx; b.y += b.vy;
        if (Math.hypot(b.x - b.startX, b.y - b.startY) > b.range) { bullets.splice(i, 1); continue; }
        for (let ri = rocks.length - 1; ri >= 0; ri--) {
            let r = rocks[ri];
            if (Math.hypot(b.x - r.x, b.y - r.y) < r.size + b.size) { r.hp -= b.damage; bullets.splice(i, 1); if (r.hp <= 0) { gems.push({ x: r.x, y: r.y, isSuper: true }); rocks.splice(ri, 1); } break; }
        }
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i]; b.x += b.vx; b.y += b.vy;
        if (Math.hypot(b.x - player.x, b.y - player.y) > 1500) { enemyBullets.splice(i, 1); continue; }
        let hitRock = false; for (let r of rocks) { if (Math.hypot(b.x - r.x, b.y - r.y) < r.size) { hitRock = true; break; } }
        if(hitRock) { enemyBullets.splice(i, 1); continue; }
        if (Math.hypot(b.x - player.x, b.y - player.y) < player.size + 5) { damagePlayer(b.damage); enemyBullets.splice(i, 1); }
    }

    if (Math.random() < 0.0008 && chests.length < 3) {
        let angle = Math.random() * Math.PI * 2; let dist = 500 + Math.random() * 1000;
        let cx = player.x + Math.cos(angle) * dist; let cy = player.y + Math.sin(angle) * dist;
        if(isPositionFree(cx, cy, 25)) chests.push({ x: cx, y: cy, size: 25, isSpecial: false });
    }
    for (let i = chests.length - 1; i >= 0; i--) {
        let c = chests[i];
        if (Math.hypot(player.x - c.x, player.y - c.y) < player.size + c.size) {
            chests.splice(i, 1); 
            if (c.isSpecial) { showBossRelicModal(); } 
            else {
                let rand = Math.random();
                if (rand < 0.4) { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5); updateBarsUI(); showItemFeedback("✚ CURA", "#00ff00"); } 
                else if (rand < 0.7) { 
                    let sd = Math.max(canvas.width, canvas.height); 
                    enemies.forEach(e => { if(Math.hypot(e.x - player.x, e.y - player.y) < sd) { if (e.type !== 'miniboss') e.hp -= 10000; else e.hp -= 500; } }); 
                    showItemFeedback("💣 BOMBA!", "#ff4500"); 
                } else { showItemFeedback("⬆️ POTENZIAMENTO!", "#ffff00"); freeUpgrade(); }
            }
        }
    }

    for (let i = rocks.length - 1; i >= 0; i--) { if (Math.hypot(player.x - rocks[i].x, player.y - rocks[i].y) > 2000) rocks.splice(i, 1); }
    while(rocks.length < 15) { 
        let valid = false; let attempts = 0; let rx, ry, rSize;
        while(!valid && attempts < 10) {
            let angle = Math.random() * Math.PI * 2; rx = player.x + Math.cos(angle) * (1000 + Math.random() * 500); ry = player.y + Math.sin(angle) * (1000 + Math.random() * 500);
            rSize = 25 + Math.random() * 20; valid = isPositionFree(rx, ry, rSize); attempts++;
        }
        if (valid) rocks.push({ x: rx, y: ry, size: rSize, hp: 30 });
    }

    let spawnDelay = Math.max(30, 120 - (level * 10)); 
    if (frameCount % spawnDelay === 0) {
        let numToSpawn = 1 + Math.floor(level / 3); 
        for(let i = 0; i < numToSpawn; i++) {
            let valid = false; let attempts = 0; let ex, ey;
            while(!valid && attempts < 10) {
                let angle = Math.random() * Math.PI * 2; let radius = Math.max(canvas.width, canvas.height) / 1.5; 
                ex = player.x + Math.cos(angle) * radius; ey = player.y + Math.sin(angle) * radius; valid = isPositionFree(ex, ey, 22); attempts++;
            }
            if(valid) {
                let type = 'melee'; let color = 'red'; let hp = 10 + (level * 5); let speed = 1.5 + Math.random(); let size = 12;
                if (level >= 2 && Math.random() < 0.25) { type = 'shooter'; color = 'purple'; speed = 0.8; hp = hp * 0.8; }
                else if (level >= 4 && Math.random() < 0.15) { type = 'tank'; color = 'darkred'; hp = hp * 3; speed = 0.6; size = 22; }
                enemies.push({ x: ex, y: ey, hp: hp, maxHp: hp, speed: speed, size: size, type: type, color: color, fireTimer: 0 });
            }
        }
    }

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
        let e = enemies[ei];
        if (Math.hypot(player.x - e.x, player.y - e.y) > 2500) { enemies.splice(ei, 1); continue; }
        let dx = player.x - e.x; let dy = player.y - e.y; let angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * e.speed; e.y += Math.sin(angle) * e.speed;

        if (e.type === 'shooter') {
            e.fireTimer++; if (e.fireTimer >= 100) { enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle)*5, vy: Math.sin(angle)*5, damage: 10 }); e.fireTimer = 0; }
        }
        
        if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) { damagePlayer(0.5); }
        
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            let b = bullets[bi];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) { e.hp -= b.damage; bullets.splice(bi, 1); }
        }

        if (e.hp <= 0) { 
            if (e.type === 'miniboss') { chests.push({ x: e.x, y: e.y, size: 35, isSpecial: true }); showItemFeedback("🏆 CASSA SUPREMA!", "gold"); } 
            else { gems.push({ x: e.x, y: e.y, isSuper: false }); }
            enemies.splice(ei, 1); 
        }
    }

    for (let gi = gems.length - 1; gi >= 0; gi--) {
        let g = gems[gi];
        if (Math.hypot(player.x - g.x, player.y - g.y) > 2500) { gems.splice(gi, 1); continue; }
        let dist = Math.hypot(player.x - g.x, player.y - g.y);
        if (dist < player.pickupRange) { let angle = Math.atan2(player.y - g.y, player.x - g.x); g.x += Math.cos(angle) * 10; g.y += Math.sin(angle) * 10; }
        if (dist < player.size) {
            xp += g.isSuper ? 3 : 1; gems.splice(gi, 1);
            document.getElementById('xp-bar').style.width = Math.min((xp / xpNeeded * 100), 100) + '%';
            if (xp >= xpNeeded) levelUp();
        }
    }
}

function draw() {
    let camX = player.x - canvas.width / 2; let camY = player.y - canvas.height / 2;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; let gridSize = 100; let offsetX = camX % gridSize; let offsetY = camY % gridSize;
    for(let x = -offsetX; x < canvas.width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for(let y = -offsetY; y < canvas.height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

    ctx.fillStyle = '#666'; ctx.strokeStyle = '#444'; ctx.lineWidth = 4;
    rocks.forEach(r => { ctx.beginPath(); ctx.arc(r.x - camX, r.y - camY, r.size, 0, Math.PI*2); ctx.fill(); ctx.stroke(); });

    chests.forEach(c => {
        let chestWidth = c.size * 2.8; let chestHeight = c.size * 1.8;
        let drawX = c.x - camX - (chestWidth / 2); let drawY = c.y - camY - (chestHeight / 2);
        if (c.isSpecial) { 
            ctx.shadowBlur = 20; ctx.shadowColor = 'gold'; ctx.fillStyle = 'gold'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); ctx.shadowBlur = 0;
        } else if(chestImg.complete && chestImg.naturalWidth > 0) { 
            ctx.drawImage(chestImg, drawX, drawY, chestWidth, chestHeight); 
        } else { 
            ctx.fillStyle = '#8B4513'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); 
            ctx.fillStyle = '#3a1c05'; ctx.fillRect(drawX, drawY + chestHeight/2 - 4, chestWidth, 8);
            ctx.fillStyle = 'gold'; ctx.fillRect(drawX + chestWidth/2 - 4, drawY + chestHeight/2 - 6, 8, 12);
        }
    });

    if(player.hasOrbs) {
        let orbDist = 100;
        player.orbTrail.forEach(t => { ctx.fillStyle = `rgba(255, 255, 255, ${t.life/60})`; ctx.beginPath(); ctx.arc(t.x - camX, t.y - camY, 8, 0, Math.PI*2); ctx.fill(); });
        let o1x = player.x + Math.cos(player.orbAngle)*orbDist; let o1y = player.y + Math.sin(player.orbAngle)*orbDist;
        let o2x = player.x + Math.cos(player.orbAngle + Math.PI)*orbDist; let o2y = player.y + Math.sin(player.orbAngle + Math.PI)*orbDist;
        ctx.fillStyle = 'white'; ctx.shadowBlur = 10; ctx.shadowColor = 'white';
        ctx.beginPath(); ctx.arc(o1x - camX, o1y - camY, 5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(o2x - camX, o2y - camY, 5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    }

    player.miniMes.forEach(m => {
        let cx = m.x - camX; let cy = m.y - camY;
        ctx.fillStyle = '#00aaaa'; ctx.fillRect(cx - 8, cy - 8, 16, 20); ctx.beginPath(); ctx.arc(cx, cy - 10, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'red'; ctx.fillRect(cx - 10, cy - 25, 20, 4); ctx.fillStyle = 'lime'; ctx.fillRect(cx - 10, cy - 25, 20 * (m.hp/m.maxHp), 4);
    });

    gems.forEach(g => { ctx.fillStyle = g.isSuper ? '#ffa500' : '#00ffff'; ctx.beginPath(); ctx.arc(g.x - camX, g.y - camY, g.isSuper ? 8 : 4, 0, Math.PI*2); ctx.fill(); });
    
    ctx.fillStyle = '#ff00ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff';
    enemyBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 6, 0, Math.PI*2); ctx.fill(); }); ctx.shadowBlur = 0; 
    
    bullets.forEach(b => { 
        ctx.fillStyle = b.color;
        if(b.color === '#ff3300') { ctx.shadowBlur = 15; ctx.shadowColor = 'red'; } else if (b.color === 'cyan') { ctx.shadowBlur = 10; ctx.shadowColor = 'cyan'; }
        ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, b.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    });

    enemies.forEach(e => { 
        let bx = e.x - camX; let by = e.y - camY;
        let armColor = '#8b0000'; if(e.type === 'miniboss') armColor = '#b8860b'; else if(e.type === 'tank') armColor = '#5a0000'; else if(e.type === 'shooter') armColor = '#4b0082'; 
        if(e.type === 'miniboss') { ctx.shadowBlur = 20; ctx.shadowColor = 'gold'; }
        
        let armOffset = Math.sin(frameCount * 0.05 + e.x) * (e.size * 0.5);
        let bodyW = e.size * 0.8; let bodyH = e.size * 1.2; let armW = e.size * 1.0; let armH = e.size * 1.8;
        
        ctx.fillStyle = armColor;
        ctx.fillRect(bx - bodyW/2 - armW + 2, by - bodyH/2 + armOffset, armW, armH); ctx.fillRect(bx + bodyW/2 - 2, by - bodyH/2 - armOffset, armW, armH); 
        if(e.type === 'shooter') { ctx.fillStyle = '#555'; let handY = by - bodyH/2 - armOffset + armH - 4; ctx.fillRect(bx + bodyW/2 + armW/2, handY, e.size*1.5, 5); ctx.fillRect(bx + bodyW/2 + armW/2, handY, 5, 10); }

        ctx.fillStyle = e.color; ctx.fillRect(bx - bodyW/2, by - bodyH/2, bodyW, bodyH); ctx.beginPath(); ctx.arc(bx, by - bodyH/2 - e.size*0.3, e.size * 0.9, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        if(e.type === 'miniboss') { ctx.fillStyle = 'black'; ctx.fillRect(bx - 40, by - e.size*2.5, 80, 8); ctx.fillStyle = 'red'; ctx.fillRect(bx - 40, by - e.size*2.5, 80 * (Math.max(0, e.hp)/e.maxHp), 8); }
    });

    let screenCenterX = canvas.width / 2; let screenCenterY = canvas.height / 2;
    if (player.shield > 0) { ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY, player.size + 10, 0, Math.PI*2); ctx.fillStyle = 'rgba(0, 150, 255, 0.3)'; ctx.fill(); }
    
    ctx.fillStyle = '#00ff00';
    let pBodyW = player.size * 1.2; let pBodyH = player.size * 1.8;
    
    if (player.charId === 0) {
        ctx.fillRect(screenCenterX - pBodyW/2, screenCenterY - pBodyH/2 + 5, pBodyW, pBodyH);
    } else if (player.charId === 1) { 
        ctx.beginPath(); ctx.moveTo(screenCenterX - pBodyW, screenCenterY - pBodyH/2 + 5);
        ctx.lineTo(screenCenterX + pBodyW, screenCenterY - pBodyH/2 + 5); ctx.lineTo(screenCenterX, screenCenterY + pBodyH/2 + 5); ctx.fill();
    } else if (player.charId === 2) { 
        ctx.beginPath(); ctx.moveTo(screenCenterX, screenCenterY - pBodyH/2 + 5);
        ctx.lineTo(screenCenterX + pBodyW, screenCenterY + pBodyH/2 + 5); ctx.lineTo(screenCenterX - pBodyW, screenCenterY + pBodyH/2 + 5); ctx.fill();
    }

    ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2, player.size * 0.6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY, player.pickupRange, 0, Math.PI*2); ctx.stroke();

    ctx.font = "24px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    player.weapons.forEach((w, index) => {
        let weaponX = screenCenterX + (index === 0 ? 35 : -35); let weaponY = screenCenterY;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.beginPath(); ctx.arc(weaponX, weaponY, 18, 0, Math.PI*2); ctx.fill(); ctx.fillText(w.icon, weaponX, weaponY + 2);
    });

    // --- DISEGNO NOME GIOCATORE ---
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "white";
    ctx.shadowBlur = 5; ctx.shadowColor = "black";
    ctx.fillText(activePlayerName, screenCenterX, screenCenterY - pBodyH/2 - player.size - 15);
    ctx.shadowBlur = 0;

    if (chests.length > 0) {
        let closestChest = chests.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev);
        let dist = Math.hypot(closestChest.x - player.x, closestChest.y - player.y);
        if (dist > 200 && dist < 1500) {
            let angle = Math.atan2(closestChest.y - player.y, closestChest.x - player.x);
            ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle);
            ctx.fillStyle = closestChest.isSpecial ? '#ffaa00' : 'gold'; ctx.shadowColor = closestChest.isSpecial ? 'orange' : 'yellow'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(40, -10); ctx.lineTo(40, 10); ctx.fill(); ctx.restore();
        }
    }
}

function buildUpgradePool() {
    let pool = [];
    player.weapons.forEach(w => { pool.push({ name: `<span class="upgrade-title">⏫ ${w.icon} Potenzia ${w.name} (Lv.${w.level + 1})</span><span class="upgrade-desc">Danni e velocità incrementati</span>`, apply: () => { w.level++; w.currentDamage += Math.floor(w.baseDamage * 0.4); w.currentFireRate = Math.max(5, w.currentFireRate - 5); updateWeaponsUI(); finishUpgrade(); } }); });
    
    let charWeapons = CHARACTERS.find(c => c.id === player.charId).weapons;
    charWeapons.forEach(wId => {
        let wt = WEAPONS_DB[wId];
        if (!player.weapons.find(owned => owned.id === wt.id)) { pool.push({ name: `<span class="upgrade-title">🆕 ${wt.icon} Prendi: ${wt.name}</span><span class="upgrade-desc">Aggiungi all'arsenale</span>`, apply: () => { handleNewWeapon(wt); } }); }
    });

    pool.push({ name: `<span class="upgrade-title">🏃 Velocità Movimento</span><span class="upgrade-desc">Corri più veloce</span>`, apply: () => { player.speed += 1; finishUpgrade(); } });
    pool.push({ name: `<span class="upgrade-title">🧲 Raggio Magnetico</span><span class="upgrade-desc">Raccogli da più lontano</span>`, apply: () => { player.pickupRange += 40; finishUpgrade(); } });
    return pool;
}

function levelUp() {
    paused = true; xp = xp - xpNeeded; xpNeeded = Math.floor(xpNeeded * 1.5); level++;
    document.getElementById('lvl').innerText = level; document.getElementById('xp-bar').style.width = (Math.max(0, xp) / xpNeeded * 100) + '%';
    
    let pool = buildUpgradePool(); let shuffled = pool.sort(() => 0.5 - Math.random()); currentChoices = shuffled.slice(0, 3);
    for(let i=0; i<3; i++) { let btn = document.getElementById('btn'+i); btn.innerHTML = currentChoices[i].name; btn.onclick = () => { document.getElementById('levelup-modal').style.display = 'none'; currentChoices[i].apply(); }; }
    document.getElementById('levelup-title').innerText = "Livello Superato!"; document.getElementById('levelup-title').style.color = "#00ffff"; document.getElementById('levelup-modal').style.display = 'block';

    if (level % 5 === 0 && player.lastBossLevel !== level) {
        player.lastBossLevel = level;
        let bossHp = 2000 * (level / 5); let bossSpeed = 0.8 + (level * 0.02);
        enemies.push({ x: player.x, y: player.y - 600, hp: bossHp, maxHp: bossHp, speed: bossSpeed, size: 35, type: 'miniboss', color: 'gold', fireTimer: 0 });
        setTimeout(() => { showItemFeedback("⚠️ TITANO IN ARRIVO! ⚠️", "#ff0000"); }, 500);
    }
}

function freeUpgrade() {
    paused = true; let pool = buildUpgradePool(); let shuffled = pool.sort(() => 0.5 - Math.random()); currentChoices = shuffled.slice(0, 3);
    for(let i=0; i<3; i++) { let btn = document.getElementById('btn'+i); btn.innerHTML = currentChoices[i].name; btn.onclick = () => { document.getElementById('levelup-modal').style.display = 'none'; currentChoices[i].apply(); }; }
    document.getElementById('levelup-title').innerText = "Cassa: Scelta Gratuita!"; document.getElementById('levelup-title').style.color = "#ffff00"; document.getElementById('levelup-modal').style.display = 'block';
}

function showBossRelicModal() {
    paused = true;
    let pool = [
        { name: `<span class="upgrade-title">🌀 Palle Rotanti</span><span class="upgrade-desc">2 sfere lasciano una scia dannosa</span>`, apply: () => { player.hasOrbs = true; closeBossModal(); } },
        { name: `<span class="upgrade-title">🛡️ Scudo Rigenerativo</span><span class="upgrade-desc">Assorbe danni e si ricarica da solo</span>`, apply: () => { player.maxShield += 50; player.shield = player.maxShield; document.getElementById('shield-ui').style.display = 'flex'; updateBarsUI(); closeBossModal(); } }
    ];
    if (player.miniMes.length < 3) { pool.push({ name: `<span class="upgrade-title">🤖 Mini Me</span><span class="upgrade-desc">Un robottino alleato che spara per te</span>`, apply: () => { player.miniMes.push({x: player.x, y: player.y, hp: 100, maxHp: 100, fireTimer: 0}); closeBossModal(); } }); } 
    else { pool.push({ name: `<span class="upgrade-title">❤️ Titanico</span><span class="upgrade-desc">Aumenta e cura tutti gli HP</span>`, apply: () => { player.maxHp += 100; player.hp = player.maxHp; updateBarsUI(); closeBossModal(); } }); }
    for(let i=0; i<3; i++) { let btn = document.getElementById('boss-btn'+i); btn.innerHTML = pool[i].name; btn.onclick = pool[i].apply; }
    document.getElementById('boss-modal').style.display = 'block';
}
function closeBossModal() { document.getElementById('boss-modal').style.display = 'none'; paused = false; }

function handleNewWeapon(weaponData) {
    if (player.weapons.length < 2) { giveWeapon(weaponData); finishUpgrade(); } 
    else {
        pendingWeapon = weaponData; document.getElementById('new-weapon-name').innerHTML = `${weaponData.icon} ${weaponData.name}`;
        document.getElementById('rep-btn0').innerHTML = `<span class="upgrade-title">Scarta ${player.weapons[0].icon}</span><span class="upgrade-desc">Lv. ${player.weapons[0].level}</span>`;
        document.getElementById('rep-btn1').innerHTML = `<span class="upgrade-title">Scarta ${player.weapons[1].icon}</span><span class="upgrade-desc">Lv. ${player.weapons[1].level}</span>`;
        document.getElementById('replace-modal').style.display = 'block';
    }
}

function confirmReplace(slotIndex) { player.weapons[slotIndex] = { ...pendingWeapon, level: 1, currentDamage: pendingWeapon.baseDamage, currentFireRate: pendingWeapon.fireRate, fireTimer: 0 }; updateWeaponsUI(); document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function cancelReplace() { document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function finishUpgrade() { paused = false; }

showMenu();
