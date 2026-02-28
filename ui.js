// --- FUNZIONI DI SALVATAGGIO STATISTICHE E MISSIONI ---
function saveGameStats() { localStorage.setItem('survivorGameStats', JSON.stringify(gameStats)); }
function saveDailyMissions() { localStorage.setItem('survivorDaily', JSON.stringify(dailyMissions)); updateMissionBadge(); }

function checkDailyMissionsStatus() {
    let hasUnclaimed = false;
    if (dailyMissions.bossesKilled >= 5 && !dailyMissions.claim1) hasUnclaimed = true;
    if (dailyMissions.levelsGained >= 10 && !dailyMissions.claim2) hasUnclaimed = true;
    if (dailyMissions.itemsBought >= 1 && !dailyMissions.claim3) hasUnclaimed = true;
    return hasUnclaimed;
}

function updateMissionBadge() {
    let badge = document.getElementById('mission-badge');
    if(checkDailyMissionsStatus()) { badge.style.display = 'block'; } else { badge.style.display = 'none'; }
}

function showMissionsModal() {
    let container = document.getElementById('missions-container');
    container.innerHTML = '';
    let m1Prog = Math.min(dailyMissions.bossesKilled, 5); let m1Done = m1Prog >= 5;
    container.innerHTML += `
        <div class="mission-card">
            <p class="mission-title">💀 Uccidi 5 Boss</p>
            <p class="mission-reward">Premio: 100 💎</p>
            <div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m1Prog/5)*100}%;"></div></div>
            <p style="font-size:12px; margin-top:0; text-align:right;">${m1Prog}/5</p>
            ${dailyMissions.claim1 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m1Done ? '' : 'disabled'} onclick="claimMission(1, 100)">Riscuoti</button>`}
        </div>
    `;
    let m2Prog = Math.min(dailyMissions.levelsGained, 10); let m2Done = m2Prog >= 10;
    container.innerHTML += `
        <div class="mission-card">
            <p class="mission-title">⬆️ Guadagna 10 Livelli</p>
            <p class="mission-reward">Premio: 20 💎</p>
            <div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m2Prog/10)*100}%;"></div></div>
            <p style="font-size:12px; margin-top:0; text-align:right;">${m2Prog}/10</p>
            ${dailyMissions.claim2 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m2Done ? '' : 'disabled'} onclick="claimMission(2, 20)">Riscuoti</button>`}
        </div>
    `;
    let m3Prog = Math.min(dailyMissions.itemsBought, 1); let m3Done = m3Prog >= 1;
    container.innerHTML += `
        <div class="mission-card">
            <p class="mission-title">🎒 Acquista 1 Oggetto</p>
            <p class="mission-reward">Premio: 50 💎</p>
            <div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m3Prog/1)*100}%;"></div></div>
            <p style="font-size:12px; margin-top:0; text-align:right;">${m3Prog}/1</p>
            ${dailyMissions.claim3 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m3Done ? '' : 'disabled'} onclick="claimMission(3, 50)">Riscuoti</button>`}
        </div>
    `;
    document.getElementById('missions-modal').style.display = 'block';
}

function closeMissionsModal() { document.getElementById('missions-modal').style.display = 'none'; }

function claimMission(id, reward) {
    if (id === 1) dailyMissions.claim1 = true;
    if (id === 2) dailyMissions.claim2 = true;
    if (id === 3) dailyMissions.claim3 = true;
    totalCrystals += reward;
    localStorage.setItem('survivorCrystals', totalCrystals);
    saveDailyMissions();
    showMissionsModal(); 
    alert(`Hai ricevuto ${reward} Cristalli! 💎`);
}

// --- MENU PRINCIPALE E IMPOSTAZIONI ---
function savePlayerName() { let inputVal = document.getElementById('player-name-input').value.trim(); localStorage.setItem('survivorPlayerName', inputVal); savedName = inputVal; }

function showSettingsModal() { 
    document.getElementById('stat-enemies').innerText = gameStats.enemiesKilled;
    document.getElementById('stat-bosses').innerText = gameStats.bossesKilled;
    document.getElementById('stat-maxlevel').innerText = gameStats.maxLevelReached;
    document.getElementById('stat-spent').innerText = gameStats.crystalsSpent;
    document.getElementById('settings-modal').style.display = 'block'; 
}
function closeSettingsModal() { document.getElementById('settings-modal').style.display = 'none'; }

function switchSettingsTab(tabName) {
    document.getElementById('tab-btn-cheat').classList.remove('active');
    document.getElementById('tab-btn-stats').classList.remove('active');
    document.getElementById('tab-content-cheat').style.display = 'none';
    document.getElementById('tab-content-stats').style.display = 'none';

    document.getElementById('tab-btn-' + tabName).classList.add('active');
    document.getElementById('tab-content-' + tabName).style.display = 'block';
}

function checkCheatCode() {
    let input = document.getElementById('cheat-input').value.trim().toLowerCase(); 
    if (input === "160105") { 
        cheatUnlocked = true; localStorage.setItem('survivorCheat', 'true'); 
        unlockedEquip = []; ['elmo', 'corazza', 'amuleto'].forEach(cat => { EQUIP_DB[cat].forEach(item => unlockedEquip.push(item.id)); });
        localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip));
        charLevels = {0:3, 1:3, 2:3}; localStorage.setItem('survivorCharLevels', JSON.stringify(charLevels));
        alert("✔️ CODICE ACCETTATO!\nTutti i personaggi (Lv.3) e gli equipaggiamenti sono sbloccati per sempre."); 
        closeSettingsModal(); if(document.getElementById('equipment-select').style.display === 'flex') updateEquipMenuUI();
    } else if (input === "tesoro") {
        totalCrystals += 1000; localStorage.setItem('survivorCrystals', totalCrystals);
        alert("💎 +1000 CRISTALLI!\nHai ricevuto una fornitura di cristalli."); closeSettingsModal(); 
        if(document.getElementById('equipment-select').style.display === 'flex') updateEquipMenuUI();
    } else if (input === "azzera") {
        localStorage.clear(); alert("🔄 PROGRESSI RESETTATI!\nIl gioco si riavvierà."); location.reload(); 
    } else { alert("❌ Codice errato."); } 
    document.getElementById('cheat-input').value = "";
}

// --- ARMERIA ED EQUIPAGGIAMENTO ---
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

function buyDoubleAmulet() { 
    if (totalCrystals >= 3000) { 
        totalCrystals -= 3000; hasDoubleAmulet = true; 
        gameStats.crystalsSpent += 3000; saveGameStats();
        dailyMissions.itemsBought++; saveDailyMissions();
        localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorDoubleAmulet', 'true'); updateEquipMenuUI(); 
    } 
}
function buyEquip(id, price) { 
    if (totalCrystals >= price) { 
        totalCrystals -= price; unlockedEquip.push(id); 
        gameStats.crystalsSpent += price; saveGameStats();
        dailyMissions.itemsBought++; saveDailyMissions();
        localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorUnlockedEquip', JSON.stringify(unlockedEquip)); updateEquipMenuUI(); 
    } 
}

function equipItem(category, id) { 
    if (category === 'amuleto') { if (!hasDoubleAmulet) { equippedItems.amuleto1 = id; equippedItems.amuleto2 = null; } else { if (!equippedItems.amuleto1) equippedItems.amuleto1 = id; else if (!equippedItems.amuleto2 && equippedItems.amuleto1 !== id) equippedItems.amuleto2 = id; else equippedItems.amuleto1 = id; } } else { equippedItems[category] = id; }
    localStorage.setItem('survivorEquipped', JSON.stringify(equippedItems)); updateEquipMenuUI(); 
}
function unequipItem(category, id) {
    if (category === 'amuleto') { if (equippedItems.amuleto1 === id) equippedItems.amuleto1 = null; if (equippedItems.amuleto2 === id) equippedItems.amuleto2 = null; } else { equippedItems[category] = null; }
    localStorage.setItem('survivorEquipped', JSON.stringify(equippedItems)); updateEquipMenuUI(); 
}

function getEquipStat(category) { if (!equippedItems[category]) return 0; let item = EQUIP_DB[category].find(x => x.id === equippedItems[category]); return item ? item.value : 0; }
function hasAmulet(amuletId) { return equippedItems.amuleto1 === amuletId || equippedItems.amuleto2 === amuletId; }

// --- PERSONAGGI ---
function upgradeChar(id) {
    if (charLevels[id] < 3 && totalCrystals >= 1000) { 
        totalCrystals -= 1000; charLevels[id]++; 
        gameStats.crystalsSpent += 1000; saveGameStats();
        localStorage.setItem('survivorCrystals', totalCrystals); localStorage.setItem('survivorCharLevels', JSON.stringify(charLevels)); showCharacterSelect(); 
    }
}

function showCharacterSelect() {
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('character-select').style.display = 'flex';
    document.getElementById('char-crystal-count').innerText = totalCrystals;
    const container = document.getElementById('char-cards-container'); container.innerHTML = '';
    CHARACTERS.forEach(char => {
        let isUnlocked = cheatUnlocked || maxLevelReached >= char.reqLevel; let isSelected = selectedCharId === char.id;
        let cLevel = charLevels[char.id] || 1; let stars = "⭐".repeat(cLevel) + "☆".repeat(3-cLevel);
        let wList = [...char.weapons]; if (cLevel >= 2) wList.push(char.lv2Weapon); let wNames = wList.map(w => WEAPONS_DB[w].name).join(", ");
        let card = document.createElement('div'); card.className = `char-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
        let upgHtml = '';
        if (isUnlocked && cLevel < 3) { upgHtml = `<button class="btn-level-up" ${totalCrystals < 1000 ? 'disabled' : ''} onclick="event.stopPropagation(); upgradeChar(${char.id})">Level Up (1000💎)</button>`; } 
        else if (cLevel === 3) { upgHtml = `<p style="color:gold; font-size:12px; margin-top:10px;">MAX LEVEL<br>Può impugnare 3 armi!</p>`; }
        card.innerHTML = `<h3>${char.name} <br><span style="font-size:14px; color:gold;">${stars}</span></h3><p style="color:#aaa; font-size:14px;">${char.desc}</p><div class="char-weapons-list">${wNames}</div><p style="color:#00ffff; font-size:12px;">Armi base</p>${upgHtml}${!isUnlocked ? `<div class="lock-icon">🔒<br><span style="font-size:14px;">Liv. ${char.reqLevel}</span></div>` : ''}`;
        if (isUnlocked) { card.onclick = () => { selectedCharId = char.id; showCharacterSelect(); }; } container.appendChild(card);
    });
}

// --- NAVIGAZIONE MENU E FINE PARTITA ---
function showMenu() { updateMissionBadge(); gameState = "MENU"; document.getElementById('main-menu').style.display = 'flex'; document.getElementById('character-select').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'none'; document.getElementById('game-ui').style.display = 'none'; document.getElementById('equipment-select').style.display = 'none'; canvas.style.display = 'none'; document.getElementById('player-name-input').value = savedName; }
function backToMenu() { showMenu(); }

function togglePause() { 
    if (gameState !== "PLAYING") return; 
    let lvlModal = document.getElementById('levelup-modal').style.display; let bossModal = document.getElementById('boss-modal').style.display; let repModal = document.getElementById('replace-modal').style.display; let epicModal = document.getElementById('epic-modal').style.display;
    if (lvlModal === 'block' || bossModal === 'block' || repModal === 'block' || epicModal === 'block') return; 
    let pauseModal = document.getElementById('pause-modal');
    if (paused) { paused = false; pauseModal.style.display = 'none'; } else { paused = true; pauseModal.style.display = 'block'; } 
}

function surrender() { document.getElementById('pause-modal').style.display = 'none'; player.hp = 0; updateBarsUI(); triggerGameOver(); }

function triggerGameOver() { 
    paused = true; gameState = "GAMEOVER"; 
    saveGameStats(); saveDailyMissions();
    document.getElementById('run-crystals').innerText = sessionCrystals; document.getElementById('final-level').innerText = level; document.getElementById('game-ui').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'flex'; 
}

// --- INTERFACCIA DI GIOCO E POPUP ---
function updateBarsUI() { document.getElementById('hp-bar-fill').style.width = (Math.max(0, player.hp) / player.maxHp * 100) + '%'; if(player.maxShield > 0) { document.getElementById('shield-bar-fill').style.width = (Math.max(0, player.shield) / player.maxShield * 100) + '%'; } }
function updateWeaponsUI() { const ui = document.getElementById('weapons-ui'); ui.innerHTML = ''; player.weapons.forEach(w => { ui.innerHTML += `<div class="weapon-slot" style="color:${w.color}">${w.name} <span class="weapon-lvl">Lv.${w.level}</span></div>`; }); }
function showItemFeedback(text, color) { let el = document.createElement('div'); el.className = 'item-feedback'; el.innerHTML = text; el.style.color = color; el.style.left = (canvas.width/2 - 150) + 'px'; el.style.top = (canvas.height/2 - 80) + 'px'; el.style.width = "300px"; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); }

// --- MODALI DEI POTENZIAMENTI (LEVEL UP E CASSE) ---
function buildUpgradePool() {
    let pool = [];
    player.weapons.forEach(w => { 
        pool.push({ name: `<span class="upgrade-title" style="color:${w.color}">⏫ Potenzia ${w.name} (Lv.${w.level + 1})</span><span class="upgrade-desc">Danni e velocità incrementati</span>`, apply: () => { 
            w.level++; 
            if (w.id !== 'freezer' && w.id !== 'cerbottana') w.currentDamage += Math.floor(w.baseDamage * 0.4); 
            if (w.id === 'cerbottana') w.poisonDamage += 5; 
            if (w.id === 'bastone_veleno') w.range = Math.min(350, w.range + 15); 
            w.currentFireRate = Math.max(5, w.currentFireRate - (w.id === 'freezer' ? 8 : 5)); 
            updateWeaponsUI(); finishUpgrade(); 
        }}); 
    });
    
    let charWeapons = CHARACTERS.find(c => c.id === player.charId).weapons;
    let poolWeps = [...charWeapons];
    if (player.charLevel >= 2) poolWeps.push(CHARACTERS.find(c => c.id === player.charId).lv2Weapon);

    poolWeps.forEach(wId => { 
        let wt = WEAPONS_DB[wId]; 
        if (!player.weapons.find(owned => owned.id === wt.id)) { 
            pool.push({ name: `<span class="upgrade-title" style="color:${wt.color}">🆕 Prendi: ${wt.name}</span><span class="upgrade-desc">Aggiungi all'arsenale</span>`, apply: () => { handleNewWeapon(wt); } }); 
        } 
    });
    
    pool.push({ name: `<span class="upgrade-title">🏃 Velocità Movimento</span><span class="upgrade-desc">Corri più veloce</span>`, apply: () => { player.speed += 1; finishUpgrade(); } });
    pool.push({ name: `<span class="upgrade-title">🧲 Raggio Magnetico</span><span class="upgrade-desc">Raccogli da più lontano</span>`, apply: () => { player.pickupRange += 40; finishUpgrade(); } });
    return pool;
}

function freeUpgrade() { paused = true; let pool = buildUpgradePool(); let shuffled = pool.sort(() => 0.5 - Math.random()); currentChoices = shuffled.slice(0, 3); for(let i=0; i<3; i++) { let btn = document.getElementById('btn'+i); btn.innerHTML = currentChoices[i].name; btn.onclick = () => { document.getElementById('levelup-modal').style.display = 'none'; currentChoices[i].apply(); }; } document.getElementById('levelup-title').innerText = "Cassa: Scelta Gratuita!"; document.getElementById('levelup-title').style.color = "#ffff00"; document.getElementById('levelup-modal').style.display = 'block'; }

function showEpicChestModal() { paused = true; let randomRelic = ["🤖 Mini Me", "🌀 Palle Rotanti", "🛡️ Scudo Rigenerativo"][Math.floor(Math.random()*3)]; let relicAction; if (randomRelic === "🤖 Mini Me") relicAction = () => { player.miniMes.push({x: player.x, y: player.y, fireTimer: 0, burstCount: 0}); closeEpicModal(); }; if (randomRelic === "🌀 Palle Rotanti") relicAction = () => { player.hasOrbs = true; closeEpicModal(); }; if (randomRelic === "🛡️ Scudo Rigenerativo") relicAction = () => { player.maxShield += 50; player.shield = player.maxShield; document.getElementById('shield-ui').style.display = 'flex'; updateBarsUI(); closeEpicModal(); }; let pool = [ { name: `<span class="upgrade-title" style="color:#bf00ff;">💎 20 Cristalli</span>`, apply: () => { totalCrystals+=20; sessionCrystals+=20; localStorage.setItem('survivorCrystals', totalCrystals); document.getElementById('crystal-count').innerText = sessionCrystals; closeEpicModal(); } }, { name: `<span class="upgrade-title" style="color:#00ffff;">🎁 ${randomRelic}</span>`, apply: relicAction }, { name: `<span class="upgrade-title" style="color:#00ff00;">❤️ Cura Totale & +XP</span>`, apply: () => { player.hp = player.maxHp; updateBarsUI(); xp += xpNeeded * 2; closeEpicModal(); } } ]; for(let i=0; i<3; i++) { let btn = document.getElementById('epic-btn'+i); btn.innerHTML = pool[i].name; btn.onclick = pool[i].apply; } document.getElementById('epic-modal').style.display = 'block'; }
function closeEpicModal() { document.getElementById('epic-modal').style.display = 'none'; paused = false; }

function showBossRelicModal() { paused = true; let pool = [ { name: `<span class="upgrade-title">🌀 Palle Rotanti</span><span class="upgrade-desc">2 sfere lasciano una scia dannosa</span>`, apply: () => { player.hasOrbs = true; closeBossModal(); } }, { name: `<span class="upgrade-title">🛡️ Scudo Rigenerativo</span><span class="upgrade-desc">Assorbe danni e si ricarica da solo</span>`, apply: () => { player.maxShield += 50; player.shield = player.maxShield; document.getElementById('shield-ui').style.display = 'flex'; updateBarsUI(); closeBossModal(); } } ]; if (player.miniMes.length < 3) { pool.push({ name: `<span class="upgrade-title">🤖 Mini Me</span><span class="upgrade-desc">Un robottino immortale che spara a raffica</span>`, apply: () => { player.miniMes.push({x: player.x, y: player.y, fireTimer: 0, burstCount: 0}); closeBossModal(); } }); } else { pool.push({ name: `<span class="upgrade-title">❤️ Titanico</span><span class="upgrade-desc">Aumenta e cura tutti gli HP</span>`, apply: () => { player.maxHp += 100; player.hp = player.maxHp; updateBarsUI(); closeBossModal(); } }); } for(let i=0; i<3; i++) { let btn = document.getElementById('boss-btn'+i); btn.innerHTML = pool[i].name; btn.onclick = pool[i].apply; } document.getElementById('boss-modal').style.display = 'block'; }
function closeBossModal() { document.getElementById('boss-modal').style.display = 'none'; paused = false; }

function handleNewWeapon(weaponData) { 
    if (player.weapons.length < player.maxWeapons) { giveWeapon(weaponData); finishUpgrade(); } 
    else { 
        pendingWeapon = weaponData; 
        document.getElementById('new-weapon-name').innerHTML = `<span style="color:${weaponData.color}">${weaponData.name}</span>`; 
        document.getElementById('rep-btn0').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[0].color}">Scarta ${player.weapons[0].name}</span><span class="upgrade-desc">Lv. ${player.weapons[0].level}</span>`; 
        document.getElementById('rep-btn1').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[1].color}">Scarta ${player.weapons[1].name}</span><span class="upgrade-desc">Lv. ${player.weapons[1].level}</span>`; 
        if (player.maxWeapons === 3) {
            document.getElementById('rep-btn2').style.display = 'flex';
            document.getElementById('rep-btn2').innerHTML = `<span class="upgrade-title" style="color:${player.weapons[2].color}">Scarta ${player.weapons[2].name}</span><span class="upgrade-desc">Lv. ${player.weapons[2].level}</span>`;
        } else {
            document.getElementById('rep-btn2').style.display = 'none';
        }
        document.getElementById('replace-modal').style.display = 'block'; 
    } 
}
function confirmReplace(slotIndex) { player.weapons[slotIndex] = { ...pendingWeapon, level: 1, currentDamage: pendingWeapon.baseDamage, currentFireRate: pendingWeapon.fireRate, fireTimer: 0 }; updateWeaponsUI(); document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function cancelReplace() { document.getElementById('replace-modal').style.display = 'none'; finishUpgrade(); }
function finishUpgrade() { paused = false; }

showMenu(); // Inizializza tutto al caricamento
