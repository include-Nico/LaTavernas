const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

// --- SALVATAGGI ---
let gameState = "MENU"; 
let paused = false; let frameCount = 0;
let maxLevelReached = parseInt(localStorage.getItem('survivorMaxLevel')) || 1;
let cheatUnlocked = localStorage.getItem('survivorCheat') === 'true'; 
let totalCrystals = parseInt(localStorage.getItem('survivorCrystals')) || 0;
let unlockedEquip = JSON.parse(localStorage.getItem('survivorUnlockedEquip')) || [];
let equippedItems = JSON.parse(localStorage.getItem('survivorEquipped')) || { elmo: null, corazza: null, amuleto1: null, amuleto2: null };
let hasDoubleAmulet = localStorage.getItem('survivorDoubleAmulet') === 'true';
let charLevels = JSON.parse(localStorage.getItem('survivorCharLevels')) || { 0:1, 1:1, 2:1 };

// STATISTICHE
let gameStats = JSON.parse(localStorage.getItem('survivorGameStats')) || { enemiesKilled: 0, bossesKilled: 0, maxLevelReached: 1, crystalsSpent: 0 };
maxLevelReached = Math.max(maxLevelReached, gameStats.maxLevelReached);

// MISSIONI
let todayStr = new Date().toDateString();
let dailyMissions = JSON.parse(localStorage.getItem('survivorDaily')) || { date: '', bossesKilled: 0, levelsGained: 0, itemsBought: 0, claim1: false, claim2: false, claim3: false };
if (dailyMissions.date !== todayStr) {
    dailyMissions = { date: todayStr, bossesKilled: 0, levelsGained: 0, itemsBought: 0, claim1: false, claim2: false, claim3: false };
    localStorage.setItem('survivorDaily', JSON.stringify(dailyMissions));
}

let selectedCharId = 0; 
let savedName = localStorage.getItem('survivorPlayerName') || ""; let activePlayerName = "Eroe";

let chestImg = new Image(); chestImg.src = 'chest.png';
let chestEpicImg = new Image(); chestEpicImg.src = 'chestepic.png';

let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
let controlMode = isTouchDevice ? 'mobile' : 'pc';

// VARIABILI GIOCO
let player = {};
let enemies = []; let bullets = []; let beams = []; let explosions = []; let elementalTrails = []; let enemyBullets = []; let gems = []; let rocks = []; let chests = [];
let xp = 0; let xpNeeded = 15; let level = 1; let currentChoices = []; let pendingWeapon = null; let sessionCrystals = 0;

let bossArena = { active: false, x: 0, y: 0, radius: 800 };
let rockTelegraphs = [];

let joyX = 0, joyY = 0; let isDraggingJoy = false; let joyStartX = 0, joyStartY = 0; const maxJoyDist = 55; 
const joyZone = document.getElementById('joystick-zone'); const joyBase = document.getElementById('joystick-base'); const joyStick = document.getElementById('joystick-stick');
let keys = {}; 

// DATABASE ARMI
const WEAPON_MODELS = {
    pistola: (ctx, s, c) => { ctx.fillStyle = "#bbbbbb"; ctx.fillRect(0, -s/4, s*1.5, s/2); ctx.fillStyle = "#444444"; ctx.fillRect(0, s/4, s/2, s/1.5); },
    fucile: (ctx, s, c) => { ctx.fillStyle = "#333333"; ctx.fillRect(0, -s/6, s*2, s/3); ctx.fillStyle = "#111111"; ctx.fillRect(s, -s/2, s/4, s/3); ctx.fillStyle = "#5c3a21"; ctx.fillRect(-s/2, s/6, s, s/2.5); },
    bastone: (ctx, s, c) => { ctx.fillStyle = "#6b3e1b"; ctx.fillRect(-s, -s/10, s*3.5, s/5); ctx.fillStyle = c; ctx.shadowBlur = 15; ctx.shadowColor = c; ctx.beginPath(); ctx.arc(s*2.5, 0, s/2.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "gold"; ctx.lineWidth = 3; ctx.stroke(); },
    laser: (ctx, s, c) => { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, -s/3, s*1.5, s/1.5); ctx.fillStyle = c; ctx.fillRect(s/2, -s/4, s/2, s/2); ctx.fillStyle = "#222222"; ctx.fillRect(-s/4, s/3, s/2, s/2); },
    granata: (ctx, s, c) => { ctx.fillStyle = "#2a4d20"; ctx.beginPath(); ctx.arc(s/2, 0, s/1.2, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#eeddaa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s/2, -s/1.2); ctx.lineTo(s/2 + s/2, -s*1.2); ctx.stroke(); },
    razzo: (ctx, s, c) => { ctx.fillStyle = "#445555"; ctx.fillRect(-s/2, -s/4, s*2, s/2); ctx.fillStyle = "#222222"; ctx.fillRect(-s/2, s/4, s/2, s/2); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(s*1.5, -s/3); ctx.lineTo(s*2.2, 0); ctx.lineTo(s*1.5, s/3); ctx.fill(); },
    freezer: (ctx, s, c) => { ctx.fillStyle = "#eeeeee"; ctx.fillRect(0, -s/4, s*1.2, s/2); ctx.fillStyle = "#333333"; ctx.fillRect(0, s/4, s/2, s/1.5); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-s/4, 0, s/1.5, 0, Math.PI*2); ctx.fill(); },
    bastone_veleno: (ctx, s, c) => { ctx.fillStyle = "#4a5d23"; ctx.fillRect(-s, -s/10, s*3.5, s/5); ctx.fillStyle = c; ctx.shadowBlur = 15; ctx.shadowColor = c; ctx.beginPath(); ctx.arc(s*2.5, 0, s/2.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "#113311"; ctx.lineWidth = 3; ctx.stroke(); },
    uzi: (ctx, s, c) => { ctx.fillStyle = "#555"; ctx.fillRect(0, -s/6, s*1.2, s/3); ctx.fillStyle = "#222"; ctx.fillRect(0, s/6, s/3, s/1.2); ctx.fillRect(s*0.8, s/6, s/4, s/2); },
    cerbottana: (ctx, s, c) => { ctx.fillStyle = "#8b5a2b"; ctx.fillRect(-s/2, -s/8, s*2.5, s/4); ctx.fillStyle = "#333"; ctx.fillRect(s*1.8, -s/6, s/4, s/3); }
};

const WEAPONS_DB = {
    pistola: { id: 'pistola', name: "Pistola", baseDamage: 12, fireRate: 45, range: 600, speed: 12, weaponSize: 15, bulletSize: 5, color: "silver", muzzleOffset: 25 },
    fucile:  { id: 'fucile',  name: "Fucile",  baseDamage: 8,  fireRate: 15, range: 800, speed: 20, weaponSize: 22, bulletSize: 3, color: "white", muzzleOffset: 45 },
    bastone: { id: 'bastone', name: "Bastone", baseDamage: 30, fireRate: 80, range: 1200, speed: 7, weaponSize: 20, bulletSize: 15, color: "#ff4500", muzzleOffset: 65 }, 
    laser:   { id: 'laser',   name: "Blaster", baseDamage: 18, fireRate: 40, range: 1500, speed: 0, weaponSize: 20, bulletSize: 4, color: "lime", muzzleOffset: 35 }, 
    granata: { id: 'granata', name: "Granate", baseDamage: 50, fireRate: 90, range: 400, speed: 8,  weaponSize: 16, bulletSize: 10, color: "#888", muzzleOffset: 15 },
    razzo:   { id: 'razzo',   name: "Razzo",   baseDamage: 60, fireRate: 100,range: 1000,speed: 10, weaponSize: 25, bulletSize: 14, color: "orange", muzzleOffset: 55 },
    freezer: { id: 'freezer', name: "Freezer", baseDamage: 20, fireRate: 35, range: 600, speed: 15, weaponSize: 20, bulletSize: 10, color: "#aaddff", muzzleOffset: 25 },
    bastone_veleno: { id: 'bastone_veleno', name: "Bastone Velenoso", baseDamage: 15, fireRate: 120, range: 150, speed: 0, weaponSize: 20, bulletSize: 0, color: "#00ff00", muzzleOffset: 0 }, 
    uzi: { id: 'uzi', name: "Uzi", baseDamage: 5, fireRate: 8, range: 500, speed: 18, weaponSize: 12, bulletSize: 3, color: "yellow", muzzleOffset: 15 },
    cerbottana: { id: 'cerbottana', name: "Cerbottana", baseDamage: 2, fireRate: 20, range: 700, speed: 22, weaponSize: 20, bulletSize: 4, color: "#800080", muzzleOffset: 30, poisonDamage: 5 }
};

const CHARACTERS = [ 
    { id: 0, name: "Recluta", desc: "Corpo Quadrato", reqLevel: 1, weapons: ['pistola', 'fucile', 'bastone'], lv2Weapon: 'bastone_veleno' }, 
    { id: 1, name: "Gelataio", desc: "Corpo a Cono", reqLevel: 10, weapons: ['pistola', 'laser', 'granata'], lv2Weapon: 'uzi' }, 
    { id: 2, name: "Punta", desc: "Corpo Piramidale", reqLevel: 15, weapons: ['pistola', 'razzo', 'freezer'], lv2Weapon: 'cerbottana' } 
];

const EQUIP_DB = {
    elmo: [ { id: 'elmo_1', name: 'Elmo Comune', desc: '15% Schivata Proiettili', price: 100, value: 0.15, icon: '🪖' }, { id: 'elmo_2', name: 'Elmo Raro', desc: '30% Schivata Proiettili', price: 300, value: 0.30, icon: '🪖' }, { id: 'elmo_3', name: 'Elmo Epico', desc: '50% Schivata Proiettili', price: 600, value: 0.50, icon: '👑' } ],
    corazza: [ { id: 'cor_1', name: 'Corazza Comune', desc: '15% Schivata Mischia', price: 100, value: 0.15, icon: '👕' }, { id: 'cor_2', name: 'Corazza Rara', desc: '30% Schivata Mischia', price: 300, value: 0.30, icon: '🦺' }, { id: 'cor_3', name: 'Corazza Epica', desc: '50% Schivata Mischia', price: 600, value: 0.50, icon: '🛡️' } ],
    amuleto: [ { id: 'amu_ice', name: 'Amuleto Ghiaccio', desc: 'Scia congelante (3s)', price: 1000, icon: '❄️' }, { id: 'amu_fire', name: 'Amuleto Fuoco', desc: 'Scia incendiaria (3s)', price: 1000, icon: '🔥' }, { id: 'amu_revive', name: 'Amuleto Fenice', desc: 'Rinasci 1 volta (50% HP)', price: 2000, icon: '❤️‍🔥' } ]
};

// --- INTERFACCIA E MISSIONI ---
function saveGameStats() { localStorage.setItem('survivorGameStats', JSON.stringify(gameStats)); }
function saveDailyMissions() { localStorage.setItem('survivorDaily', JSON.stringify(dailyMissions)); updateMissionBadge(); }
function checkDailyMissionsStatus() { let hasUnclaimed = false; if (dailyMissions.bossesKilled >= 5 && !dailyMissions.claim1) hasUnclaimed = true; if (dailyMissions.levelsGained >= 10 && !dailyMissions.claim2) hasUnclaimed = true; if (dailyMissions.itemsBought >= 1 && !dailyMissions.claim3) hasUnclaimed = true; return hasUnclaimed; }
function updateMissionBadge() { let badge = document.getElementById('mission-badge'); if(checkDailyMissionsStatus()) { badge.style.display = 'block'; } else { badge.style.display = 'none'; } }
function showMissionsModal() {
    let container = document.getElementById('missions-container'); container.innerHTML = '';
    let m1Prog = Math.min(dailyMissions.bossesKilled, 5); let m1Done = m1Prog >= 5;
    container.innerHTML += `<div class="mission-card"><p class="mission-title">💀 Uccidi 5 Boss</p><p class="mission-reward">Premio: 100 💎</p><div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m1Prog/5)*100}%;"></div></div><p style="font-size:12px; margin-top:0; text-align:right;">${m1Prog}/5</p>${dailyMissions.claim1 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m1Done ? '' : 'disabled'} onclick="claimMission(1, 100)">Riscuoti</button>`}</div>`;
    let m2Prog = Math.min(dailyMissions.levelsGained, 10); let m2Done = m2Prog >= 10;
    container.innerHTML += `<div class="mission-card"><p class="mission-title">⬆️ Guadagna 10 Livelli</p><p class="mission-reward">Premio: 20 💎</p><div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m2Prog/10)*100}%;"></div></div><p style="font-size:12px; margin-top:0; text-align:right;">${m2Prog}/10</p>${dailyMissions.claim2 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m2Done ? '' : 'disabled'} onclick="claimMission(2, 20)">Riscuoti</button>`}</div>`;
    let m3Prog = Math.min(dailyMissions.itemsBought, 1); let m3Done = m3Prog >= 1;
    container.innerHTML += `<div class="mission-card"><p class="mission-title">🎒 Acquista 1 Oggetto</p><p class="mission-reward">Premio: 50 💎</p><div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m3Prog/1)*100}%;"></div></div><p style="font-size:12px; margin-top:0; text-align:right;">${m3Prog}/1</p>${dailyMissions.claim3 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m3Done ? '' : 'disabled'} onclick="claimMission(3, 50)">Riscuoti</button>`}</div>`;
    document.getElementById('missions-modal').style.display = 'block';
}
function closeMissionsModal() { document.getElementById('missions-modal').style.display = 'none'; }
function claimMission(id, reward) { if (id === 1) dailyMissions.claim1 = true; if (id === 2) dailyMissions.claim2 = true; if (id === 3) dailyMissions.claim3 = true; totalCrystals += reward; localStorage.setItem('survivorCrystals', totalCrystals); saveDailyMissions(); showMissionsModal(); alert(`Hai ricevuto ${reward} Cristalli! 💎`); }
function savePlayerName() { let inputVal = document.getElementById('player-name-input').value.trim(); localStorage.setItem('survivorPlayerName', inputVal); savedName = inputVal; }
function showSettingsModal() { document.getElementById('stat-enemies').innerText = gameStats.enemiesKilled; document.getElementById('stat-bosses').innerText = gameStats.bossesKilled; document.getElementById('stat-maxlevel').innerText = gameStats.maxLevelReached; document.getElementById('stat-spent').innerText = gameStats.crystalsSpent; document.getElementById('settings-modal').style.display = 'block'; }
function closeSettingsModal() { document.getElementById('settings-modal').style.display = 'none'; }
function switchSettingsTab(tabName) { document.getElementById('tab-btn-cheat').classList.remove('active'); document.getElementById('tab-btn-stats').classList.remove('active'); document.getElementById('tab-content-cheat').style.display = 'none'; document.getElementById('tab-content-stats').style.display = 'none'; document.getElementById('tab-btn-' + tabName).classList.add('active'); document.getElementById('tab-content-' + tabName).style.display = 'block'; }
function checkCheatCode() {
    let input = document.getElementById('cheat-input').value.trim().toLowerCase(); 
    if (input === "160105") { cheatUnlocked = true; localStorage.setItem('survivorCheat', 'true'); unlockedEquip = []; ['elmo', 'corazza', 'amuleto'].forEach(cat => { EQUIP_DB[cat].forEach(item => unlockedEquip.push(item.id)); }); localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip)); charLevels = {0:3, 1:3, 2:3}; localStorage.setItem('survivorCharLevels', JSON.stringify(charLevels)); alert("✔️ CODICE ACCETTATO!\nTutti i personaggi (Lv.3) e gli equipaggiamenti sono sbloccati per sempre."); closeSettingsModal(); if(document.getElementById('equipment-select').style.display === 'flex') updateEquipMenuUI(); } 
    else if (input === "tesoro") { totalCrystals += 1000; localStorage.setItem('survivorCrystals', totalCrystals); alert("💎 +1000 CRISTALLI!\nHai ricevuto una fornitura di cristalli."); closeSettingsModal(); if(document.getElementById('equipment-select').style.display === 'flex') updateEquipMenuUI(); } 
    else if (input === "azzera") { localStorage.clear(); alert("🔄 PROGRESSI RESETTATI!\nIl gioco si riavvierà."); location.reload(); } 
    else { alert("❌ Codice errato."); } 
    document.getElementById('cheat-input').value = "";
}

function showEquipmentMenu() { document.getElementById('main-menu').style.display = 'none'; document.getElementById('equipment-select').style.display = 'flex'; updateEquipMenuUI(); }
function updateEquipMenuUI() {
    document.getElementById('menu-crystal-count').innerText = totalCrystals;
    let dAmCont = document.getElementById('double-amulet-container');
    if (hasDoubleAmulet) { dAmCont.innerHTML = `<span style="color:gold; font-weight:bold;">🎒 Zaino Sbloccato (2 Amuleti Equipaggiabili)!</span>`; } else { dAmCont.innerHTML = `<button class="equip-btn buy" style="background:#ffaa00; color:black;" ${totalCrystals >= 3000 ? '' : 'disabled'} onclick="buyDoubleAmulet()">Compra Zaino (💎 3000) - Sblocca 2° Amuleto</button>`; }
    const container = document.getElementById('equip-container'); container.innerHTML = '';
    ['elmo', 'corazza', 'amuleto'].forEach(category => {
        let catTitle = document.createElement('h3'); catTitle.className = 'equip-category-title'; catTitle.innerText = category === 'elmo' ? 'ELMI' : (category === 'corazza' ? 'CORAZZE' : 'AMULETI'); container.appendChild(catTitle);
        let row = document.createElement('div'); row.className = 'char-container';
        EQUIP_DB[category].forEach(item => {
            let isUnlocked = unlockedEquip.includes(item.id); 
            let isEquipped = equippedItems[category] === item.id || (category === 'amuleto' && (equippedItems.amuleto1 === item.id || equippedItems.amuleto2 === item.id));
            let card = document.createElement('div'); card.className = `char-card ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}`;
            let btnHtml = ''; if (isEquipped) { btnHtml = `<button class="equip-btn equipped" onclick="unequipItem('${category}', '${item.id}')">Rimuovi</button>`; } else if (isUnlocked) { btnHtml = `<button class="equip-btn equip" onclick="equipItem('${category}', '${item.id}')">Equipaggia</button>`; } else { let canAfford = totalCrystals >= item.price; btnHtml = `<button class="equip-btn buy" ${canAfford ? '' : 'disabled'} onclick="buyEquip('${item.id}', ${item.price})">Compra 💎 ${item.price}</button>`; }
            card.innerHTML = `<div style="font-size:40px; margin-bottom:10px;">${item.icon}</div><h3>${item.name}</h3><p style="color:#aaa; font-size:12px;">${item.desc}</p>${btnHtml}`; row.appendChild(card);
        }); container.appendChild(row);
    });
}
function buyDoubleAmulet() { if (totalCrystals >= 3000) { totalCrystals -= 3000; hasDoubleAmulet = true; gameStats.crystalsSpent += 3000; saveGameStats(); dailyMissions.itemsBought++; saveDailyMissions(); localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorDoubleAmulet', 'true'); updateEquipMenuUI(); } }
function buyEquip(id, price) { if (totalCrystals >= price) { totalCrystals -= price; unlockedEquip.push(id); gameStats.crystalsSpent += price; saveGameStats(); dailyMissions.itemsBought++; saveDailyMissions(); localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip)); updateEquipMenuUI(); } }
function equipItem(category, id) { if (category === 'amuleto') { if (!hasDoubleAmulet) { equippedItems.amuleto1 = id; equippedItems.amuleto2 = null; } else { if (!equippedItems.amuleto1) equippedItems.amuleto1 = id; else if (!equippedItems.amuleto2 && equippedItems.amuleto1 !== id) equippedItems.amuleto2 = id; else equippedItems.amuleto1 = id; } } else { equippedItems[category] = id; } localStorage.setItem('survivorEquipped', JSON.stringify(equippedItems)); updateEquipMenuUI(); }
function unequipItem(category, id) { if (category === 'amuleto') { if (equippedItems.amuleto1 === id) equippedItems.amuleto1 = null; if (equippedItems.amuleto2 === id) equippedItems.amuleto2 = null; } else { equippedItems[category] = null; } localStorage.setItem('survivorEquipped', JSON.stringify(equippedItems)); updateEquipMenuUI(); }
function getEquipStat(category) { if (!equippedItems[category]) return 0; let item = EQUIP_DB[category].find(x => x.id === equippedItems[category]); return item ? item.value : 0; }
function hasAmulet(amuletId) { return equippedItems.amuleto1 === amuletId || equippedItems.amuleto2 === amuletId; }

function upgradeChar(id) { if (charLevels[id] < 3 && totalCrystals >= 1000) { totalCrystals -= 1000; charLevels[id]++; gameStats.crystalsSpent += 1000; saveGameStats(); localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorCharLevels', JSON.stringify(charLevels)); showCharacterSelect(); } }
function showCharacterSelect() {
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('character-select').style.display = 'flex'; document.getElementById('char-crystal-count').innerText = totalCrystals;
    const container = document.getElementById('char-cards-container'); container.innerHTML = '';
    CHARACTERS.forEach(char => {
        let isUnlocked = cheatUnlocked || maxLevelReached >= char.reqLevel; let isSelected = selectedCharId === char.id;
        let cLevel = charLevels[char.id] || 1; let stars = "⭐".repeat(cLevel) + "☆".repeat(3-cLevel);
        let wList = [...char.weapons]; if (cLevel >= 2) wList.push(char.lv2Weapon); let wNames = wList.map(w => WEAPONS_DB[w].name).join(", ");
        let card = document.createElement('div'); card.className = `char-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
        let upgHtml = ''; if (isUnlocked && cLevel < 3) { upgHtml = `<button class="btn-level-up" ${totalCrystals < 1000 ? 'disabled' : ''} onclick="event.stopPropagation(); upgradeChar(${char.id})">Level Up (1000💎)</button>`; } else if (cLevel === 3) { upgHtml = `<p style="color:gold; font-size:12px; margin-top:10px;">MAX LEVEL<br>Può impugnare 3 armi!</p>`; }
        card.innerHTML = `<h3>${char.name} <br><span style="font-size:14px; color:gold;">${stars}</span></h3><p style="color:#aaa; font-size:14px;">${char.desc}</p><div class="char-weapons-list">${wNames}</div><p style="color:#00ffff; font-size:12px;">Armi base</p>${upgHtml}${!isUnlocked ? `<div class="lock-icon">🔒<br><span style="font-size:14px;">Liv. ${char.reqLevel}</span></div>` : ''}`;
        if (isUnlocked) { card.onclick = () => { selectedCharId = char.id; showCharacterSelect(); }; } container.appendChild(card);
    });
}

function showMenu() { updateMissionBadge(); gameState = "MENU"; document.getElementById('main-menu').style.display = 'flex'; document.getElementById('character-select').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'none'; document.getElementById('game-ui').style.display = 'none'; document.getElementById('equipment-select').style.display = 'none'; canvas.style.display = 'none'; document.getElementById('player-name-input').value = savedName; }
function backToMenu() { showMenu(); }
function togglePause() { 
    if (gameState !== "PLAYING") return; 
    let lvlModal = document.getElementById('levelup-modal').style.display; let bossModal = document.getElementById('boss-modal').style.display; let repModal = document.getElementById('replace-modal').style.display; let epicModal = document.getElementById('epic-modal').style.display;
    if (lvlModal === 'block' || bossModal === 'block' || repModal === 'block' || epicModal === 'block') return; 
    let pauseModal = document.getElementById('pause-modal'); if (paused) { paused = false; pauseModal.style.display = 'none'; } else { paused = true; pauseModal.style.display = 'block'; } 
}
function surrender() { document.getElementById('pause-modal').style.display = 'none'; player.hp = 0; updateBarsUI(); triggerGameOver(); }
function triggerGameOver() { paused = true; gameState = "GAMEOVER"; saveGameStats(); saveDailyMissions(); document.getElementById('run-crystals').innerText = sessionCrystals; document.getElementById('final-level').innerText = level; document.getElementById('game-ui').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'flex'; }
