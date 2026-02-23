const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

let gameState = "MENU"; 
let paused = false; let frameCount = 0;
let maxLevelReached = parseInt(localStorage.getItem('survivorMaxLevel')) || 1;
let cheatUnlocked = localStorage.getItem('survivorCheat') === 'true'; 
let totalCrystals = parseInt(localStorage.getItem('survivorCrystals')) || 0;
let unlockedEquip = JSON.parse(localStorage.getItem('survivorUnlockedEquip')) || [];
let equippedItems = JSON.parse(localStorage.getItem('survivorEquipped')) || { elmo: null, corazza: null, amuleto: null };

let selectedCharId = 0; 
let savedName = localStorage.getItem('survivorPlayerName') || ""; let activePlayerName = "Eroe";

let chestImg = new Image(); chestImg.src = 'chest.png';
let chestEpicImg = new Image(); chestEpicImg.src = 'chestepic.png'; // Immagine Cassa Epica

let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
let controlMode = isTouchDevice ? 'mobile' : 'pc';
let joyX = 0, joyY = 0; let isDraggingJoy = false; let joyBaseRect; const maxJoyDist = 55; 
const joyZone = document.getElementById('joystick-zone'); const joyStick = document.getElementById('joystick-stick');

let keys = {}; 
window.addEventListener('keydown', e => { let key = e.key.toLowerCase(); keys[key] = true; if (key === 'p' || e.key === 'Escape') togglePause(); }); 
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function distToSegment(px, py, x1, y1, x2, y2) { let l2 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2); if (l2 === 0) return Math.hypot(px - x1, py - y1); let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))); }

const WEAPON_MODELS = {
    pistola: (ctx, s, bulletColor) => { ctx.fillStyle = "#bbbbbb"; ctx.fillRect(0, -s/4, s*1.5, s/2); ctx.fillStyle = "#444444"; ctx.fillRect(0, s/4, s/2, s/1.5); },
    fucile: (ctx, s, bulletColor) => { ctx.fillStyle = "#333333"; ctx.fillRect(0, -s/6, s*2, s/3); ctx.fillStyle = "#111111"; ctx.fillRect(s, -s/2, s/4, s/3); ctx.fillStyle = "#5c3a21"; ctx.fillRect(-s/2, s/6, s, s/2.5); },
    bastone: (ctx, s, bulletColor) => { ctx.fillStyle = "#6b3e1b"; ctx.fillRect(-s, -s/10, s*3.5, s/5); ctx.fillStyle = bulletColor; ctx.shadowBlur = 15; ctx.shadowColor = bulletColor; ctx.beginPath(); ctx.arc(s*2.5, 0, s/2.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "gold"; ctx.lineWidth = 3; ctx.stroke(); },
    laser: (ctx, s, bulletColor) => { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, -s/3, s*1.5, s/1.5); ctx.fillStyle = bulletColor; ctx.fillRect(s/2, -s/4, s/2, s/2); ctx.fillStyle = "#222222"; ctx.fillRect(-s/4, s/3, s/2, s/2); },
    granata: (ctx, s, bulletColor) => { ctx.fillStyle = "#2a4d20"; ctx.beginPath(); ctx.arc(s/2, 0, s/1.2, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#eeddaa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s/2, -s/1.2); ctx.lineTo(s/2 + s/2, -s*1.2); ctx.stroke(); },
    razzo: (ctx, s, bulletColor) => { ctx.fillStyle = "#445555"; ctx.fillRect(-s/2, -s/4, s*2, s/2); ctx.fillStyle = "#222222"; ctx.fillRect(-s/2, s/4, s/2, s/2); ctx.fillStyle = bulletColor; ctx.beginPath(); ctx.moveTo(s*1.5, -s/3); ctx.lineTo(s*2.2, 0); ctx.lineTo(s*1.5, s/3); ctx.fill(); },
    freezer: (ctx, s, bulletColor) => { ctx.fillStyle = "#eeeeee"; ctx.fillRect(0, -s/4, s*1.2, s/2); ctx.fillStyle = "#333333"; ctx.fillRect(0, s/4, s/2, s/1.5); ctx.fillStyle = bulletColor; ctx.beginPath(); ctx.arc(-s/4, 0, s/1.5, 0, Math.PI*2); ctx.fill(); }
};

const WEAPONS_DB = {
    pistola: { id: 'pistola', name: "Pistola", baseDamage: 12, fireRate: 45, range: 600, speed: 12, weaponSize: 15, bulletSize: 5, color: "silver", muzzleOffset: 25 },
    fucile:  { id: 'fucile',  name: "Fucile",  baseDamage: 8,  fireRate: 15, range: 800, speed: 20, weaponSize: 22, bulletSize: 3, color: "white", muzzleOffset: 45 },
    bastone: { id: 'bastone', name: "Bastone", baseDamage: 30, fireRate: 80, range: 1200, speed: 7, weaponSize: 20, bulletSize: 15, color: "#ff4500", muzzleOffset: 65 }, 
    laser:   { id: 'laser',   name: "Blaster", baseDamage: 18, fireRate: 40, range: 1500, speed: 0, weaponSize: 20, bulletSize: 4, color: "lime", muzzleOffset: 35 }, 
    granata: { id: 'granata', name: "Granate", baseDamage: 50, fireRate: 90, range: 400, speed: 8,  weaponSize: 16, bulletSize: 10, color: "#888", muzzleOffset: 15 },
    razzo:   { id: 'razzo',   name: "Razzo",   baseDamage: 60, fireRate: 100,range: 1000,speed: 10, weaponSize: 25, bulletSize: 14, color: "orange", muzzleOffset: 55 },
    freezer: { id: 'freezer', name: "Freezer", baseDamage: 20, fireRate: 35, range: 600, speed: 15, weaponSize: 20, bulletSize: 10, color: "#aaddff", muzzleOffset: 25 }
};

const CHARACTERS = [ { id: 0, name: "Recluta", desc: "Corpo Quadrato", reqLevel: 1, weapons: ['pistola', 'fucile', 'bastone'] }, { id: 1, name: "Gelataio", desc: "Corpo a Cono", reqLevel: 10, weapons: ['pistola', 'laser', 'granata'] }, { id: 2, name: "Punta", desc: "Corpo Piramidale", reqLevel: 15, weapons: ['pistola', 'razzo', 'freezer'] } ];

const EQUIP_DB = {
    elmo: [
        { id: 'elmo_1', name: 'Elmo Comune', desc: '15% Schivata Proiettili', price: 100, value: 0.15, icon: '🪖' },
        { id: 'elmo_2', name: 'Elmo Raro', desc: '30% Schivata Proiettili', price: 300, value: 0.30, icon: '🪖' },
        { id: 'elmo_3', name: 'Elmo Epico', desc: '50% Schivata Proiettili', price: 600, value: 0.50, icon: '👑' }
    ],
    corazza: [
        { id: 'cor_1', name: 'Corazza Comune', desc: '15% Schivata Mischia', price: 100, value: 0.15, icon: '👕' },
        { id: 'cor_2', name: 'Corazza Rara', desc: '30% Schivata Mischia', price: 300, value: 0.30, icon: '🦺' },
        { id: 'cor_3', name: 'Corazza Epica', desc: '50% Schivata Mischia', price: 600, value: 0.50, icon: '🛡️' }
    ],
    amuleto: [
        { id: 'amu_ice', name: 'Amuleto Ghiaccio', desc: 'Scia congelante (3s)', price: 1000, icon: '❄️' },
        { id: 'amu_fire', name: 'Amuleto Fuoco', desc: 'Scia incendiaria (3s)', price: 1000, icon: '🔥' },
        { id: 'amu_revive', name: 'Amuleto Fenice', desc: 'Rinasci 1 volta (50% HP)', price: 2000, icon: '❤️‍🔥' }
    ]
};

let player = {};
let enemies = []; let bullets = []; let beams = []; let explosions = []; let elementalTrails = []; let enemyBullets = []; let gems = []; let rocks = []; let chests = [];
let xp = 0; let xpNeeded = 15; let level = 1; let currentChoices = []; let pendingWeapon = null; let sessionCrystals = 0;

function savePlayerName() { let inputVal = document.getElementById('player-name-input').value.trim(); localStorage.setItem('survivorPlayerName', inputVal); savedName = inputVal; }
function showSettings() { document.getElementById('settings-modal').style.display = 'block'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function checkCheatCode() {
    let input = document.getElementById('cheat-input').value;
    if (input === "160105") { 
        cheatUnlocked = true; localStorage.setItem('survivorCheat', 'true'); 
        unlockedEquip = [];
        ['elmo', 'corazza', 'amuleto'].forEach(cat => { EQUIP_DB[cat].forEach(item => unlockedEquip.push(item.id)); });
        localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip));
        alert("✔️ CODICE ACCETTATO!\nTutti i personaggi e gli equipaggiamenti sbloccati per sempre."); 
        closeSettings();
        if(document.getElementById('equipment-select').style.display === 'flex') updateEquipMenuUI();
    } else { alert("❌ Codice errato."); } 
    document.getElementById('cheat-input').value = "";
}

function showEquipmentMenu() { document.getElementById('main-menu').style.display = 'none'; document.getElementById('equipment-select').style.display = 'flex'; updateEquipMenuUI(); }
function updateEquipMenuUI() {
    document.getElementById('menu-crystal-count').innerText = totalCrystals;
    const container = document.getElementById('equip-container'); container.innerHTML = '';
    ['elmo', 'corazza', 'amuleto'].forEach(category => {
        let catTitle = document.createElement('h3'); catTitle.className = 'equip-category-title'; catTitle.innerText = category === 'elmo' ? 'ELMI' : (category === 'corazza' ? 'CORAZZE' : 'AMULETI'); container.appendChild(catTitle);
        let row = document.createElement('div'); row.className = 'char-container';
        EQUIP_DB[category].forEach(item => {
            let isUnlocked = unlockedEquip.includes(item.id); let isEquipped = equippedItems[category] === item.id;
            let card = document.createElement('div'); card.className = `char-card ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}`;
            let btnHtml = '';
            if (isEquipped) { btnHtml = `<button class="equip-btn equipped" disabled>Equipaggiato</button>`; } else if (isUnlocked) { btnHtml = `<button class="equip-btn equip" onclick="equipItem('${category}', '${item.id}')">Equipaggia</button>`; } else { let canAfford = totalCrystals >= item.price; btnHtml = `<button class="equip-btn buy" ${canAfford ? '' : 'disabled'} onclick="buyEquip('${item.id}', ${item.price})">Compra 💎 ${item.price}</button>`; }
            card.innerHTML = `<div style="font-size:40px; margin-bottom:10px;">${item.icon}</div><h3>${item.name}</h3><p style="color:#aaa; font-size:12px;">${item.desc}</p>${btnHtml}`;
            row.appendChild(card);
        }); container.appendChild(row);
    });
}
function buyEquip(id, price) { if (totalCrystals >= price) { totalCrystals -= price; unlockedEquip.push(id); localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip)); updateEquipMenuUI(); } }
function equipItem(category, id) { equippedItems[category] = id; localStorage.setItem('survivorEquipped', JSON.stringify(equippedItems)); updateEquipMenuUI(); }
function getEquipStat(category) { if (!equippedItems[category]) return 0; let item = EQUIP_DB[category].find(x => x.id === equippedItems[category]); return item ? item.value : 0; }

function togglePause() { 
    if (gameState !== "PLAYING") return; 
    let lvlModal = document.getElementById('levelup-modal').style.display; let bossModal = document.getElementById('boss-modal').style.display; let repModal = document.getElementById('replace-modal').style.display; let epicModal = document.getElementById('epic-modal').style.display;
    if (lvlModal === 'block' || bossModal === 'block' || repModal === 'block' || epicModal === 'block') return; 
    let pauseModal = document.getElementById('pause-modal');
    if (paused) { paused = false; pauseModal.style.display = 'none'; } else { paused = true; pauseModal.style.display = 'block'; } 
}
function surrender() { document.getElementById('pause-modal').style.display = 'none'; player.hp = 0; updateBarsUI(); triggerGameOver(); }

function showMenu() { gameState = "MENU"; document.getElementById('main-menu').style.display = 'flex'; document.getElementById('character-select').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'none'; document.getElementById('game-ui').style.display = 'none'; document.getElementById('equipment-select').style.display = 'none'; canvas.style.display = 'none'; document.getElementById('player-name-input').value = savedName; }
function backToMenu() { showMenu(); }
function showCharacterSelect() {
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('character-select').style.display = 'flex';
    const container = document.getElementById('char-cards-container'); container.innerHTML = '';
    CHARACTERS.forEach(char => {
        let isUnlocked = cheatUnlocked || maxLevelReached >= char.reqLevel; let isSelected = selectedCharId === char.id;
        let wNames = char.weapons.map(w => WEAPONS_DB[w].name).join(", ");
        let card = document.createElement('div'); card.className = `char-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `<h3>${char.name}</h3><p style="color:#aaa; font-size:14px;">${char.desc}</p><div class="char-weapons-list">${wNames}</div><p style="color:#00ffff; font-size:12px;">Armi disponibili</p>${!isUnlocked ? `<div class="lock-icon">🔒<br><span style="font-size:14px;">Liv. ${char.reqLevel}</span></div>` : ''}`;
        if (isUnlocked) { card.onclick = () => { selectedCharId = char.id; showCharacterSelect(); }; }
        container.appendChild(card);
    });
}

function startGame() {
    gameState = "PLAYING"; savePlayerName(); activePlayerName = savedName !== "" ? savedName : "Eroe"; sessionCrystals = 0; document.getElementById('crystal-count').innerText = 0;
    
    let amuletIcon = "";
    if (equippedItems.amuleto) { let item = EQUIP_DB.amuleto.find(x => x.id === equippedItems.amuleto); if (item) amuletIcon = item.icon; }
    document.getElementById('amulet-icon-ui').innerText = amuletIcon; document.getElementById('amulet-icon-ui').style.opacity = '1';

    document.getElementById('main-menu').style.display = 'none'; document.getElementById('character-select').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'none'; document.getElementById('game-ui').style.display = 'block'; canvas.style.display = 'block';
    document.getElementById('joystick-zone').style.display = (controlMode === 'mobile') ? 'flex' : 'none';
    
    player = { x: 0, y: 0, size: 20, speed: 4, hp: 100, maxHp: 100, pickupRange: 80, weapons: [], shield: 0, maxShield: 0, lastHitTimer: 0, iFrames: 0, hasOrbs: false, orbAngle: 0, orbTrail: [], miniMes: [], lastBossLevel: 0, charId: selectedCharId, hasRevived: false };
    enemies = []; bullets = []; beams = []; explosions = []; elementalTrails = []; enemyBullets = []; gems = []; rocks = []; chests = []; xp = 0; level = 1; xpNeeded = 15; frameCount = 0; keys = {}; paused = false; joyX = 0; joyY = 0;
    for(let i = 0; i < 15; i++) { let valid = false; let attempts = 0; let rx, ry, rSize; while(!valid && attempts < 10) { let angle = Math.random() * Math.PI * 2; let dist = 300 + Math.random() * 1500; rx = Math.cos(angle) * dist; ry = Math.sin(angle) * dist; rSize = 25 + Math.random() * 20; valid = isPositionFree(rx, ry, rSize); attempts++; } if (valid) rocks.push({ x: rx, y: ry, size: rSize, hp: 30 }); }
    giveWeapon(WEAPONS_DB.pistola); updateBarsUI(); document.getElementById('lvl').innerText = level; document.getElementById('shield-ui').style.display = 'none'; requestAnimationFrame(gameLoop);
}

function triggerGameOver() { paused = true; gameState = "GAMEOVER"; if (level > maxLevelReached) { maxLevelReached = level; localStorage.setItem('survivorMaxLevel', maxLevelReached); } document.getElementById('run-crystals').innerText = sessionCrystals; document.getElementById('final-level').innerText = level; document.getElementById('game-ui').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'flex'; }

joyZone.addEventListener('touchstart', handleJoyStart, {passive: false}); joyZone.addEventListener('touchmove', handleJoyMove, {passive: false}); joyZone.addEventListener('touchend', handleJoyEnd);
function handleJoyStart(e) { e.preventDefault(); joyBaseRect = document.getElementById('joystick-base').getBoundingClientRect(); isDraggingJoy = true; handleJoyMove(e); }
function handleJoyMove(e) { if (!isDraggingJoy) return; e.preventDefault(); let touch = e.touches[0]; let centerX = joyBaseRect.left + joyBaseRect.width / 2; let centerY = joyBaseRect.top + joyBaseRect.height / 2; let dx = touch.clientX - centerX; let dy = touch.clientY - centerY; let dist = Math.hypot(dx, dy); if (dist > maxJoyDist) { dx = (dx / dist) * maxJoyDist; dy = (dy / dist) * maxJoyDist; } joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; joyX = dx / maxJoyDist; joyY = dy / maxJoyDist; }
function handleJoyEnd(e) { isDraggingJoy = false; joyStick.style.transform = `translate(-50%, -50%)`; joyX = 0; joyY = 0; }

function updateBarsUI() { document.getElementById('hp-bar-fill').style.width = (Math.max(0, player.hp) / player.maxHp * 100) + '%'; if(player.maxShield > 0) { document.getElementById('shield-bar-fill').style.width = (Math.max(0, player.shield) / player.maxShield * 100) + '%'; } }
function updateWeaponsUI() { const ui = document.getElementById('weapons-ui'); ui.innerHTML = ''; player.weapons.forEach(w => { ui.innerHTML += `<div class="weapon-slot" style="color:${w.color}">${w.name} <span class="weapon-lvl">Lv.${w.level}</span></div>`; }); }

function damagePlayer(amount) { 
    player.lastHitTimer = 0; 
    if (player.shield > 0) { player.shield -= amount; if (player.shield < 0) { player.hp += player.shield; player.shield = 0; } } else { player.hp -= amount; } 
    if(player.hp <= 0 && equippedItems.amuleto === 'amu_revive' && !player.hasRevived) {
        player.hp = player.maxHp * 0.5; player.hasRevived = true; showItemFeedback("🔥 FENICE!", "#ff4500");
        enemies.forEach(e => { if(Math.hypot(e.x-player.x, e.y-player.y) < 500) e.hp -= 2000; }); document.getElementById('amulet-icon-ui').style.opacity = '0.3';
    } else if (player.hp <= 0) { triggerGameOver(); }
    updateBarsUI(); 
}

function giveWeapon(weaponData) { player.weapons.push({ ...weaponData, level: 1, currentDamage: weaponData.baseDamage, currentFireRate: weaponData.fireRate, fireTimer: 0 }); updateWeaponsUI(); }
function isPositionFree(x, y, radius) { for (let r of rocks) { if (Math.hypot(x - r.x, y - r.y) < radius + r.size + 10) return false; } return true; }
function showItemFeedback(text, color) { let el = document.createElement('div'); el.className = 'item-feedback'; el.innerHTML = text; el.style.color = color; el.style.left = (canvas.width/2 - 150) + 'px'; el.style.top = (canvas.height/2 - 80) + 'px'; el.style.width = "300px"; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); }

function gameLoop() { if (gameState !== "PLAYING") return; if (!paused) { update(); draw(); } requestAnimationFrame(gameLoop); }

function update() {
    frameCount++; let dx = 0; let dy = 0;
    if (controlMode === 'pc') { if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1; if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1; if (dx !== 0 && dy !== 0) { let len = Math.hypot(dx, dy); dx /= len; dy /= len; } } else { dx = joyX; dy = joyY; }
    let moveX = dx * player.speed; let moveY = dy * player.speed; let canMoveX = true; let canMoveY = true;
    for (let r of rocks) { if (Math.hypot((player.x + moveX) - r.x, player.y - r.y) < player.size + r.size) canMoveX = false; if (Math.hypot(player.x - r.x, (player.y + moveY) - r.y) < player.size + r.size) canMoveY = false; }
    if (canMoveX) player.x += moveX; if (canMoveY) player.y += moveY;

    if (player.maxShield > 0) { player.lastHitTimer++; if (player.lastHitTimer > 180 && player.shield < player.maxShield) { player.shield = Math.min(player.maxShield, player.shield + 0.3); updateBarsUI(); } }
    if (player.iFrames > 0) player.iFrames--;

    if (player.hasOrbs) { player.orbAngle += 0.05; let orbDist = 100; let o1x = player.x + Math.cos(player.orbAngle)*orbDist; let o1y = player.y + Math.sin(player.orbAngle)*orbDist; let o2x = player.x + Math.cos(player.orbAngle + Math.PI)*orbDist; let o2y = player.y + Math.sin(player.orbAngle + Math.PI)*orbDist; if (frameCount % 4 === 0) { player.orbTrail.push({x: o1x, y: o1y, life: 60}); player.orbTrail.push({x: o2x, y: o2y, life: 60}); } player.orbTrail.forEach(t => { t.life--; enemies.forEach(e => { if (Math.hypot(e.x - t.x, e.y - t.y) < e.size + 10) { e.hp -= 0.6; e.hitTimer = 5; } }); }); player.orbTrail = player.orbTrail.filter(t => t.life > 0); }

    player.miniMes.forEach((m, index) => { let targetAngle = (index * Math.PI * 2) / Math.max(1, player.miniMes.length) + (frameCount * 0.02); let tx = player.x + Math.cos(targetAngle) * 60; let ty = player.y + Math.sin(targetAngle) * 60; m.x += (tx - m.x) * 0.1; m.y += (ty - m.y) * 0.1; m.fireTimer++;
        if (m.fireTimer >= 40) { let targets = enemies.filter(t => Math.hypot(t.x - m.x, t.y - m.y) <= 400); if (targets.length > 0) { let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - m.x, curr.y - m.y) < Math.hypot(prev.x - m.x, prev.y - m.y) ? curr : prev); let angle = Math.atan2(closest.y - m.y, closest.x - m.x); bullets.push({ x: m.x, y: m.y, startX: m.x, startY: m.y, vx: Math.cos(angle)*15, vy: Math.sin(angle)*15, damage: 8, size: 5, color: "cyan", range: 400, weaponId: 'fucile' }); m.fireTimer = 0; } }
        enemies.forEach(e => { if (Math.hypot(e.x - m.x, e.y - m.y) < e.size + 10) m.hp -= 1; }); enemyBullets.forEach((b, bi) => { if (Math.hypot(b.x - m.x, b.y - m.y) < 15) { m.hp -= b.damage; enemyBullets.splice(bi, 1); } }); });
    player.miniMes = player.miniMes.filter(m => m.hp > 0); 

    let hasTrailAmulet = equippedItems.amuleto === 'amu_ice' || equippedItems.amuleto === 'amu_fire';
    let trailType = equippedItems.amuleto === 'amu_ice' ? 'ice' : 'fire';

    // --- BALISTICA ARMI ---
    player.weapons.forEach((w, index) => {
        w.fireTimer++;
        if (w.fireTimer >= w.currentFireRate) {
            let targets = enemies.concat(rocks).filter(t => Math.hypot(t.x - player.x, t.y - player.y) <= w.range);
            if (targets.length > 0) {
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev);
                let angle = Math.atan2(closest.y - player.y, closest.x - player.x);
                let handOffsetX = 15; let handOffsetY = (index === 0) ? 15 : -15; 
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
                                if (hasTrailAmulet) { if (trailType === 'ice') { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.2; } else { e.burnTimer = 180; } }
                                if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); }
                            }
                        });
                        rocks.forEach(r => { if (r.hp > 0 && distToSegment(r.x, r.y, spawnX, spawnY, endX, endY) < r.size + 20) { r.hp -= w.currentDamage; if(r.hp <= 0 && !r.dead){ r.dead=true; gems.push({ x: r.x, y: r.y, isSuper: true }); } } });
                    }
                } else {
                    bullets.push({ x: spawnX, y: spawnY, startX: spawnX, startY: spawnY, vx: cosA * w.speed, vy: sinA * w.speed, damage: w.currentDamage, size: w.bulletSize, color: w.color, range: w.range, weaponId: w.id, level: w.level });
                }
                w.fireTimer = 0;
            }
        }
    });

    beams.forEach(b => b.life--); beams = beams.filter(b => b.life > 0);

    for (let i = bullets.length - 1; i >= 0; i--) { 
        let b = bullets[i]; let oldX = b.x; let oldY = b.y; b.x += b.vx; b.y += b.vy; 
        
        // MODIFICATA SCIAL AMULETO: Più piccola (radius 10)
        if (hasTrailAmulet && frameCount % 3 === 0) { elementalTrails.push({ x: b.x, y: b.y, type: trailType, radius: 10, life: 60, maxLife: 60 }); }

        let outOfRange = Math.hypot(b.x - b.startX, b.y - b.startY) > b.range;
        if (outOfRange) { 
            if (b.weaponId === 'granata') explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'});
            else if (b.weaponId === 'freezer') explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: b.damage, life: 180, maxLife: 180, type: 'ice'});
            bullets.splice(i, 1); continue; 
        } 
        let hitRock = false;
        for (let ri = rocks.length - 1; ri >= 0; ri--) { 
            let r = rocks[ri]; 
            if (distToSegment(r.x, r.y, oldX, oldY, b.x, b.y) < r.size + b.size/2 + 5) { 
                if (b.weaponId === 'granata') { explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'}); } 
                else if (b.weaponId === 'freezer') { explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: b.damage, life: 180, maxLife: 180, type: 'ice'}); } 
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

    // GESTIONE ESPLOSIONI E AREE DI GHIACCIO
    explosions.forEach(exp => {
        if (exp.type === 'ice') {
            if (frameCount % 10 === 0 || exp.life === exp.maxLife) {
                enemies.forEach(e => {
                    if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) {
                        if (exp.life === exp.maxLife && exp.damage > 0) { e.hp -= exp.damage; e.hitTimer = 5; if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); return; } }
                        e.frozenTimer = 180; e.speed = e.originalSpeed * 0.3;
                    }
                });
            }
        } else {
            if (exp.life === exp.maxLife) { 
                enemies.forEach(e => {
                    if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) {
                        e.hp -= exp.damage; e.hitTimer = 5;
                        if (hasTrailAmulet) { if (trailType === 'ice') { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.2; } else { e.burnTimer = 180; } }
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
        if (Math.hypot(b.x - player.x, b.y - player.y) > 1500) { enemyBullets.splice(i, 1); continue; } 
        let hitRock = false; for (let r of rocks) { if (distToSegment(r.x, r.y, oldX, oldY, b.x, b.y) < r.size) { hitRock = true; break; } } 
        if(hitRock) { enemyBullets.splice(i, 1); continue; } 
        if (distToSegment(player.x, player.y, oldX, oldY, b.x, b.y) < player.size + 5) { 
            if (Math.random() < elmoDodge) { showItemFeedback("SCHIVATA!", "#00ffff"); } else { damagePlayer(b.damage); }
            enemyBullets.splice(i, 1); 
        } 
    }
    
    // Generazione Casse Normali
    if (Math.random() < 0.0008 && chests.length < 3) { let angle = Math.random() * Math.PI * 2; let dist = 500 + Math.random() * 1000; let cx = player.x + Math.cos(angle) * dist; let cy = player.y + Math.sin(angle) * dist; if(isPositionFree(cx, cy, 25)) chests.push({ x: cx, y: cy, size: 25, isSpecial: false, isEpic: false }); }
    
    // Generazione Cassa Epica e Sassi (Molto Rara)
    if (Math.random() < 0.0003) {
        let angle = Math.random() * Math.PI * 2; let dist = 800 + Math.random() * 1000; let cx = player.x + Math.cos(angle) * dist; let cy = player.y + Math.sin(angle) * dist; 
        if(isPositionFree(cx, cy, 60)) {
            chests.push({ x: cx, y: cy, size: 30, isEpic: true, isSpecial: false });
            for(let i=0; i<8; i++) { let ra = i * (Math.PI / 4); rocks.push({ x: cx + Math.cos(ra)*55, y: cy + Math.sin(ra)*55, size: 25, hp: 200, dead: false }); }
            showItemFeedback("✨ CASSA EPICA!", "#ff00ff");
        }
    }

    for (let i = chests.length - 1; i >= 0; i--) { 
        let c = chests[i]; 
        if (Math.hypot(player.x - c.x, player.y - c.y) < player.size + c.size) { 
            chests.splice(i, 1); 
            if (c.isEpic) { showEpicChestModal(); }
            else if (c.isSpecial) { showBossRelicModal(); } 
            else { 
                let rand = Math.random(); 
                if (rand < 0.4) { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5); updateBarsUI(); showItemFeedback("✚ CURA", "#00ff00"); } 
                else if (rand < 0.7) { let sd = Math.max(canvas.width, canvas.height); enemies.forEach(e => { if(Math.hypot(e.x - player.x, e.y - player.y) < sd) { if (e.type !== 'miniboss') e.hp -= 10000; else e.hp -= 500; e.hitTimer = 5; } }); showItemFeedback("💣 BOMBA!", "#ff4500"); } 
                else { showItemFeedback("⬆️ POTENZIAMENTO!", "#ffff00"); freeUpgrade(); } 
            } 
        } 
    }
    for (let i = rocks.length - 1; i >= 0; i--) { if(rocks[i].dead) { rocks.splice(i,1); } else if (Math.hypot(player.x - rocks[i].x, player.y - rocks[i].y) > 2000) rocks.splice(i, 1); }
    while(rocks.length < 15) { let valid = false; let attempts = 0; let rx, ry, rSize; while(!valid && attempts < 10) { let angle = Math.random() * Math.PI * 2; rx = player.x + Math.cos(angle) * (1000 + Math.random() * 500); ry = player.y + Math.sin(angle) * (1000 + Math.random() * 500); rSize = 25 + Math.random() * 20; valid = isPositionFree(rx, ry, rSize); attempts++; } if (valid) rocks.push({ x: rx, y: ry, size: rSize, hp: 30 }); }
    
    let spawnDelay = Math.max(30, 120 - (level * 10)); 
    if (frameCount % spawnDelay === 0) { 
        let numToSpawn = 1 + Math.floor(level / 3); 
        for(let i = 0; i < numToSpawn; i++) { 
            let valid = false; let attempts = 0; let ex, ey; 
            while(!valid && attempts < 10) { let angle = Math.random() * Math.PI * 2; let radius = Math.max(canvas.width, canvas.height) / 1.5; ex = player.x + Math.cos(angle) * radius; ey = player.y + Math.sin(angle) * radius; valid = isPositionFree(ex, ey, 22); attempts++; } 
            if(valid) { 
                let type = 'melee'; let color = 'red'; let hp = 10 + (level * 5); let speed = 1.5 + Math.random(); let size = 12; 
                if (level >= 2 && Math.random() < 0.25) { type = 'shooter'; color = 'purple'; speed = 0.8; hp = hp * 0.8; } 
                else if (level >= 4 && Math.random() < 0.15) { type = 'tank'; color = 'darkred'; hp = hp * 2; speed = 0.6; size = 22; } 
                enemies.push({ x: ex, y: ey, hp: hp, maxHp: hp, speed: speed, originalSpeed: speed, size: size, type: type, color: color, fireTimer: 0, hitTimer: 0, frozenTimer: 0, burnTimer: 0, dead: false }); 
            } 
        } 
    }
    
    let corazzaDodge = getEquipStat('corazza');
    for (let ei = enemies.length - 1; ei >= 0; ei--) { 
        let e = enemies[ei]; 
        if (e.dead) { enemies.splice(ei, 1); continue; } 
        if (Math.hypot(player.x - e.x, player.y - e.y) > 2500) { enemies.splice(ei, 1); continue; } 
        
        if (e.hitTimer > 0) e.hitTimer--;
        if (e.frozenTimer > 0) { e.frozenTimer--; if (e.frozenTimer <= 0) e.speed = e.originalSpeed; }
        if (e.burnTimer > 0) { e.burnTimer--; if (e.burnTimer % 30 === 0) { e.hp -= 10; e.hitTimer = 5; if(e.hp <= 0 && !e.dead) { e.dead=true; handleEnemyDeath(e, ei); continue; } } }

        let dx = player.x - e.x; let dy = player.y - e.y; let angle = Math.atan2(dy, dx); e.x += Math.cos(angle) * e.speed; e.y += Math.sin(angle) * e.speed; 
        if (e.type === 'shooter') { e.fireTimer++; if (e.fireTimer >= 100) { enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle)*5, vy: Math.sin(angle)*5, damage: 10 }); e.fireTimer = 0; } } 
        
        if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) { 
            if (player.iFrames <= 0) { if (Math.random() < corazzaDodge) { showItemFeedback("SCHIVATA!", "#00ff00"); player.iFrames = 20; } else { damagePlayer(1); player.iFrames = 10; } }
        } 
        
        for (let bi = bullets.length - 1; bi >= 0; bi--) { 
            let b = bullets[bi]; 
            if (distToSegment(e.x, e.y, b.x - b.vx, b.y - b.vy, b.x, b.y) < e.size + b.size + 35) { 
                if (b.weaponId === 'granata') { explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'}); } 
                else if (b.weaponId === 'freezer') { explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: b.damage, life: 180, maxLife: 180, type: 'ice'}); }
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
            if (g.isCrystal) { totalCrystals++; sessionCrystals++; localStorage.setItem('survivorCrystals', totalCrystals); document.getElementById('crystal-count').innerText = sessionCrystals; showItemFeedback("+1 💎", "#bf00ff"); } 
            else { xp += g.isSuper ? 3 : 1; document.getElementById('xp-bar').style.width = Math.min((xp / xpNeeded * 100), 100) + '%'; if (xp >= xpNeeded) levelUp(); }
            gems.splice(gi, 1); 
        } 
    }
}

function handleEnemyDeath(e, ei) {
    if (e.type === 'miniboss') { chests.push({ x: e.x, y: e.y, size: 35, isSpecial: true, isEpic: false }); showItemFeedback("🏆 CASSA SUPREMA!", "gold"); for(let c=0; c<15; c++) gems.push({ x: e.x + Math.random()*80-40, y: e.y + Math.random()*80-40, isCrystal: true }); } 
    else { if (Math.random() < 0.02) { gems.push({ x: e.x, y: e.y, isCrystal: true }); } else { gems.push({ x: e.x, y: e.y, isSuper: false }); } } 
    if (ei > -1) enemies.splice(ei, 1);
}

function drawProjectile(b, camX, camY) {
    ctx.shadowBlur = 10; ctx.shadowColor = b.color; let px = b.x - camX; let py = b.y - camY;
    if (b.weaponId === 'razzo') { let s = b.size; ctx.fillStyle = b.color; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s/2, -s/2); ctx.lineTo(-s/2, s/2); ctx.fill(); ctx.restore(); } 
    else if (b.weaponId === 'bastone') { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); } 
    else if (b.weaponId === 'granata') { ctx.fillStyle = "#2a4d20"; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#eeddaa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py - b.size*0.8); ctx.lineTo(px + b.size, py - b.size*1.5); ctx.stroke(); } 
    else if (b.weaponId === 'freezer') { let s = b.size; ctx.fillStyle = b.color; ctx.save(); ctx.translate(px, py); ctx.rotate(frameCount*0.1); ctx.beginPath(); let inner=s/3; let outer=s; for(let i=0;i<8;i++){let rad=(i%2===0)?outer:inner;let a=i*Math.PI/4;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);} ctx.fill(); ctx.restore(); } 
    else if (b.weaponId === 'fucile') { ctx.strokeStyle = b.color; ctx.lineWidth = b.size; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - b.vx*1.5, py - b.vy*1.5); ctx.stroke(); } 
    else { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); }
    ctx.shadowBlur = 0;
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
    
    elementalTrails.forEach(t => { let alpha = t.life / t.maxLife; ctx.fillStyle = t.type === 'ice' ? `rgba(0, 255, 255, ${alpha * 0.4})` : `rgba(255, 100, 0, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(t.x - camX, t.y - camY, t.radius, 0, Math.PI*2); ctx.fill(); });
    ctx.fillStyle = '#666'; ctx.strokeStyle = '#444'; ctx.lineWidth = 4; rocks.forEach(r => { ctx.beginPath(); ctx.arc(r.x - camX, r.y - camY, r.size, 0, Math.PI*2); ctx.fill(); ctx.stroke(); });
    
    explosions.forEach(exp => { 
        let alpha = exp.life / exp.maxLife; 
        if(exp.type === 'ice') {
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = `rgba(100, 255, 255, ${alpha})`; ctx.lineWidth = 2; ctx.stroke();
        } else {
            ctx.fillStyle = `rgba(255, 80, 0, ${alpha * 0.5})`; ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill(); 
            ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`; ctx.lineWidth = 3; ctx.stroke(); 
        }
    });

    chests.forEach(c => { 
        let chestWidth = c.size * 2.8; let chestHeight = c.size * 1.8; let drawX = c.x - camX - (chestWidth / 2); let drawY = c.y - camY - (chestHeight / 2); 
        if (c.isSpecial) { 
            ctx.shadowBlur = 30; ctx.shadowColor = 'red'; ctx.fillStyle = '#aa0000'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); 
            ctx.fillStyle = 'gold'; ctx.fillRect(drawX + chestWidth/2 - 8, drawY + chestHeight/2 - 10, 16, 20); ctx.shadowBlur = 0; 
        } else if (c.isEpic) {
            if(chestEpicImg.complete && chestEpicImg.naturalWidth > 0) { ctx.drawImage(chestEpicImg, drawX, drawY, chestWidth, chestHeight); }
            else { ctx.fillStyle = '#bf00ff'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); ctx.fillStyle = 'gold'; ctx.fillRect(drawX + chestWidth/2 - 4, drawY + chestHeight/2 - 6, 8, 12); }
        } else if(chestImg.complete && chestImg.naturalWidth > 0) { ctx.drawImage(chestImg, drawX, drawY, chestWidth, chestHeight); } 
        else { ctx.fillStyle = '#8B4513'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); ctx.fillStyle = '#3a1c05'; ctx.fillRect(drawX, drawY + chestHeight/2 - 4, chestWidth, 8); ctx.fillStyle = 'gold'; ctx.fillRect(drawX + chestWidth/2 - 4, drawY + chestHeight/2 - 6, 8, 12); } 
    });

    if(player.hasOrbs) { let orbDist = 100; player.orbTrail.forEach(t => { ctx.fillStyle = `rgba(255, 255, 255, ${t.life/60})`; ctx.beginPath(); ctx.arc(t.x - camX, t.y - camY, 8, 0, Math.PI*2); ctx.fill(); }); let o1x = player.x + Math.cos(player.orbAngle)*orbDist; let o1y = player.y + Math.sin(player.orbAngle)*orbDist; let o2x = player.x + Math.cos(player.orbAngle + Math.PI)*orbDist; let o2y = player.y + Math.sin(player.orbAngle + Math.PI)*orbDist; ctx.fillStyle = 'white'; ctx.shadowBlur = 10; ctx.shadowColor = 'white'; ctx.beginPath(); ctx.arc(o1x - camX, o1y - camY, 5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(o2x - camX, o2y - camY, 5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
    player.miniMes.forEach(m => { let cx = m.x - camX; let cy = m.y - camY; ctx.fillStyle = '#00aaaa'; ctx.fillRect(cx - 8, cy - 8, 16, 20); ctx.beginPath(); ctx.arc(cx, cy - 10, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'red'; ctx.fillRect(cx - 10, cy - 25, 20, 4); ctx.fillStyle = 'lime'; ctx.fillRect(cx - 10, cy - 25, 20 * (m.hp/m.maxHp), 4); });
    
    gems.forEach(g => { 
        if (g.isCrystal) { ctx.fillStyle = '#bf00ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#bf00ff'; let dx = g.x - camX; let dy = g.y - camY; ctx.beginPath(); ctx.moveTo(dx, dy - 10); ctx.lineTo(dx + 8, dy); ctx.lineTo(dx, dy + 10); ctx.lineTo(dx - 8, dy); ctx.fill(); ctx.shadowBlur = 0; } 
        else { ctx.fillStyle = g.isSuper ? '#ffa500' : '#00ffff'; ctx.beginPath(); ctx.arc(g.x - camX, g.y - camY, g.isSuper ? 8 : 4, 0, Math.PI*2); ctx.fill(); }
    });

    ctx.fillStyle = '#ff00ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff'; enemyBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 6, 0, Math.PI*2); ctx.fill(); }); ctx.shadowBlur = 0;

    bullets.forEach(b => { drawProjectile(b, camX, camY); });
    beams.forEach(b => { ctx.save(); let alpha = b.life / b.maxLife; ctx.globalAlpha = alpha; ctx.strokeStyle = b.color; ctx.lineWidth = 15 * alpha; ctx.lineCap = "round"; ctx.shadowBlur = 20; ctx.shadowColor = b.color; ctx.beginPath(); ctx.moveTo(b.x - camX, b.y - camY); ctx.lineTo(b.x - camX + Math.cos(b.angle)*b.range, b.y - camY + Math.sin(b.angle)*b.range); ctx.stroke(); ctx.strokeStyle = "white"; ctx.lineWidth = 5 * alpha; ctx.stroke(); ctx.restore(); });

    enemies.forEach(e => { 
        let bx = e.x - camX; let by = e.y - camY; 
        let currentFill = e.color; if (e.hitTimer > 0) currentFill = "white"; else if (e.frozenTimer > 0) currentFill = "#aaddff"; else if (e.burnTimer > 0) currentFill = "#ff6600";
        let armColor = '#8b0000'; if(e.type === 'miniboss') armColor = '#b8860b'; else if(e.type === 'tank') armColor = '#5a0000'; else if(e.type === 'shooter') armColor = '#4b0082'; 
        if(e.type === 'miniboss') { ctx.shadowBlur = 20; ctx.shadowColor = 'gold'; } 
        let armOffset = Math.sin(frameCount * 0.05 + e.x) * (e.size * 0.5); let bodyW = e.size * 0.8; let bodyH = e.size * 1.2; let armW = e.size * 1.0; let armH = e.size * 1.8; 
        ctx.fillStyle = armColor; ctx.fillRect(bx - bodyW/2 - armW + 2, by - bodyH/2 + armOffset, armW, armH); ctx.fillRect(bx + bodyW/2 - 2, by - bodyH/2 - armOffset, armW, armH); 
        if(e.type === 'shooter') { ctx.fillStyle = '#555'; let handY = by - bodyH/2 - armOffset + armH - 4; ctx.fillRect(bx + bodyW/2 + armW/2, handY, e.size*1.5, 5); ctx.fillRect(bx + bodyW/2 + armW/2, handY, 5, 10); } 
        ctx.fillStyle = currentFill; ctx.fillRect(bx - bodyW/2, by - bodyH/2, bodyW, bodyH); ctx.beginPath(); ctx.arc(bx, by - bodyH/2 - e.size*0.3, e.size * 0.9, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; 
        if(e.type === 'miniboss') { ctx.fillStyle = 'black'; ctx.fillRect(bx - 40, by - e.size*2.5, 80, 8); ctx.fillStyle = 'red'; ctx.fillRect(bx - 40, by - e.size*2.5, 80 * (Math.max(0, e.hp)/e.maxHp), 8); } 
    });

    let screenCenterX = viewW / 2; let screenCenterY = viewH / 2;
    
    player.weapons.forEach((w, index) => {
        let targets = enemies.concat(rocks).filter(t => Math.hypot(t.x - player.x, t.y - player.y) <= w.range); let angle = 0;
        if (targets.length > 0) { let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev); angle = Math.atan2(closest.y - player.y, closest.x - player.x); }
        ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle); let handOffsetY = (index === 0) ? 15 : -15; ctx.translate(15, handOffsetY); 
        if (Math.abs(angle) > Math.PI / 2) { ctx.scale(1, -1); }
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

    // --- BUSSOLE ---
    let normalChests = chests.filter(c => !c.isSpecial && !c.isEpic);
    if (normalChests.length > 0) { let closestChest = normalChests.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev); let dist = Math.hypot(closestChest.x - player.x, closestChest.y - player.y); if (dist > 200 && dist < 1500) { let angle = Math.atan2(closestChest.y - player.y, closestChest.x - player.x); ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle); ctx.fillStyle = 'gold'; ctx.shadowColor = 'yellow'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(60, -15); ctx.lineTo(60, 15); ctx.fill(); ctx.restore(); } }
    
    let bossChests = chests.filter(c => c.isSpecial);
    if (bossChests.length > 0) {
        let closestBossChest = bossChests.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev);
        let dist = Math.hypot(closestBossChest.x - player.x, closestBossChest.y - player.y);
        if (dist > 150) { 
            let angle = Math.atan2(closestBossChest.y - player.y, closestBossChest.x - player.x);
            ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle);
            ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20; // Bussola Fucsia Boss!
            ctx.beginPath(); ctx.moveTo(100, 0); ctx.lineTo(75, -20); ctx.lineTo(75, 20); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "20px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("💀", 60, 0);
            ctx.restore();
        }
    }

    let boss = enemies.find(e => e.type === 'miniboss'); if (boss) { let dist = Math.hypot(boss.x - player.x, boss.y - player.y); if (dist > 250) { let angle = Math.atan2(boss.y - player.y, boss.x - player.x); ctx.save(); ctx.translate(screenCenterX, screenCenterY); let cx = Math.cos(angle) * 110; let cy = Math.sin(angle) * 110; ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.fillStyle = '#ff0000'; ctx.shadowColor = 'red'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(0, -15); ctx.lineTo(0, 15); ctx.fill(); ctx.restore(); ctx.font = "28px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = "red"; ctx.shadowBlur = 15; ctx.fillText("💀", cx - Math.cos(angle)*25, cy - Math.sin(angle)*25); ctx.restore(); } }
    
    ctx.restore(); 
}

function buildUpgradePool() {
    let pool = [];
    player.weapons.forEach(w => { pool.push({ name: `<span class="upgrade-title" style="color:${w.color}">⏫ Potenzia ${w.name} (Lv.${w.level + 1})</span><span class="upgrade-desc">Danni e velocità incrementati</span>`, apply: () => { w.level++; if (w.id !== 'freezer') w.currentDamage += Math.floor(w.baseDamage * 0.4); w.currentFireRate = Math.max(5, w.currentFireRate - (w.id === 'freezer' ? 8 : 5)); updateWeaponsUI(); finishUpgrade(); } }); });
    let charWeapons = CHARACTERS.find(c => c.id === player.charId).weapons;
    charWeapons.forEach(wId => { let wt = WEAPONS_DB[wId]; if (!player.weapons.find(owned => owned.id === wt.id)) { pool.push({ name: `<span class="upgrade-title" style="color:${wt.color}">🆕 Prendi: ${wt.name}</span><span class="upgrade-desc">Aggiungi all'arsenale</span>`, apply: () => { handleNewWeapon(wt); } }); } });
    pool.push({ name: `<span class="upgrade-title">🏃 Velocità Movimento</span><span class="upgrade-desc">Corri più veloce</span>`, apply: () => { player.speed += 1; finishUpgrade(); } });
    pool.push({ name: `<span class="upgrade-title">🧲 Raggio Magnetico</span><span class="upgrade-desc">Raccogli da più lontano</span>`, apply: () => { player.pickupRange += 40; finishUpgrade(); } });
    return pool;
}

function levelUp() { paused = true; xp = xp - xpNeeded; xpNeeded = Math.floor(xpNeeded * 1.5); level++; document.getElementById('lvl').innerText = level; document.getElementById('xp-bar').style.width = (Math.max(0, xp) / xpNeeded * 100) + '%'; let pool = buildUpgradePool(); let shuffled = pool.sort(() => 0.5 - Math.random()); currentChoices = shuffled.slice(0, 3); for(let i=0; i<3; i++) { let btn = document.getElementById('btn'+i); btn.innerHTML = currentChoices[i].name; btn.onclick = () => { document.getElementById('levelup-modal').style.display = 'none'; currentChoices[i].apply(); }; } document.getElementById('levelup-title').innerText = "Livello Superato!"; document.getElementById('levelup-title').style.color = "#00ffff"; document.getElementById('levelup-modal').style.display = 'block'; if (level % 5 === 0 && player.lastBossLevel !== level) { player.lastBossLevel = level; let bossHp = 2000 * (level / 5); let bossSpeed = 0.8 + (level * 0.02); enemies.push({ x: player.x, y: player.y - 600, hp: bossHp, maxHp: bossHp, speed: bossSpeed, originalSpeed: bossSpeed, size: 35, type: 'miniboss', color: 'gold', fireTimer: 0, hitTimer: 0, frozenTimer: 0, burnTimer: 0, dead: false }); setTimeout(() => { showItemFeedback("⚠️ TITANO IN ARRIVO! ⚠️", "#ff0000"); }, 500); } }
function freeUpgrade() { paused = true; let pool = buildUpgradePool(); let shuffled = pool.sort(() => 0.5 - Math.random()); currentChoices = shuffled.slice(0, 3); for(let i=0; i<3; i++) { let btn = document.getElementById('btn'+i); btn.innerHTML = currentChoices[i].name; btn.onclick = () => { document.getElementById('levelup-modal').style.display = 'none'; currentChoices[i].apply(); }; } document.getElementById('levelup-title').innerText = "Cassa: Scelta Gratuita!"; document.getElementById('levelup-title').style.color = "#ffff00"; document.getElementById('levelup-modal').style.display = 'block'; }
function showBossRelicModal() { paused = true; let pool = [ { name: `<span class="upgrade-title">🌀 Palle Rotanti</span><span class="upgrade-desc">2 sfere lasciano una scia dannosa</span>`, apply: () => { player.hasOrbs = true; closeBossModal(); } }, { name: `<span class="upgrade-title">🛡️ Scudo Rigenerativo</span><span class="upgrade-desc">Assorbe danni e si ricarica da solo</span>`, apply: () => { player.maxShield += 50; player.shield = player.maxShield; document.getElementById('shield-ui').style.display = 'flex'; updateBarsUI(); closeBossModal(); } } ]; if (player.miniMes.length < 3) { pool.push({ name: `<span class="upgrade-title">🤖 Mini Me</span><span class="upgrade-desc">Un robottino alleato che spara per te</span>`, apply: () => { player.miniMes.push({x: player.x, y: player.y, hp: 100, maxHp: 100, fireTimer: 0}); closeBossModal(); } }); } else { pool.push({ name: `<span class="upgrade-title">❤️ Titanico</span><span class="upgrade-desc">Aumenta e cura tutti gli HP</span>`, apply: () => { player.maxHp += 100; player.hp = player.maxHp; updateBarsUI(); closeBossModal(); } }); } for(let i=0; i<3; i++) { let btn = document.getElementById('boss-btn'+i); btn.innerHTML = pool[i].name; btn.onclick = pool[i].apply; } document.getElementById('boss-modal').style.display = 'block'; }
function closeBossModal() { document.getElementById('boss-modal').style.display = 'none'; paused = false; }

function showEpicChestModal() {
    paused = true;
    let randomRelic = ["🤖 Mini Me", "🌀 Palle Rotanti", "🛡️ Scudo Rigenerativo"][Math.floor(Math.random()*3)];
    let relicAction;
    if (randomRelic === "🤖 Mini Me") relicAction = () => { player.miniMes.push({x: player.x, y: player.y, hp: 100, maxHp: 100, fireTimer: 0}); closeEpicModal(); };
    if (randomRelic === "🌀 Palle Rotanti") relicAction = () => { player.hasOrbs = true; closeEpicModal(); };
    if (randomRelic === "🛡️ Scudo Rigenerativo") relicAction = () => { player.maxShield += 50; player.shield = player.maxShield; document.getElementById('shield-ui').style.display = 'flex'; updateBarsUI(); closeEpicModal(); };

    let pool = [
        { name: `<span class="upgrade-title" style="color:#bf00ff;">💎 20 Cristalli</span>`, apply: () => { totalCrystals+=20; sessionCrystals+=20; localStorage.setItem('survivorCrystals', totalCrystals); document.getElementById('crystal-count').innerText = sessionCrystals; closeEpicModal(); } },
        { name: `<span class="upgrade-title" style="color:#00ffff;">🎁 ${randomRelic}</span>`, apply: relicAction },
        { name: `<span class="upgrade-title" style="color:#00ff00;">❤️ Cura + ESP (2 Livelli)</span>`, apply: () => { player.hp = player.maxHp; updateBarsUI(); xp += xpNeeded + Math.floor(xpNeeded * 1.5); closeEpicModal(); } }
    ];
    for(let i=0; i<3; i++) { let btn = document.getElementById('epic-btn'+i); btn.innerHTML = pool[i].name; btn.onclick = pool[i].apply; }
    document.getElementById('epic-modal').style.display = 'block';
}
function closeEpicModal() { document.getElementById('epic-modal').style.display = 'none'; paused = false; }

function handleNewWeapon(weaponData) { if (player.weapons.length < 2) { giveWeapon(weaponData); finishUpgrade(); } else { pendingWeapon = weaponData; document.getElementById('new-weapon-name').innerHTML = `<span style="color:${weaponData.color}">${weaponData.name}</span>`; document.getElementById('rep-btn0').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[0].color}">Scarta ${player.weapons[0].name}</span><span class="upgrade-desc">Lv. ${player.weapons[0].level}</span>`; document.getElementById('rep-btn1').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[1].color}">Scarta ${player.weapons[1].name}</span><span class="upgrade-desc">Lv. ${player.weapons[1].level}</span>`; document.getElementById('replace-modal').style.display = 'block'; } }
function confirmReplace(slotIndex) { player.weapons[slotIndex] = { ...pendingWeapon, level: 1, currentDamage: pendingWeapon.baseDamage, currentFireRate: pendingWeapon.fireRate, fireTimer: 0 }; updateWeaponsUI(); document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function cancelReplace() { document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function finishUpgrade() { paused = false; }

showMenu();
