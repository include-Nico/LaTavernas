// ==========================================
// file: main.js
// ==========================================

import { WEAPON_MODELS, WEAPONS_DB, CHARACTERS, EQUIP_DB } from './data.js';
import { 
    updateBadges, showMenu, updateEquipMenuUI, showCharacterSelect, 
    updateBarsUI, updateWeaponsUI, showItemFeedback, closeSettingsModal, showBattlePassModal, showMissionsModal
} from './ui.js';

export const canvas = document.getElementById('gameCanvas'); 
export const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

// --- SALVATAGGI E MEMORIA SICURI ---
export let gameState = "MENU"; export let paused = false; export let frameCount = 0;
export let cheatUnlocked = localStorage.getItem('survivorCheat') === 'true'; 
export let magoUnlocked = localStorage.getItem('survivorMagoUnlocked') === 'true';
export let totalCrystals = parseInt(localStorage.getItem('survivorCrystals')) || 0;
export let unlockedEquip = JSON.parse(localStorage.getItem('survivorUnlockedEquip')) || [];
export let equippedItems = JSON.parse(localStorage.getItem('survivorEquipped')) || { elmo: null, corazza: null, amuleto1: null, amuleto2: null };
export let hasDoubleAmulet = localStorage.getItem('survivorDoubleAmulet') === 'true';
export let charLevels = JSON.parse(localStorage.getItem('survivorCharLevels')) || { 0:1, 1:1, 2:1 };

let gsSaved = JSON.parse(localStorage.getItem('survivorGameStats'));
export let gameStats = gsSaved ? gsSaved : { enemiesKilled: 0, bossesKilled: 0, maxLevelReached: 1, crystalsSpent: 0 };
export let maxLevelReached = parseInt(localStorage.getItem('survivorMaxLevel')) || 1;
maxLevelReached = Math.max(maxLevelReached, gameStats.maxLevelReached);

let todayStr = new Date().toDateString();
let dmSaved = JSON.parse(localStorage.getItem('survivorDaily'));
export let dailyMissions = dmSaved ? dmSaved : { date: todayStr, bossesKilled: 0, levelsGained: 0, itemsBought: 0, claim1: false, claim2: false, claim3: false };
if (dailyMissions.date !== todayStr) { dailyMissions = { date: todayStr, bossesKilled: 0, levelsGained: 0, itemsBought: 0, claim1: false, claim2: false, claim3: false }; localStorage.setItem('survivorDaily', JSON.stringify(dailyMissions)); }

let bpSaved = JSON.parse(localStorage.getItem('survivorBattlePass'));
export let battlePass = bpSaved ? bpSaved : { monthStart: Date.now(), bosses: 0, claims: { 15: false, 30: false, 50: false, 100: false, 150: false } };
if(!battlePass.claims) battlePass.claims = { 15: false, 30: false, 50: false, 100: false, 150: false };
if(battlePass.weekStart && !battlePass.monthStart) { battlePass.monthStart = battlePass.weekStart; delete battlePass.weekStart; }
if(!battlePass.monthStart) battlePass.monthStart = Date.now();
if(Date.now() - battlePass.monthStart > 2592000000) { battlePass = { monthStart: Date.now(), bosses: 0, claims: { 15: false, 30: false, 50: false, 100: false, 150: false } }; localStorage.setItem('survivorBattlePass', JSON.stringify(battlePass)); }

export let selectedCharId = 0; export let savedName = localStorage.getItem('survivorPlayerName') || ""; export let activePlayerName = "Eroe";
window.changeSelectedCharId = function(id) { selectedCharId = id; }; 

export let chestImg = new Image(); chestImg.src = 'chest.png'; export let chestEpicImg = new Image(); chestEpicImg.src = 'chestepic.png';
export let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
export let controlMode = isTouchDevice ? 'mobile' : 'pc';

// --- VARIABILI DI GIOCO ---
export let player = {}; export let enemies = []; export let bullets = []; export let beams = []; export let explosions = []; export let elementalTrails = []; export let enemyBullets = []; export let gems = []; export let rocks = []; export let chests = []; export let electricArcs = []; export let decoys = [];
export let xp = 0; export let xpNeeded = 15; export let level = 1; export let currentChoices = []; export let pendingWeapon = null; export let sessionCrystals = 0;
export let bossArena = { active: false, x: 0, y: 0, radius: 800 }; export let rockTelegraphs = [];

let joyX = 0, joyY = 0; let isDraggingJoy = false; let joyStartX = 0, joyStartY = 0; const maxJoyDist = 55; 
const joyZone = document.getElementById('joystick-zone'); const joyBase = document.getElementById('joystick-base'); const joyStick = document.getElementById('joystick-stick');
let keys = {}; 

window.addEventListener('keydown', e => { let key = e.key.toLowerCase(); keys[key] = true; if (key === 'p' || e.key === 'Escape') togglePause(); }); 
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
joyZone.addEventListener('touchstart', handleJoyStart, {passive: false}); joyZone.addEventListener('touchmove', handleJoyMove, {passive: false}); joyZone.addEventListener('touchend', handleJoyEnd);

function handleJoyStart(e) { e.preventDefault(); let touch = e.touches[0]; joyStartX = touch.clientX; joyStartY = touch.clientY; joyBase.style.display = 'block'; joyBase.style.left = joyStartX + 'px'; joyBase.style.top = joyStartY + 'px'; isDraggingJoy = true; handleJoyMove(e); }
function handleJoyMove(e) { if (!isDraggingJoy) return; e.preventDefault(); let touch = e.touches[0]; let dx = touch.clientX - joyStartX; let dy = touch.clientY - joyStartY; let dist = Math.hypot(dx, dy); if (dist > maxJoyDist) { dx = (dx / dist) * maxJoyDist; dy = (dy / dist) * maxJoyDist; } joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; joyX = dx / maxJoyDist; joyY = dy / maxJoyDist; }
function handleJoyEnd(e) { if(e.touches.length === 0) { isDraggingJoy = false; joyBase.style.display = 'none'; joyStick.style.transform = `translate(-50%, -50%)`; joyX = 0; joyY = 0; } }

function distToSegment(px, py, x1, y1, x2, y2) { let l2 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2); if (l2 === 0) return Math.hypot(px - x1, py - y1); let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))); }
function isPositionFree(x, y, radius) { for (let r of rocks) { if (Math.hypot(x - r.x, y - r.y) < radius + r.size + 10) return false; } return true; }

// --- FUNZIONI DI GESTIONE DATI E SALVATAGGIO ---
function saveGameStats() { localStorage.setItem('survivorGameStats', JSON.stringify(gameStats)); }
function saveDailyMissions() { localStorage.setItem('survivorDaily', JSON.stringify(dailyMissions)); updateBadges(); }
function saveBattlePass() { localStorage.setItem('survivorBattlePass', JSON.stringify(battlePass)); updateBadges(); }
function savePlayerName() { let inputVal = document.getElementById('player-name-input').value.trim(); localStorage.setItem('survivorPlayerName', inputVal); savedName = inputVal; }

function checkCheatCode() {
    let input = document.getElementById('cheat-input').value.trim().toLowerCase(); 
    if (input === "160105") { cheatUnlocked = true; localStorage.setItem('survivorCheat', 'true'); magoUnlocked = true; localStorage.setItem('survivorMagoUnlocked', 'true'); unlockedEquip = []; ['elmo', 'corazza', 'amuleto'].forEach(cat => { EQUIP_DB[cat].forEach(item => unlockedEquip.push(item.id)); }); localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip)); charLevels = {0:3, 1:3, 2:3, 3:3}; localStorage.setItem('survivorCharLevels', JSON.stringify(charLevels)); alert("✔️ CODICE ACCETTATO!\nTutti i personaggi (Lv.3) e gli equipaggiamenti sono sbloccati per sempre."); closeSettingsModal(); if(document.getElementById('equipment-select').style.display === 'flex') updateEquipMenuUI(); } 
    else if (input === "tesoro") { totalCrystals += 1000; localStorage.setItem('survivorCrystals', totalCrystals); alert("⬡ +1000 CRISTALLI!\nHai ricevuto una fornitura di cristalli."); closeSettingsModal(); if(document.getElementById('equipment-select').style.display === 'flex') updateEquipMenuUI(); } 
    else if (input === "azzera") { localStorage.clear(); alert("🔄 PROGRESSI RESETTATI!\nIl gioco si riavvierà."); location.reload(); } 
    else { alert("❌ Codice errato."); } 
    document.getElementById('cheat-input').value = "";
}

function buyDoubleAmulet() { if (totalCrystals >= 3000) { totalCrystals -= 3000; hasDoubleAmulet = true; gameStats.crystalsSpent += 3000; saveGameStats(); dailyMissions.itemsBought++; saveDailyMissions(); localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorDoubleAmulet', 'true'); updateEquipMenuUI(); } }
function buyEquip(id, price) { if (totalCrystals >= price) { totalCrystals -= price; unlockedEquip.push(id); gameStats.crystalsSpent += price; saveGameStats(); dailyMissions.itemsBought++; saveDailyMissions(); localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip)); updateEquipMenuUI(); } }
function equipItem(category, id) { if (category === 'amuleto') { if (!hasDoubleAmulet) { equippedItems.amuleto1 = id; equippedItems.amuleto2 = null; } else { if (!equippedItems.amuleto1) equippedItems.amuleto1 = id; else if (!equippedItems.amuleto2 && equippedItems.amuleto1 !== id) equippedItems.amuleto2 = id; else equippedItems.amuleto1 = id; } } else { equippedItems[category] = id; } localStorage.setItem('survivorEquipped', JSON.stringify(equippedItems)); updateEquipMenuUI(); }
function unequipItem(category, id) { if (category === 'amuleto') { if (equippedItems.amuleto1 === id) equippedItems.amuleto1 = null; if (equippedItems.amuleto2 === id) equippedItems.amuleto2 = null; } else { equippedItems[category] = null; } localStorage.setItem('survivorEquipped', JSON.stringify(equippedItems)); updateEquipMenuUI(); }
function getEquipStat(category) { if (!equippedItems[category]) return 0; let item = EQUIP_DB[category].find(x => x.id === equippedItems[category]); return item ? item.value : 0; }
function hasAmulet(amuletId) { return equippedItems.amuleto1 === amuletId || equippedItems.amuleto2 === amuletId; }

function upgradeChar(id) { if (charLevels[id] < 3 && totalCrystals >= 1000) { totalCrystals -= 1000; charLevels[id]++; gameStats.crystalsSpent += 1000; saveGameStats(); localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorCharLevels', JSON.stringify(charLevels)); showCharacterSelect(); } }
function claimBattlePass(req, reward) { battlePass.claims[req] = true; totalCrystals += reward; localStorage.setItem('survivorCrystals', totalCrystals); saveBattlePass(); showBattlePassModal(); alert(`Hai ricevuto ${reward} Cristalli dal Patto! ⬡`); }
function claimMission(id, reward) { if (id === 1) dailyMissions.claim1 = true; if (id === 2) dailyMissions.claim2 = true; if (id === 3) dailyMissions.claim3 = true; totalCrystals += reward; localStorage.setItem('survivorCrystals', totalCrystals); saveDailyMissions(); showMissionsModal(); alert(`Hai ricevuto ${reward} Cristalli! ⬡`); }

// --- GESTIONE PARTITA ---
function togglePause() { 
    if (gameState !== "PLAYING") return; 
    let lvlModal = document.getElementById('levelup-modal').style.display; let bossModal = document.getElementById('boss-modal').style.display; let repModal = document.getElementById('replace-modal').style.display; let epicModal = document.getElementById('epic-modal').style.display;
    if (lvlModal === 'block' || bossModal === 'block' || repModal === 'block' || epicModal === 'block') return; 
    let pauseModal = document.getElementById('pause-modal'); if (paused) { paused = false; pauseModal.style.display = 'none'; } else { paused = true; pauseModal.style.display = 'block'; } 
}
function surrender() { document.getElementById('pause-modal').style.display = 'none'; player.hp = 0; updateBarsUI(player); triggerGameOver(); }
function triggerGameOver() { paused = true; gameState = "GAMEOVER"; saveGameStats(); saveDailyMissions(); saveBattlePass(); document.getElementById('run-crystals').innerText = sessionCrystals; document.getElementById('final-level').innerText = level; document.getElementById('game-ui').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'flex'; }

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

    player = { x: 0, y: 0, size: 20, speed: 4, hp: 100, maxHp: 100, pickupRange: 80, weapons: [], maxWeapons: maxWeps, charLevel: cLevel, shield: 0, maxShield: 0, shieldRegen: 0.2, lastHitTimer: 0, iFrames: 0, hasOrbs: false, orbLevel: 0, orbAngle: 0, orbTrail: [], miniMes: [], lastBossLevel: 0, charId: selectedCharId, hasRevived: false };
    enemies = []; bullets = []; beams = []; explosions = []; elementalTrails = []; enemyBullets = []; gems = []; rocks = []; chests = []; electricArcs = []; rockTelegraphs = []; decoys = []; xp = 0; level = 1; xpNeeded = 15; frameCount = 0; keys = {}; paused = false; joyX = 0; joyY = 0;
    bossArena = { active: false, x: 0, y: 0, radius: 800 };
    
    for(let i = 0; i < 15; i++) { let valid = false; let attempts = 0; let rx, ry, rSize; while(!valid && attempts < 10) { let angle = Math.random() * Math.PI * 2; let dist = 300 + Math.random() * 1500; rx = Math.cos(angle) * dist; ry = Math.sin(angle) * dist; rSize = 25 + Math.random() * 20; valid = isPositionFree(rx, ry, rSize); attempts++; } if (valid) rocks.push({ x: rx, y: ry, size: rSize, hp: 30 }); }
    
    let startingWeaponId = CHARACTERS.find(c => c.id === selectedCharId).weapons[0];
    giveWeapon(WEAPONS_DB[startingWeaponId]); 

    updateBarsUI(player); document.getElementById('lvl').innerText = level; document.getElementById('shield-ui').style.display = 'none'; 
    
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
    updateBarsUI(player); 
}

function giveWeapon(weaponData) { player.weapons.push({ ...weaponData, level: 1, currentDamage: weaponData.baseDamage, currentFireRate: weaponData.fireRate, fireTimer: 0 }); updateWeaponsUI(player); }

function buildUpgradePool() {
    let pool = [];
    player.weapons.forEach(w => { 
        pool.push({ name: `<span class="upgrade-title" style="color:${w.color}">⬆ Potenzia ${w.name} (Lv.${w.level + 1})</span><span class="upgrade-desc">Danni e velocità incrementati</span>`, apply: () => { 
            w.level++;
            if (w.id !== 'freezer' && w.id !== 'cerbottana' && w.id !== 'mirror_orb') w.currentDamage += Math.floor(w.baseDamage * 0.4);
            if (w.id === 'cerbottana')    { w.poisonDamage += 5; }
            if (w.id === 'bastone_veleno'){ w.range = Math.min(350, w.range + 15); }
            if (w.id === 'mirror_orb')    { w.decoyHp = (w.decoyHp || 100) + 50; w.currentDamage += 5; }
            if (w.id === 'fireball_wand') { w.explodeRadius = (w.explodeRadius || 80) + 20; }
            if (w.id === 'electric_orb')  { w.chainMax = (w.chainMax || 4) + 2; w.chainRange = (w.chainRange || 150) + 20; }
            w.currentFireRate = Math.max(5, w.currentFireRate - (w.id === 'freezer' ? 8 : (w.id === 'mirror_orb' ? 10 : 5)));
            updateWeaponsUI(player); finishUpgrade(); 
        }}); 
    });
    
    let charWeapons = CHARACTERS.find(c => c.id === player.charId).weapons; let poolWeps = [...charWeapons];
    if (player.charLevel >= 2) poolWeps.push(CHARACTERS.find(c => c.id === player.charId).lv2Weapon);

    poolWeps.forEach(wId => { let wt = WEAPONS_DB[wId]; if (!player.weapons.find(owned => owned.id === wt.id)) { pool.push({ name: `<span class="upgrade-title" style="color:${wt.color}">✦ Prendi: ${wt.name}</span><span class="upgrade-desc">Aggiungi all'arsenale</span>`, apply: () => { handleNewWeapon(wt); } }); } });
    
    pool.push({ name: `<span class="upgrade-title">🏃 Velocità Movimento</span><span class="upgrade-desc">Corri più veloce</span>`, apply: () => { player.speed += 1; finishUpgrade(); } });
    pool.push({ name: `<span class="upgrade-title">🧲 Raggio Magnetico</span><span class="upgrade-desc">Raccogli da più lontano</span>`, apply: () => { player.pickupRange += 40; finishUpgrade(); } });
    return pool;
}

function levelUp() { 
    paused = true; xp -= xpNeeded; xpNeeded = Math.floor(xpNeeded * 1.15) + 15; level++; 
    dailyMissions.levelsGained++; saveDailyMissions();
    if (level > gameStats.maxLevelReached) { gameStats.maxLevelReached = level; maxLevelReached = level; saveGameStats(); localStorage.setItem('survivorMaxLevel', maxLevelReached); }
    
    document.getElementById('lvl').innerText = level; document.getElementById('xp-bar').style.width = Math.min((xp / xpNeeded * 100), 100) + '%'; 
    let pool = buildUpgradePool(); let shuffled = pool.sort(() => 0.5 - Math.random()); currentChoices = shuffled.slice(0, 3); 
    for(let i=0; i<3; i++) { let btn = document.getElementById('btn'+i); btn.innerHTML = currentChoices[i].name; btn.onclick = () => { document.getElementById('levelup-modal').style.display = 'none'; currentChoices[i].apply(); }; } 
    document.getElementById('levelup-title').innerText = "⬡ Ascensione!"; document.getElementById('levelup-title').style.color = "#ffaa00"; document.getElementById('levelup-modal').style.display = 'block'; 
    
    if (level % 5 === 0 && player.lastBossLevel !== level) { 
        player.lastBossLevel = level; let bossHp = 3000 * (level / 5); let bossSpeed = 0.8 + (level * 0.02); 
        enemies.push({ x: player.x, y: player.y - 600, hp: bossHp, maxHp: bossHp, speed: bossSpeed, originalSpeed: bossSpeed, size: 45, type: 'miniboss', color: 'gold', fireTimer: 0, hitTimer: 0, frozenTimer: 0, burnTimer: 0, poisonTimer: 0, electrifiedTimer: 0, dead: false, advanced: true, state: 'idle', stateTimer: 0, targetX: 0, targetY: 0, phaseMultiplier: Math.floor(level/5) }); 
        bossArena = { active: true, x: player.x, y: player.y, radius: 900 }; setTimeout(() => { showItemFeedback("⚠ ARENA DEL TITANO! ⚠", "#ff0000"); }, 500); 
    } 
}

function freeUpgrade() { paused = true; let pool = buildUpgradePool(); let shuffled = pool.sort(() => 0.5 - Math.random()); currentChoices = shuffled.slice(0, 3); for(let i=0; i<3; i++) { let btn = document.getElementById('btn'+i); btn.innerHTML = currentChoices[i].name; btn.onclick = () => { document.getElementById('levelup-modal').style.display = 'none'; currentChoices[i].apply(); }; } document.getElementById('levelup-title').innerText = "Cassa: Scelta Gratuita!"; document.getElementById('levelup-title').style.color = "#ffaa00"; document.getElementById('levelup-modal').style.display = 'block'; }

function showEpicChestModal() { paused = true; let randomRelic = ["🤖 Mini Me", "🌀 Palle Rotanti", "🛡️ Scudo Rigenerativo"][Math.floor(Math.random()*3)]; let relicAction; if (randomRelic === "🤖 Mini Me") relicAction = () => { player.miniMes.push({x: player.x, y: player.y, fireTimer: 0, burstCount: 0}); closeEpicModal(); }; if (randomRelic === "🌀 Palle Rotanti") relicAction = () => { player.hasOrbs = true; player.orbLevel = (player.orbLevel || 0) + 1; closeEpicModal(); }; if (randomRelic === "🛡️ Scudo Rigenerativo") relicAction = () => { player.maxShield += 50; player.shield = player.maxShield; player.shieldRegen = (player.shieldRegen || 0.2) + 0.15; document.getElementById('shield-ui').style.display = 'flex'; updateBarsUI(player); closeEpicModal(); }; let pool = [ { name: `<span class="upgrade-title" style="color:#cc44ff;">⬡ 20 Cristalli</span>`, apply: () => { totalCrystals+=20; sessionCrystals+=20; localStorage.setItem('survivorCrystals', totalCrystals); document.getElementById('crystal-count').innerText = sessionCrystals; closeEpicModal(); } }, { name: `<span class="upgrade-title" style="color:#ffaa00;">✦ ${randomRelic}</span>`, apply: relicAction }, { name: `<span class="upgrade-title" style="color:#80ff60;">❤ Cura Totale & +XP</span>`, apply: () => { player.hp = player.maxHp; updateBarsUI(player); xp += xpNeeded * 2; closeEpicModal(); } } ]; for(let i=0; i<3; i++) { let btn = document.getElementById('epic-btn'+i); btn.innerHTML = pool[i].name; btn.onclick = pool[i].apply; } document.getElementById('epic-modal').style.display = 'block'; }
function closeEpicModal() { document.getElementById('epic-modal').style.display = 'none'; paused = false; }

function showBossRelicModal() { 
    paused = true; 
    let pool = [ 
        { name: `<span class="upgrade-title">🌀 Palle Rotanti</span><span class="upgrade-desc">Genera sfere rotanti (Liv. ${player.orbLevel + 1})</span>`, apply: () => { player.hasOrbs = true; player.orbLevel += 1; closeBossModal(); } }, 
        { name: `<span class="upgrade-title">◈ Scudo Rigenerativo</span><span class="upgrade-desc">+50 Max HP e ricarica accelerata</span>`, apply: () => { player.maxShield += 50; player.shield = player.maxShield; player.shieldRegen += 0.15; document.getElementById('shield-ui').style.display = 'flex'; updateBarsUI(player); closeBossModal(); } } 
    ]; 
    if (player.miniMes.length < 3) { pool.push({ name: `<span class="upgrade-title">🤖 Mini Me</span><span class="upgrade-desc">Un robottino che spara a raffica</span>`, apply: () => { player.miniMes.push({x: player.x, y: player.y, fireTimer: 0, burstCount: 0}); closeBossModal(); } }); } 
    else { pool.push({ name: `<span class="upgrade-title">❤ Titanico</span><span class="upgrade-desc">Aumenta e cura tutti gli HP</span>`, apply: () => { player.maxHp += 100; player.hp = player.maxHp; updateBarsUI(player); closeBossModal(); } }); } 
    for(let i=0; i<3; i++) { let btn = document.getElementById('boss-btn'+i); btn.innerHTML = pool[i].name; btn.onclick = pool[i].apply; } 
    document.getElementById('boss-modal').style.display = 'block'; 
}
function closeBossModal() { document.getElementById('boss-modal').style.display = 'none'; paused = false; }

function handleNewWeapon(weaponData) { 
    if (player.weapons.length < player.maxWeapons) { giveWeapon(weaponData); finishUpgrade(); } 
    else { 
        pendingWeapon = weaponData; document.getElementById('new-weapon-name').innerHTML = `<span style="color:${weaponData.color}">${weaponData.name}</span>`; 
        document.getElementById('rep-btn0').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[0].color}">Scarta ${player.weapons[0].name}</span><span class="upgrade-desc">Lv. ${player.weapons[0].level}</span>`; 
        document.getElementById('rep-btn1').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[1].color}">Scarda ${player.weapons[1].name}</span><span class="upgrade-desc">Lv. ${player.weapons[1].level}</span>`; 
        if (player.maxWeapons === 3) { document.getElementById('rep-btn2').style.display = 'flex'; document.getElementById('rep-btn2').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[2].color}">Scarta ${player.weapons[2].name}</span><span class="upgrade-desc">Lv. ${player.weapons[2].level}</span>`; } else { document.getElementById('rep-btn2').style.display = 'none'; }
        document.getElementById('replace-modal').style.display = 'block'; 
    } 
}
function confirmReplace(slotIndex) { player.weapons[slotIndex] = { ...pendingWeapon, level: 1, currentDamage: pendingWeapon.baseDamage, currentFireRate: pendingWeapon.fireRate, fireTimer: 0 }; updateWeaponsUI(player); document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function cancelReplace() { document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function finishUpgrade() { paused = false; }

function handleEnemyDeath(e, ei) {
    gameStats.enemiesKilled++; 
    if (gameStats.enemiesKilled % 50 === 0) saveGameStats();

    if (e.type === 'miniboss') { 
        gameStats.bossesKilled++; saveGameStats();
        dailyMissions.bossesKilled++; saveDailyMissions();
        battlePass.bosses++; saveBattlePass(); 

        if (gameStats.bossesKilled >= 30 && !magoUnlocked) {
            magoUnlocked = true;
            localStorage.setItem('survivorMagoUnlocked', 'true');
            showItemFeedback("🧙 IL MAGO SBLOCCATO!", "#cc44ff");
        }

        chests.push({ x: e.x, y: e.y, size: 35, isSpecial: true, isEpic: false, isBossChest: true }); 
        showItemFeedback("⚔ BOTTINO DEL TITANO!", "gold"); 
        for(let c=0; c<15; c++) gems.push({ x: e.x + Math.random()*80-40, y: e.y + Math.random()*80-40, isCrystal: true }); 
        bossArena.active = false; 
    } 
    else { if (Math.random() < 0.02) { gems.push({ x: e.x, y: e.y, isCrystal: true }); } else { gems.push({ x: e.x, y: e.y, isSuper: false }); } } 
    if (ei > -1) enemies.splice(ei, 1);
}

// --- CORE GAME LOOP ---
function gameLoop() { 
    if (gameState !== "PLAYING") return; 
    if (!paused) { 
        update(); 
        draw(); 
    } 
    requestAnimationFrame(gameLoop); 
}

function update() {
    frameCount++; let dx = 0; let dy = 0;
    if (controlMode === 'pc') { if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1; if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1; if (dx !== 0 && dy !== 0) { let len = Math.hypot(dx, dy); dx /= len; dy /= len; } } else { dx = joyX; dy = joyY; }
    let moveX = dx * player.speed; let moveY = dy * player.speed; let canMoveX = true; let canMoveY = true;
    
    if (bossArena.active) {
        if (Math.hypot((player.x + moveX) - bossArena.x, player.y - bossArena.y) > bossArena.radius - player.size) canMoveX = false;
        if (Math.hypot(player.x - bossArena.x, (player.y + moveY) - bossArena.y) > bossArena.radius - player.size) canMoveY = false;
        if (frameCount % 40 === 0) { 
            let angle = Math.random() * Math.PI * 2; let dist = Math.random() * (bossArena.radius - 80);
            rockTelegraphs.push({ x: bossArena.x + Math.cos(angle)*dist, y: bossArena.y + Math.sin(angle)*dist, radius: 30, timer: 60 }); 
        }
    }
    
    for (let i = rockTelegraphs.length - 1; i >= 0; i--) {
        let rt = rockTelegraphs[i]; rt.timer--;
        if (rt.timer <= 0) {
            if (rt.isDecoy) {
                decoys.push({ x: rt.x, y: rt.y, hp: rt.decoyHp, maxHp: rt.decoyHp, life: 600, fireTimer: 0, damage: rt.decoyDamage, size: player.size, charId: player.charId });
                rockTelegraphs.splice(i, 1);
            } else {
                if (isPositionFree(rt.x, rt.y, rt.radius)) { rocks.push({ x: rt.x, y: rt.y, size: rt.radius, hp: 60, dead: false }); }
                rockTelegraphs.splice(i, 1);
            }
        }
    }

    for (let r of rocks) {
        let d = Math.hypot((player.x + moveX) - r.x, (player.y + moveY) - r.y);
        if (d < player.size + r.size) {
            let dx2 = Math.hypot((player.x + moveX) - r.x, player.y - r.y);
            let dy2 = Math.hypot(player.x - r.x, (player.y + moveY) - r.y);
            if (dx2 < player.size + r.size) canMoveX = false;
            if (dy2 < player.size + r.size) canMoveY = false;
            let dNow = Math.hypot(player.x - r.x, player.y - r.y);
            if (dNow < player.size + r.size) {
                let pushA = Math.atan2(player.y - r.y, player.x - r.x);
                let overlap = (player.size + r.size) - dNow + 1;
                player.x += Math.cos(pushA) * overlap;
                player.y += Math.sin(pushA) * overlap;
            }
        }
    }
    if (canMoveX) player.x += moveX; if (canMoveY) player.y += moveY;

    if (player.maxShield > 0) { 
        player.lastHitTimer++; 
        if (player.lastHitTimer > 180 && player.shield < player.maxShield) { 
            player.shield = Math.min(player.maxShield, player.shield + player.shieldRegen); 
            updateBarsUI(player); 
        } 
    }
    if (player.iFrames > 0) player.iFrames--;

    for (let i = decoys.length - 1; i >= 0; i--) {
        let d = decoys[i];
        d.life--;
        d.fireTimer++;
        if (d.fireTimer >= 20) {
            let targets = enemies.filter(t => Math.hypot(t.x - d.x, t.y - d.y) <= 400);
            if (targets.length > 0) {
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - d.x, curr.y - d.y) < Math.hypot(prev.x - d.x, prev.y - d.y) ? curr : prev); 
                let angle = Math.atan2(closest.y - d.y, closest.x - d.x);
                bullets.push({ x: d.x, y: d.y, startX: d.x, startY: d.y, vx: Math.cos(angle)*18, vy: Math.sin(angle)*18, damage: d.damage, size: 3, color: "yellow", range: 400, weaponId: 'uzi' });
            }
            d.fireTimer = 0;
        }
        if (d.life <= 0 || d.hp <= 0) {
            explosions.push({x: d.x, y: d.y, radius: 50, damage: d.damage * 2, life: 15, maxLife: 15, type: 'normal'});
            decoys.splice(i, 1);
        }
    }

    if (player.hasOrbs && player.orbLevel > 0) { 
        player.orbAngle += 0.05; 
        let orbDist = 100; 
        let numOrbs = player.orbLevel * 2; 
        
        if (frameCount % 4 === 0) { 
            for(let i=0; i<numOrbs; i++) {
                let angleOffset = (Math.PI * 2 / numOrbs) * i;
                let ox = player.x + Math.cos(player.orbAngle + angleOffset) * orbDist; 
                let oy = player.y + Math.sin(player.orbAngle + angleOffset) * orbDist;
                player.orbTrail.push({x: ox, y: oy, life: 60});
            }
        } 
        
        player.orbTrail.forEach(t => { 
            t.life--; 
            enemies.forEach(e => { 
                if (Math.hypot(e.x - t.x, e.y - t.y) < e.size + 10) { 
                    e.hp -= 0.6; e.hitTimer = 5; 
                    if(e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); } 
                } 
            }); 
        }); 
        player.orbTrail = player.orbTrail.filter(t => t.life > 0); 
    }

    player.miniMes.forEach((m, index) => { 
        let targetAngle = (index * Math.PI * 2) / Math.max(1, player.miniMes.length) + (frameCount * 0.02); 
        let tx = player.x + Math.cos(targetAngle) * 60; let ty = player.y + Math.sin(targetAngle) * 60; 
        m.x += (tx - m.x) * 0.1; m.y += (ty - m.y) * 0.1; m.fireTimer++;
        if (m.fireTimer >= 35) { 
            let targets = enemies.filter(t => Math.hypot(t.x - m.x, t.y - m.y) <= 500); 
            if (targets.length === 0) {
                targets = rocks.filter(r => Math.hypot(r.x - m.x, r.y - m.y) <= 500);
            }
            
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

    let applyIce = hasAmulet('amu_ice'); let applyFire = hasAmulet('amu_fire');
    player.weapons.forEach((w, index) => {
        w.fireTimer++;
        if (w.fireTimer >= w.currentFireRate) {
            if (w.id === 'bastone_veleno') {
                let pRadius = Math.min(350, w.range + (w.level * 15));
                explosions.push({x: player.x, y: player.y, radius: pRadius, damage: w.currentDamage, life: 15, maxLife: 15, type: 'poison'});
                w.fireTimer = 0; return; 
            }
            if (w.id === 'mirror_orb') {
                let decoyHp = (w.decoyHp || 100) + w.level * 30;
                let spawnRadius = 120 + Math.random() * 40;
                let sAngle = Math.random() * Math.PI * 2;
                let sx = player.x + Math.cos(sAngle) * spawnRadius;
                let sy = player.y + Math.sin(sAngle) * spawnRadius;
                rockTelegraphs.push({ x: sx, y: sy, radius: player.size, timer: 30, isDecoy: true, decoyHp: decoyHp, decoyDamage: w.currentDamage });
                w.fireTimer = 0; return;
            }
            
            let targets = enemies.filter(t => Math.hypot(t.x - player.x, t.y - player.y) <= w.range);
            if (targets.length === 0) {
                targets = rocks.filter(r => Math.hypot(r.x - player.x, r.y - player.y) <= w.range);
            }
            
            if (targets.length > 0) {
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev);
                let angle = Math.atan2(closest.y - player.y, closest.x - player.x);
                let handOffsetX = 15; let handOffsetY = 0; 
                if (index === 0) handOffsetY = 15; else if (index === 1) handOffsetY = -15; else if (index === 2) { handOffsetX = 25; handOffsetY = 0; }
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
                } else if (w.id === 'electric_orb') {
                    let baseDmg = w.currentDamage * 0.45; 
                    if (w.level >= 6) baseDmg *= 2; 
                    
                    let maxChain = 3 + Math.floor((w.level - 1) / 2);
                    let chainRange = w.chainRange || 180;
                    
                    closest.hp -= baseDmg; closest.hitTimer = 5; closest.electrifiedTimer = 20;
                    if (closest.hp <= 0 && !closest.dead) { closest.dead = true; handleEnemyDeath(closest, -1); }
                    
                    electricArcs.push({ x1: spawnX, y1: spawnY, x2: closest.x, y2: closest.y, life: 18, maxLife: 18 });
                    
                    let lastHit = closest;
                    let alreadyHit = new Set([closest]);
                    
                    for (let c = 0; c < maxChain; c++) {
                        let nextTarget = null; let bestDist = Infinity;
                        enemies.forEach(en => {
                            if (!en.dead && !alreadyHit.has(en)) {
                                let d = Math.hypot(en.x - lastHit.x, en.y - lastHit.y);
                                if (d < chainRange && d < bestDist) { bestDist = d; nextTarget = en; }
                            }
                        });
                        if (!nextTarget) break; 
                        
                        nextTarget.hp -= baseDmg * 0.85; 
                        nextTarget.hitTimer = 5; 
                        nextTarget.electrifiedTimer = 20; 
                        
                        if (nextTarget.hp <= 0 && !nextTarget.dead) { nextTarget.dead = true; handleEnemyDeath(nextTarget, -1); }
                        
                        electricArcs.push({ x1: lastHit.x, y1: lastHit.y, x2: nextTarget.x, y2: nextTarget.y, life: 18, maxLife: 18 });
                        alreadyHit.add(nextTarget);
                        lastHit = nextTarget;
                    }
                } else if (w.id === 'fireball_wand') {
                    bullets.push({ x: spawnX, y: spawnY, startX: spawnX, startY: spawnY, vx: cosA * w.speed, vy: sinA * w.speed, damage: w.currentDamage, size: w.bulletSize, color: w.color, range: w.range, weaponId: w.id, level: w.level, poisonDmg: 0, explodeRadius: w.explodeRadius || 80 });
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
            else if (b.weaponId === 'fireball_wand') { 
                let expR = (b.explodeRadius || 80) + ((b.level || 1) - 1) * 20;
                explosions.push({x: b.x, y: b.y, radius: expR, damage: b.damage, life: 25, maxLife: 25, type: 'fire'});
            }
            bullets.splice(i, 1); continue; 
        }

        if (b.weaponId === 'fireball_wand') {
            let hitEnemy = false;
            for (let ei2 = enemies.length - 1; ei2 >= 0; ei2--) {
                let et = enemies[ei2];
                if (!et.dead && Math.hypot(b.x - et.x, b.y - et.y) < et.size + b.size) {
                    let expR = (b.explodeRadius || 80) + ((b.level || 1) - 1) * 20;
                    explosions.push({x: b.x, y: b.y, radius: expR, damage: b.damage, life: 25, maxLife: 25, type: 'fire'});
                    hitEnemy = true;
                    bullets.splice(i, 1); break;
                }
            }
            if (hitEnemy) continue;
        }

        let hitRock = false;
        for (let ri = rocks.length - 1; ri >= 0; ri--) { 
            let r = rocks[ri]; 
            if (distToSegment(r.x, r.y, oldX, oldY, b.x, b.y) < r.size + b.size/2 + 5) { 
                if (b.weaponId === 'granata') { explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'}); } 
                else if (b.weaponId === 'freezer') { explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: 0, life: 180, maxLife: 180, type: 'ice'}); } 
                else if (b.weaponId === 'fireball_wand') { 
                    let expR = (b.explodeRadius || 80) + ((b.level || 1) - 1) * 20;
                    explosions.push({x: b.x, y: b.y, radius: expR, damage: b.damage, life: 25, maxLife: 25, type: 'fire'}); 
                }
                else { r.hp -= b.damage; if (r.hp <= 0 && !r.dead) { r.dead=true; gems.push({ x: r.x, y: r.y, isSuper: true }); } }
                bullets.splice(i, 1); hitRock = true; break; 
            } 
        } 
        if (hitRock) continue;
    }

    elementalTrails.forEach(t => { t.life--; if (t.life % 10 === 0) { enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - t.x, e.y - t.y) < t.radius + e.size) { if (t.type === 'ice') { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.2; } else { e.burnTimer = 180; } } }); } });
    elementalTrails = elementalTrails.filter(t => t.life > 0);
    electricArcs.forEach(ec => ec.life--);
    electricArcs = electricArcs.filter(ec => ec.life > 0);

    explosions.forEach(exp => {
        if (exp.type === 'ice') { if (frameCount % 10 === 0 || exp.life === exp.maxLife) { enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.3; } }); } } 
        else if (exp.type === 'poison') {
            if (exp.life === exp.maxLife) { 
                enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) { e.hp -= exp.damage; e.hitTimer = 5; e.poisonTimer = 30; e.poisonDmg = exp.damage; if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); } } });
                rocks.forEach(r => { if (!r.dead && Math.hypot(r.x - exp.x, r.y - exp.y) < exp.radius + r.size) { r.hp -= exp.damage; if (r.hp <= 0 && !r.dead) { r.dead=true; gems.push({ x: r.x, y: r.y, isSuper: true }); } } });
            }
        } else {
            if (exp.life === exp.maxLife) { 
                enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius + e.size) { e.hp -= exp.damage; e.hitTimer = 5; if (applyIce) { e.frozenTimer = 180; e.speed = e.originalSpeed * 0.2; } if (applyFire) { e.burnTimer = 180; } if (e.hp <= 0 && !e.dead) { e.dead = true; handleEnemyDeath(e, -1); } } });
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
        if (distToSegment(player.x, player.y, oldX, oldY, b.x, b.y) < player.size + 5) { if (Math.random() < elmoDodge) { showItemFeedback("SCHIVATA!", "#ffaa00"); } else { damagePlayer(b.damage); } enemyBullets.splice(i, 1); } 
    }
    
    let normalChestsCount = chests.filter(c => !c.isSpecial && !c.isEpic).length;
    if (Math.random() < 0.0015 && normalChestsCount < 3) { let angle = Math.random() * Math.PI * 2; let dist = 500 + Math.random() * 1000; let cx = player.x + Math.cos(angle) * dist; let cy = player.y + Math.sin(angle) * dist; if(isPositionFree(cx, cy, 25)) chests.push({ x: cx, y: cy, size: 25, isSpecial: false, isEpic: false, isBossChest: false }); }
    
    if (Math.random() < 0.00005) {
        let angle = Math.random() * Math.PI * 2; let dist = 800 + Math.random() * 1000; let cx = player.x + Math.cos(angle) * dist; let cy = player.y + Math.sin(angle) * dist; 
        if(isPositionFree(cx, cy, 150)) {
            chests.push({ x: cx, y: cy, size: 50, isEpic: true, isSpecial: false, isBossChest: false }); 
            for(let i=0; i<12; i++) { let ra = i * ((Math.PI * 2) / 12); rocks.push({ x: cx + Math.cos(ra)*120, y: cy + Math.sin(ra)*120, size: 35, hp: 400, dead: false }); } 
        }
    }

    for (let i = chests.length - 1; i >= 0; i--) { 
        let c = chests[i]; 
        if (!c.isBossChest && Math.hypot(player.x - c.x, player.y - c.y) > 3000) { chests.splice(i, 1); continue; }

        if (Math.hypot(player.x - c.x, player.y - c.y) < player.size + c.size) { 
            chests.splice(i, 1); 
            if (c.isEpic) { showEpicChestModal(); }
            else if (c.isSpecial) { showBossRelicModal(); } 
            else { 
                let rand = Math.random(); 
                if (rand < 0.4) { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5); updateBarsUI(player); showItemFeedback("✚ CURA", "#80ff60"); } 
                else if (rand < 0.7) { 
                    let sd = Math.max(canvas.width, canvas.height); 
                    for(let k = enemies.length - 1; k >= 0; k--) {
                        let eTarget = enemies[k];
                        if(Math.hypot(eTarget.x - player.x, eTarget.y - player.y) < sd) { 
                            if (eTarget.type !== 'miniboss') eTarget.hp -= 10000; else eTarget.hp -= 500; 
                            eTarget.hitTimer = 5; if (eTarget.hp <= 0 && !eTarget.dead) { eTarget.dead = true; handleEnemyDeath(eTarget, k); }
                        } 
                    }
                    showItemFeedback("💣 BOMBA!", "#ff4500"); 
                } 
                else { showItemFeedback("⬆ POTENZIAMENTO!", "#ffaa00"); freeUpgrade(); } 
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
                enemies.push({ x: ex, y: ey, hp: hp, maxHp: hp, speed: speed, originalSpeed: speed, size: size, type: type, color: color, fireTimer: 0, hitTimer: 0, frozenTimer: 0, burnTimer: 0, poisonTimer: 0, electrifiedTimer: 0, dead: false }); 
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
                let pullA = Math.atan2(e.y - bossArena.y, e.x - bossArena.x); e.x = bossArena.x + Math.cos(pullA) * (bossArena.radius - e.size); e.y = bossArena.y + Math.sin(pullA) * (bossArena.radius - e.size);
                if (e.state === 'dashing') { e.state = 'idle'; e.stateTimer = 0; }
            }
        }
        if (bossArena.active && e.type !== 'miniboss') {
            if (Math.hypot(e.x - bossArena.x, e.y - bossArena.y) < bossArena.radius + e.size) { let pushA = Math.atan2(e.y - bossArena.y, e.x - bossArena.x); e.x = bossArena.x + Math.cos(pushA) * (bossArena.radius + e.size); e.y = bossArena.y + Math.sin(pushA) * (bossArena.radius + e.size); }
        }
        
        for (let d of decoys) {
            let distToDecoy = Math.hypot(e.x - d.x, e.y - d.y);
            if (distToDecoy < e.size + d.size) {
                let pushA = Math.atan2(e.y - d.y, e.x - d.x);
                let overlap = (e.size + d.size) - distToDecoy;
                e.x += Math.cos(pushA) * overlap;
                e.y += Math.sin(pushA) * overlap;
                if (frameCount % 30 === 0) {
                    d.hp -= Math.max(1, Math.floor(e.speed * 3));
                }
            }
        }

        if (e.hitTimer > 0) e.hitTimer--;
        if (e.electrifiedTimer > 0) e.electrifiedTimer--;
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
            } else if (e.state === 'telegraph_dash') {
                if (e.stateTimer === 1) { e.targetX = player.x; e.targetY = player.y; } 
                let telegraphTime = Math.max(30, 70 - (e.phaseMultiplier * 10));
                if (e.stateTimer > telegraphTime) { e.stateTimer = 0; e.state = 'dashing'; }
            } else if (e.state === 'dashing') {
                let dashSpeed = 18 + (e.phaseMultiplier * 3); let dAngle = Math.atan2(e.targetY - e.y, e.targetX - e.x); e.x += Math.cos(dAngle) * dashSpeed; e.y += Math.sin(dAngle) * dashSpeed;
                if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) { damagePlayer(1.5); e.state = 'idle'; e.stateTimer = 0; }
                if (Math.hypot(e.targetX - e.x, e.targetY - e.y) < dashSpeed) { e.state = 'idle'; e.stateTimer = 0; }
            } else if (e.state === 'telegraph_fire') {
                if (e.stateTimer > 40) { e.stateTimer = 0; e.state = 'shooting'; e.shotsFired = 0; }
            } else if (e.state === 'shooting') {
                let totalShots = 3 + e.phaseMultiplier;
                if (e.stateTimer % 15 === 0) { let shootA = Math.atan2(player.y - e.y, player.x - e.x); enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(shootA)*8, vy: Math.sin(shootA)*8, damage: 20, isFireball: true }); e.shotsFired++; if (e.shotsFired >= totalShots) { e.state = 'idle'; e.stateTimer = 0; } }
            }
        } else {
            let moveTarget = { x: player.x, y: player.y };
            let distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
            let closestDecoyDist = Infinity;
            for (let d of decoys) {
                let dist = Math.hypot(d.x - e.x, d.y - e.y);
                if (dist < distToPlayer && dist < closestDecoyDist) {
                    closestDecoyDist = dist;
                    moveTarget = d;
                }
            }
            let moveAngle = Math.atan2(moveTarget.y - e.y, moveTarget.x - e.x);
            e.x += Math.cos(moveAngle) * e.speed; e.y += Math.sin(moveAngle) * e.speed;
            if (e.type === 'shooter') { e.fireTimer++; if (e.fireTimer >= 100) { enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle)*5, vy: Math.sin(angle)*5, damage: 10 }); e.fireTimer = 0; } } 
        }

        if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) { 
            if (player.iFrames <= 0) { if (Math.random() < corazzaDodge) { showItemFeedback("SCHIVATA!", "#80ff60"); player.iFrames = 20; } else { damagePlayer(1); player.iFrames = 10; } }
        } 
        
        for (let bi = bullets.length - 1; bi >= 0; bi--) { 
            let b = bullets[bi]; 
            if (distToSegment(e.x, e.y, b.x - b.vx, b.y - b.vy, b.x, b.y) < e.size + b.size + 35) { 
                if (b.weaponId === 'granata') { explosions.push({x: b.x, y: b.y, radius: 60 + (b.level * 20), damage: b.damage, life: 20, maxLife: 20, type: 'fire'}); } 
                else if (b.weaponId === 'freezer') { explosions.push({x: b.x, y: b.y, radius: 45 + (b.level * 10), damage: 0, life: 180, maxLife: 180, type: 'ice'}); } 
                else if (b.weaponId === 'cerbottana') { e.hp -= b.damage; e.hitTimer = 5; e.poisonTimer = 300; e.poisonDmg = b.poisonDmg + (b.level * 2); }
                else if (b.weaponId === 'fireball_wand') {}
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
            if (g.isCrystal) { totalCrystals++; sessionCrystals++; localStorage.setItem('survivorCrystals', totalCrystals); document.getElementById('crystal-count').innerText = sessionCrystals; showItemFeedback("+1 ⬡", "#cc44ff"); } 
            else { xp += g.isSuper ? 3 : 1; }
            gems.splice(gi, 1); 
        } 
    }

    document.getElementById('xp-bar').style.width = Math.min((xp / xpNeeded * 100), 100) + '%';
    if (xp >= xpNeeded && !paused) { levelUp(); }
}

function drawProjectile(b, camX, camY) {
    ctx.shadowBlur = 10; ctx.shadowColor = b.color; let px = b.x - camX; let py = b.y - camY;
    if (b.weaponId === 'razzo') { let s = b.size; ctx.fillStyle = b.color; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s/2, -s/2); ctx.lineTo(-s/2, s/2); ctx.fill(); ctx.restore(); } 
    else if (b.weaponId === 'bastone') { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); } 
    else if (b.weaponId === 'granata') { ctx.fillStyle = "#2a4d20"; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#eeddaa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py - b.size*0.8); ctx.lineTo(px + b.size, py - b.size*1.5); ctx.stroke(); } 
    else if (b.weaponId === 'freezer') { let s = b.size; ctx.fillStyle = b.color; ctx.save(); ctx.translate(px, py); ctx.rotate(frameCount*0.1); ctx.beginPath(); let inner=s/3; let outer=s; for(let i=0;i<8;i++){let rad=(i%2===0)?outer:inner;let a=i*Math.PI/4;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);} ctx.fill(); ctx.restore(); } 
    else if (b.weaponId === 'fucile' || b.weaponId === 'uzi' || b.weaponId === 'cerbottana') { ctx.strokeStyle = b.color; ctx.lineWidth = b.size; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - b.vx*1.5, py - b.vy*1.5); ctx.stroke(); }
    else if (b.weaponId === 'fireball_wand') {
        let pulse = 0.8 + 0.2 * Math.sin(frameCount * 0.3);
        let grad = ctx.createRadialGradient(px, py, b.size*0.1, px, py, b.size * pulse);
        grad.addColorStop(0, '#ffff00'); grad.addColorStop(0.4, '#ff4500'); grad.addColorStop(1, 'rgba(200,0,0,0)');
        ctx.fillStyle = grad; ctx.shadowBlur = 20; ctx.shadowColor = '#ff4500';
        ctx.beginPath(); ctx.arc(px, py, b.size * pulse, 0, Math.PI*2); ctx.fill();
    }
    else { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(px, py, b.size, 0, Math.PI*2); ctx.fill(); }
    ctx.shadowBlur = 0;
}

function draw() {
    let zoom = window.innerWidth < 768 ? 0.6 : 1; 
    let viewW = canvas.width / zoom; let viewH = canvas.height / zoom;
    let camX = player.x - viewW / 2; let camY = player.y - viewH / 2;

    // Sfondo void con gradiente
    ctx.fillStyle = '#0a0508'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(zoom, zoom); 

    // Griglia void ambrata
    ctx.strokeStyle = 'rgba(255,170,0,0.04)'; ctx.lineWidth = 1; let gridSize = 100; let offsetX = camX % gridSize; let offsetY = camY % gridSize; 
    for(let x = -offsetX; x < viewW; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, viewH); ctx.stroke(); } 
    for(let y = -offsetY; y < viewH; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(viewW, y); ctx.stroke(); }
    
    if (bossArena.active) {
        ctx.strokeStyle = "rgba(255, 80, 0, 0.7)"; ctx.lineWidth = 8; ctx.setLineDash([20, 15]);
        ctx.beginPath(); ctx.arc(bossArena.x - camX, bossArena.y - camY, bossArena.radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "rgba(120, 20, 0, 0.08)"; ctx.fill();
    }

    rockTelegraphs.forEach(rt => {
        if (rt.isDecoy) {
            let alpha = 1 - (rt.timer / 30);
            ctx.strokeStyle = `rgba(255, 170, 0, ${0.5 + alpha * 0.5})`; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
            ctx.beginPath(); ctx.arc(rt.x - camX, rt.y - camY, rt.radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = `rgba(255, 140, 0, ${alpha * 0.3})`; ctx.fill();
            ctx.font = "18px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillStyle = "white"; ctx.fillText("👤", rt.x - camX, rt.y - camY);
        } else {
            ctx.strokeStyle = "rgba(255,80,0,0.8)"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(rt.x - camX, rt.y - camY, rt.radius, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = "rgba(200, 50, 0, 0.3)"; ctx.fill();
            ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "white";
            ctx.fillText("⚠", rt.x - camX, rt.y - camY);
        }
    });

    elementalTrails.forEach(t => { let alpha = t.life / t.maxLife; ctx.fillStyle = t.type === 'ice' ? `rgba(100, 200, 255, ${alpha * 0.4})` : `rgba(255, 100, 0, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(t.x - camX, t.y - camY, t.radius, 0, Math.PI*2); ctx.fill(); });
    
    rocks.forEach(r => {
        let mx = r.x - camX; let my = r.y - camY;
        // Rocce con aspetto più oscuro
        ctx.fillStyle = '#3a2820'; ctx.strokeStyle = '#6b4030'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mx, my, r.size, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        // Vena ambrata
        ctx.strokeStyle = 'rgba(255,150,0,0.15)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mx, my, r.size * 0.6, 0.5, 2.5); ctx.stroke();
    });
    
    decoys.forEach(d => {
        let screenCenterX = d.x - camX; let screenCenterY = d.y - camY;
        ctx.save();
        ctx.globalAlpha = 0.6 + 0.2 * Math.sin(frameCount * 0.2);
        
        let pBodyW = d.size * 1.2; let pBodyH = d.size * 1.8;
        ctx.fillStyle = '#ffaa00';
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffaa00';
        
        ctx.fillRect(screenCenterX - pBodyW/2, screenCenterY - pBodyH/2 + 5, pBodyW, pBodyH); 
        ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2, d.size * 0.6, 0, Math.PI*2); ctx.fill();
        
        if (d.charId === 3) {
            let hatColor = '#4a2a8a';
            let hatX = screenCenterX; let hatY = screenCenterY - pBodyH/2 - d.size * 0.45;
            ctx.fillStyle = hatColor; ctx.beginPath(); ctx.ellipse(hatX, hatY + 4, d.size * 1.0, 4, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(hatX - d.size * 0.7, hatY + 4); ctx.lineTo(hatX, hatY - d.size * 1.4); ctx.lineTo(hatX + d.size * 0.7, hatY + 4); ctx.fill();
            ctx.fillStyle = '#ffff00'; ctx.font = `${d.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', hatX, hatY - d.size * 1.2);
        }
        ctx.restore();
    });

    electricArcs.forEach(ec => {
        let alpha = ec.life / (ec.maxLife || 8);
        let x1 = ec.x1 - camX; let y1 = ec.y1 - camY;
        let x2 = ec.x2 - camX; let y2 = ec.y2 - camY;
        let dx = x2 - x1; let dy = y2 - y1;
        let len = Math.sqrt(dx*dx + dy*dy) || 1;
        let perpX = -dy / len; let perpY = dx / len;
        let segs = Math.max(5, Math.floor(len / 14));
        ctx.strokeStyle = 'rgba(80, 220, 255, ' + alpha + ')'; ctx.lineWidth = 1.5 + alpha * 2.5;
        ctx.shadowBlur = 8 + alpha * 14; ctx.shadowColor = '#00eeff';
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(x1, y1);
        for (let s = 1; s < segs; s++) {
            let t = s / segs;
            let px = x1 + dx * t; let py = y1 + dy * t;
            let offset = (Math.sin(t * Math.PI * 4 + frameCount * 0.55 + ec.x1 * 0.02) * 10 + Math.cos(t * 8 + frameCount * 0.3) * 5) * alpha;
            ctx.lineTo(px + perpX * offset, py + perpY * offset);
        }
        ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = 'rgba(220, 245, 255, ' + (alpha * 0.55) + ')'; ctx.lineWidth = 0.7; ctx.shadowBlur = 3;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.shadowBlur = 0;
    });
    
    explosions.forEach(exp => { 
        let alpha = exp.life / exp.maxLife; 
        if(exp.type === 'ice') { ctx.fillStyle = `rgba(0, 200, 255, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = `rgba(100, 230, 255, ${alpha})`; ctx.lineWidth = 2; ctx.stroke(); } 
        else if(exp.type === 'poison') { ctx.fillStyle = `rgba(80, 200, 0, ${alpha * 0.4})`; ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = `rgba(50, 180, 0, ${alpha})`; ctx.lineWidth = 3; ctx.stroke(); } 
        else { 
            ctx.fillStyle = `rgba(255, 80, 0, ${alpha * 0.5})`; 
            ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius, 0, Math.PI*2); ctx.fill(); 
            ctx.strokeStyle = `rgba(255, 170, 0, ${alpha})`; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = `rgba(255, 230, 100, ${alpha * 0.8})`; 
            ctx.beginPath(); ctx.arc(exp.x - camX, exp.y - camY, exp.radius * (1 - alpha), 0, Math.PI*2); ctx.fill();
        }
    });

    chests.forEach(c => { 
        let chestWidth = c.size * 2.8; let chestHeight = c.size * 1.8; let drawX = c.x - camX - (chestWidth / 2); let drawY = c.y - camY - (chestHeight / 2); 
        if (c.isSpecial) { 
            ctx.shadowBlur = 30; ctx.shadowColor = '#ffaa00'; ctx.fillStyle = '#3a1a00'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); 
            ctx.fillStyle = '#ffaa00'; ctx.fillRect(drawX - 5, drawY - 5, chestWidth + 10, 10); ctx.fillRect(drawX - 5, drawY + chestHeight - 5, chestWidth + 10, 10);
            ctx.fillStyle = '#ffd700'; ctx.fillRect(drawX + chestWidth/2 - 15, drawY + chestHeight/2 - 15, 30, 30); ctx.shadowBlur = 0; 
        } else if (c.isEpic) {
            if(chestEpicImg.complete && chestEpicImg.naturalWidth > 0) { ctx.drawImage(chestEpicImg, drawX, drawY, chestWidth, chestHeight); }
            else { ctx.shadowBlur = 25; ctx.shadowColor = '#cc44ff'; ctx.fillStyle = '#200040'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); ctx.fillStyle = '#cc44ff'; ctx.fillRect(drawX + chestWidth/2 - 4, drawY + chestHeight/2 - 6, 8, 12); ctx.shadowBlur = 0; }
        } else if(chestImg.complete && chestImg.naturalWidth > 0) { ctx.drawImage(chestImg, drawX, drawY, chestWidth, chestHeight); } 
        else { ctx.fillStyle = '#3a1a08'; ctx.fillRect(drawX, drawY, chestWidth, chestHeight); ctx.fillStyle = '#1a0804'; ctx.fillRect(drawX, drawY + chestHeight/2 - 4, chestWidth, 8); ctx.fillStyle = '#ffaa00'; ctx.fillRect(drawX + chestWidth/2 - 4, drawY + chestHeight/2 - 6, 8, 12); } 
    });

    if(player.hasOrbs && player.orbLevel > 0) { 
        let orbDist = 100; let numOrbs = player.orbLevel * 2;
        player.orbTrail.forEach(t => { ctx.fillStyle = `rgba(255, 170, 0, ${t.life/60})`; ctx.beginPath(); ctx.arc(t.x - camX, t.y - camY, 8, 0, Math.PI*2); ctx.fill(); }); 
        for(let i=0; i<numOrbs; i++) {
            let angleOffset = (Math.PI * 2 / numOrbs) * i;
            let ox = player.x + Math.cos(player.orbAngle + angleOffset) * orbDist; 
            let oy = player.y + Math.sin(player.orbAngle + angleOffset) * orbDist;
            ctx.fillStyle = '#ffaa00'; ctx.shadowBlur = 12; ctx.shadowColor = '#ff6600'; 
            ctx.beginPath(); ctx.arc(ox - camX, oy - camY, 5, 0, Math.PI*2); ctx.fill(); 
            ctx.shadowBlur = 0; 
        }
    }
    
    player.miniMes.forEach(m => { let cx = m.x - camX; let cy = m.y - camY; ctx.fillStyle = '#aa6600'; ctx.fillRect(cx - 8, cy - 8, 16, 20); ctx.beginPath(); ctx.arc(cx, cy - 10, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(cx, cy - 10, 4, 0, Math.PI*2); ctx.fill(); });
    
    gems.forEach(g => { 
        if (g.isCrystal) { ctx.fillStyle = '#cc44ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#cc44ff'; let dx = g.x - camX; let dy = g.y - camY; ctx.beginPath(); ctx.moveTo(dx, dy - 10); ctx.lineTo(dx + 8, dy); ctx.lineTo(dx, dy + 10); ctx.lineTo(dx - 8, dy); ctx.fill(); ctx.shadowBlur = 0; } 
        else { ctx.fillStyle = g.isSuper ? '#ffaa00' : '#ff6600'; ctx.shadowBlur = 6; ctx.shadowColor = g.isSuper ? '#ffaa00' : '#ff4400'; ctx.beginPath(); ctx.arc(g.x - camX, g.y - camY, g.isSuper ? 8 : 4, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
    });

    enemyBullets.forEach(b => { 
        if (b.isFireball) {
            ctx.fillStyle = '#ff4500'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff2200';
            ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 12, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 6, 0, Math.PI*2); ctx.fill(); 
        } else {
            ctx.fillStyle = '#cc44ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#cc44ff'; 
            ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, 6, 0, Math.PI*2); ctx.fill(); 
        }
    }); 
    ctx.shadowBlur = 0;

    bullets.forEach(b => { drawProjectile(b, camX, camY); });
    beams.forEach(b => { ctx.save(); let alpha = b.life / b.maxLife; ctx.globalAlpha = alpha; ctx.strokeStyle = b.color; ctx.lineWidth = 15 * alpha; ctx.lineCap = "round"; ctx.shadowBlur = 20; ctx.shadowColor = b.color; ctx.beginPath(); ctx.moveTo(b.x - camX, b.y - camY); ctx.lineTo(b.x - camX + Math.cos(b.angle)*b.range, b.y - camY + Math.sin(b.angle)*b.range); ctx.stroke(); ctx.strokeStyle = "white"; ctx.lineWidth = 5 * alpha; ctx.stroke(); ctx.restore(); });

    enemies.forEach(e => { 
        let bx = e.x - camX; let by = e.y - camY; 
        
        let currentFill = e.color;
        if (e.electrifiedTimer > 0) currentFill = (frameCount % 4 < 2) ? "#00ffff" : "#ffffff";
        else if (e.hitTimer > 0) currentFill = "#ffcc88"; 
        else if (e.frozenTimer > 0) currentFill = "#88ccff"; 
        else if (e.poisonTimer > 0) currentFill = "#aa44aa"; 
        else if (e.burnTimer > 0) currentFill = "#ff8800";
        
        let armColor = '#5a0000'; if(e.type === 'miniboss') armColor = '#8b6900'; else if(e.type === 'tank') armColor = '#3a0000'; else if(e.type === 'shooter') armColor = '#380044'; 
        if(e.type === 'miniboss') { ctx.shadowBlur = 20; ctx.shadowColor = '#ffaa00'; } 
        let armOffset = Math.sin(frameCount * 0.05 + e.x) * (e.size * 0.5); let bodyW = e.size * 0.8; let bodyH = e.size * 1.2; let armW = e.size * 1.0; let armH = e.size * 1.8; 
        ctx.fillStyle = armColor; ctx.fillRect(bx - bodyW/2 - armW + 2, by - bodyH/2 + armOffset, armW, armH); ctx.fillRect(bx + bodyW/2 - 2, by - bodyH/2 - armOffset, armW, armH); 
        if(e.type === 'shooter') { ctx.fillStyle = '#444'; let handY = by - bodyH/2 - armOffset + armH - 4; ctx.fillRect(bx + bodyW/2 + armW/2, handY, e.size*1.5, 5); ctx.fillRect(bx + bodyW/2 + armW/2, handY, 5, 10); } 
        ctx.fillStyle = currentFill; ctx.fillRect(bx - bodyW/2, by - bodyH/2, bodyW, bodyH); ctx.beginPath(); ctx.arc(bx, by - bodyH/2 - e.size*0.3, e.size * 0.9, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; 
        if(e.type === 'miniboss') { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 40, by - e.size*2.5, 80, 8); ctx.fillStyle = '#ff4400'; ctx.fillRect(bx - 40, by - e.size*2.5, 80 * (Math.max(0, e.hp)/e.maxHp), 8); ctx.strokeStyle = 'rgba(255,170,0,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 40, by - e.size*2.5, 80, 8); } 

        if (e.electrifiedTimer > 0) {
            ctx.strokeStyle = "cyan"; ctx.lineWidth = 2; ctx.beginPath();
            let r = e.size * 1.5;
            ctx.moveTo(bx - r + Math.random()*r, by - r + Math.random()*r);
            ctx.lineTo(bx + Math.random()*r, by + Math.random()*r);
            ctx.stroke();
        }

        if (e.type === 'miniboss' && e.advanced && e.state === 'telegraph_dash') {
            let tx = e.targetX - camX; let ty = e.targetY - camY;
            ctx.strokeStyle = "rgba(255, 100, 0, 0.8)"; ctx.lineWidth = 3;
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
            let targets = enemies.filter(t => Math.hypot(t.x - player.x, t.y - player.y) <= w.range);
            if (targets.length === 0) {
                targets = rocks.filter(r => Math.hypot(r.x - player.x, r.y - player.y) <= w.range);
            }
            if (targets.length > 0) { 
                let closest = targets.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev); 
                angle = Math.atan2(closest.y - player.y, closest.x - player.x); 
            }
        }
        
        ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle); 
        let handOffsetX = 15; let handOffsetY = 0; 
        if (index === 0) handOffsetY = 15; else if (index === 1) handOffsetY = -15; else if (index === 2) { handOffsetX = 25; handOffsetY = 0; }
        ctx.translate(handOffsetX, handOffsetY); 
        if (Math.abs(angle) > Math.PI / 2 && w.id !== 'bastone_veleno') { ctx.scale(1, -1); }
        if (WEAPON_MODELS[w.id]) { WEAPON_MODELS[w.id](ctx, w.weaponSize, w.color); } ctx.restore();
    });

    if (player.iFrames > 0 && frameCount % 4 < 2) { ctx.globalAlpha = 0.3; } 
    if (player.shield > 0) { ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY, player.size + 10, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,140,0,0.25)'; ctx.fill(); }
    
    let pBodyW = player.size * 1.2; let pBodyH = player.size * 1.8;
    let eqColors = { '1': '#6b4020', '2': '#888888', '3': '#ffaa00' }; 
    let eColor = equippedItems.elmo ? eqColors[equippedItems.elmo.split('_')[1]] : null;
    let cColor = equippedItems.corazza ? eqColors[equippedItems.corazza.split('_')[1]] : null;

    ctx.fillStyle = '#00cc55'; 
    if (player.charId === 0) { 
        ctx.fillRect(screenCenterX - pBodyW/2, screenCenterY - pBodyH/2 + 5, pBodyW, pBodyH); 
    } else if (player.charId === 1) { 
        ctx.beginPath(); ctx.moveTo(screenCenterX, screenCenterY - pBodyH/2 + 5); ctx.lineTo(screenCenterX + pBodyW, screenCenterY + pBodyH/2 + 5); ctx.lineTo(screenCenterX - pBodyW, screenCenterY + pBodyH/2 + 5); ctx.fill(); 
    } else if (player.charId === 2) { 
        ctx.beginPath(); ctx.moveTo(screenCenterX - pBodyW, screenCenterY - pBodyH/2 + 5); ctx.lineTo(screenCenterX + pBodyW, screenCenterY - pBodyH/2 + 5); ctx.lineTo(screenCenterX, screenCenterY + pBodyH/2 + 5); ctx.fill(); 
    } else if (player.charId === 3) { 
        ctx.fillRect(screenCenterX - pBodyW/2, screenCenterY - pBodyH/2 + 5, pBodyW, pBodyH); 
    }
    
    if (cColor) { ctx.fillStyle = cColor; ctx.fillRect(screenCenterX - pBodyW*0.6, screenCenterY - pBodyH*0.2, pBodyW*1.2, pBodyH*0.6); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(screenCenterX - pBodyW*0.6, screenCenterY - pBodyH*0.2, pBodyW*1.2, pBodyH*0.6); }

    ctx.fillStyle = '#00cc55'; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2, player.size * 0.6, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = 'rgba(255,170,0,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY, player.pickupRange, 0, Math.PI*2); ctx.stroke();
    
    if (eColor && player.charId !== 3) { ctx.fillStyle = eColor; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2 - 2, player.size * 0.65, Math.PI, Math.PI*2); ctx.fill(); ctx.fillRect(screenCenterX - player.size*0.65, screenCenterY - pBodyH/2 - 2, player.size*1.3, 6); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(screenCenterX, screenCenterY - pBodyH/2 - 2, player.size * 0.65, Math.PI, Math.PI*2); ctx.stroke(); }
    ctx.globalAlpha = 1;

    ctx.font = "bold 18px 'Cinzel Decorative', serif"; ctx.fillStyle = "#ffaa00"; ctx.shadowBlur = 8; ctx.shadowColor = "rgba(255,100,0,0.7)"; ctx.textAlign = 'center'; ctx.fillText(activePlayerName, screenCenterX, screenCenterY - pBodyH/2 - player.size - 25); ctx.shadowBlur = 0;

    if (player.charId === 3) {
        let hatColor = '#4a2a8a';
        if (eColor) { hatColor = eColor; } 
        let hatX = screenCenterX; let hatY = screenCenterY - pBodyH/2 - player.size * 0.45;
        ctx.fillStyle = hatColor; ctx.shadowBlur = 10; ctx.shadowColor = hatColor;
        ctx.beginPath(); ctx.ellipse(hatX, hatY + 4, player.size * 1.0, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hatX - player.size * 0.7, hatY + 4);
        ctx.lineTo(hatX, hatY - player.size * 1.4);
        ctx.lineTo(hatX + player.size * 0.7, hatY + 4); ctx.fill();
        ctx.fillStyle = '#ffff00'; ctx.shadowColor = '#ffff00';
        ctx.font = `${player.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('★', hatX, hatY - player.size * 1.2);
        ctx.shadowBlur = 0;
    }

    let normalChests = chests.filter(c => !c.isSpecial && !c.isEpic && !c.isBossChest);
    if (normalChests.length > 0) { let closestChest = normalChests.reduce((prev, curr) => Math.hypot(curr.x - player.x, curr.y - player.y) < Math.hypot(prev.x - player.x, prev.y - player.y) ? curr : prev); let dist = Math.hypot(closestChest.x - player.x, closestChest.y - player.y); if (dist > 200 && dist < 1500) { let angle = Math.atan2(closestChest.y - player.y, closestChest.x - player.x); ctx.save(); ctx.translate(screenCenterX, screenCenterY); ctx.rotate(angle); ctx.fillStyle = '#ffaa00'; ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(60, -15); ctx.lineTo(60, 15); ctx.fill(); ctx.restore(); } }
    
    let bossTarget = enemies.find(e => e.type === 'miniboss'); let droppedBossChest = chests.find(c => c.isBossChest);
    if (bossTarget || droppedBossChest) {
        let targetX = bossTarget ? bossTarget.x : droppedBossChest.x; let targetY = bossTarget ? bossTarget.y : droppedBossChest.y; let dist = Math.hypot(targetX - player.x, targetY - player.y);
        if (dist > 150) { 
            let angle = Math.atan2(targetY - player.y, targetX - player.x); ctx.save(); ctx.translate(screenCenterX, screenCenterY); let cx = Math.cos(angle) * 110; let cy = Math.sin(angle) * 110; 
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.fillStyle = droppedBossChest ? '#cc44ff' : '#ff4400'; ctx.shadowColor = droppedBossChest ? '#cc44ff' : '#ff2200'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(0, -15); ctx.lineTo(0, 15); ctx.fill(); ctx.restore(); 
            ctx.font = "28px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = droppedBossChest ? '#cc44ff' : "#ff2200"; ctx.shadowBlur = 15; ctx.fillText(droppedBossChest ? "⬡" : "☠", cx - Math.cos(angle)*25, cy - Math.sin(angle)*25); ctx.restore(); 
        } 
    }
    
    ctx.restore(); 
}

// --- ESPOSIZIONE GLOBALE PER HTML ---
function bindButtons() {
    document.getElementById('btn-gioca').addEventListener('click', startGame);
    document.getElementById('btn-personaggi').addEventListener('click', showCharacterSelect);
    document.getElementById('btn-equip').addEventListener('click', showEquipmentMenu);
    document.getElementById('btn-battlepass').addEventListener('click', showBattlePassModal);
    document.getElementById('btn-missions').addEventListener('click', showMissionsModal);
    document.getElementById('btn-settings').addEventListener('click', showSettingsModal);
    document.getElementById('btn-back-equip').addEventListener('click', backToMenu);
    document.getElementById('btn-back-char').addEventListener('click', backToMenu);
    document.getElementById('btn-back-gameover').addEventListener('click', backToMenu);
    document.getElementById('btn-rigioca').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    document.getElementById('btn-surrender').addEventListener('click', surrender);
    document.getElementById('btn-close-bp').addEventListener('click', closeBattlePassModal);
    document.getElementById('btn-close-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('btn-close-missions').addEventListener('click', closeMissionsModal);
    document.getElementById('tab-btn-cheat').addEventListener('click', () => switchSettingsTab('cheat'));
    document.getElementById('tab-btn-stats').addEventListener('click', () => switchSettingsTab('stats'));
    document.getElementById('btn-cheat-confirm').addEventListener('click', checkCheatCode);
    document.getElementById('rep-btn0').addEventListener('click', () => confirmReplace(0));
    document.getElementById('rep-btn1').addEventListener('click', () => confirmReplace(1));
    document.getElementById('rep-btn2').addEventListener('click', () => confirmReplace(2));
    document.getElementById('btn-cancel-replace').addEventListener('click', cancelReplace);
    document.getElementById('player-name-input').addEventListener('keyup', savePlayerName);
    document.getElementById('player-name-input').addEventListener('blur', savePlayerName);

    window.claimBattlePass = claimBattlePass;
    window.claimMission = claimMission;
    window.buyEquip = buyEquip;
    window.buyDoubleAmulet = buyDoubleAmulet;
    window.equipItem = equipItem;
    window.unequipItem = unequipItem;
    window.upgradeChar = upgradeChar;
    window.changeSelectedCharId = (id) => { selectedCharId = id; };
    window.closeEpicModal = closeEpicModal;
    window.closeBossModal = closeBossModal;
}

showMenu();
bindButtons();

