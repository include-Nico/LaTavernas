// =========================================
// file: ui.js
// =========================================

import { CHARACTERS, EQUIP_DB, WEAPONS_DB } from './data.js';
import { 
    totalCrystals, battlePass, dailyMissions, gameStats, cheatUnlocked, 
    unlockedEquip, equippedItems, hasDoubleAmulet, charLevels, selectedCharId,
    maxLevelReached, savedName, canvas, magoUnlocked
} from './main.js';

export function updateBadges() {
    let missionBadge = document.getElementById('mission-badge'); let bpBadge = document.getElementById('bp-badge');
    let hasMission = (!dailyMissions.claim1 && dailyMissions.bossesKilled >= 5) || (!dailyMissions.claim2 && dailyMissions.levelsGained >= 10) || (!dailyMissions.claim3 && dailyMissions.itemsBought >= 1);
    if(missionBadge) missionBadge.style.display = hasMission ? 'block' : 'none';
    let hasBp = (!battlePass.claims[15] && battlePass.bosses >= 15) || (!battlePass.claims[30] && battlePass.bosses >= 30) || (!battlePass.claims[50] && battlePass.bosses >= 50) || (!battlePass.claims[100] && battlePass.bosses >= 100) || (!battlePass.claims[150] && battlePass.bosses >= 150);
    if(bpBadge) bpBadge.style.display = hasBp ? 'block' : 'none';
}

export function closeAllMenuModals() {
    document.getElementById('settings-modal').style.display = 'none';
    document.getElementById('missions-modal').style.display = 'none';
    document.getElementById('battlepass-modal').style.display = 'none';
    document.querySelectorAll('.top-icon-btn').forEach(btn => btn.style.display = 'flex');
}

export function showBattlePassModal() {
    closeAllMenuModals();
    document.querySelectorAll('.top-icon-btn').forEach(btn => btn.style.display = 'none');

    let container = document.getElementById('bp-tiers-container'); document.getElementById('bp-bosses-count').innerText = battlePass.bosses; document.getElementById('bp-progress-fill').style.width = Math.min((battlePass.bosses / 150) * 100, 100) + '%'; container.innerHTML = '';
    const tiers = [ { req: 15, rew: 200 }, { req: 30, rew: 400 }, { req: 50, rew: 600 }, { req: 100, rew: 800 }, { req: 150, rew: 1000 } ];
    tiers.forEach(t => {
        let isUnlocked = battlePass.bosses >= t.req; let isClaimed = battlePass.claims[t.req];
        let btnHtml = isClaimed ? `<button class="btn-claim" disabled>Riscattato ✅</button>` : isUnlocked ? `<button class="btn-claim" onclick="claimBattlePass(${t.req}, ${t.rew})">Riscuoti ${t.rew} ⬡</button>` : `<button class="btn-claim" disabled>Bloccato 🔒</button>`;
        container.innerHTML += `<div class="bp-card"><div><p class="mission-title" style="color: ${isUnlocked ? '#80ff60' : '#e8d8c0'};">Sconfiggi ${t.req} Titani</p><p class="mission-reward" style="margin:0;">Premio: ${t.rew} ⬡</p></div><div style="width: 120px;">${btnHtml}</div></div>`;
    });
    document.getElementById('battlepass-modal').style.display = 'block';
}

export function closeBattlePassModal() { 
    document.getElementById('battlepass-modal').style.display = 'none'; 
    document.querySelectorAll('.top-icon-btn').forEach(btn => btn.style.display = 'flex');
}

export function showMissionsModal() {
    closeAllMenuModals();
    document.querySelectorAll('.top-icon-btn').forEach(btn => btn.style.display = 'none');

    let container = document.getElementById('missions-container'); container.innerHTML = '';
    let m1Prog = Math.min(dailyMissions.bossesKilled, 5); let m1Done = m1Prog >= 5;
    container.innerHTML += `<div class="mission-card"><p class="mission-title">☠ Abbatti 5 Titani</p><p class="mission-reward">Premio: 100 ⬡</p><div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m1Prog/5)*100}%;"></div></div><p style="font-size:12px; margin-top:0; text-align:right; color:rgba(255,200,100,0.5);">${m1Prog}/5</p>${dailyMissions.claim1 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m1Done ? '' : 'disabled'} onclick="claimMission(1, 100)">Riscuoti</button>`}</div>`;
    let m2Prog = Math.min(dailyMissions.levelsGained, 10); let m2Done = m2Prog >= 10;
    container.innerHTML += `<div class="mission-card"><p class="mission-title">⬆ Ascendi 10 Livelli</p><p class="mission-reward">Premio: 20 ⬡</p><div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m2Prog/10)*100}%;"></div></div><p style="font-size:12px; margin-top:0; text-align:right; color:rgba(255,200,100,0.5);">${m2Prog}/10</p>${dailyMissions.claim2 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m2Done ? '' : 'disabled'} onclick="claimMission(2, 20)">Riscuoti</button>`}</div>`;
    let m3Prog = Math.min(dailyMissions.itemsBought, 1); let m3Done = m3Prog >= 1;
    container.innerHTML += `<div class="mission-card"><p class="mission-title">✦ Acquista 1 Equipaggiamento</p><p class="mission-reward">Premio: 50 ⬡</p><div class="mission-progress-bg"><div class="mission-progress-fill" style="width: ${(m3Prog/1)*100}%;"></div></div><p style="font-size:12px; margin-top:0; text-align:right; color:rgba(255,200,100,0.5);">${m3Prog}/1</p>${dailyMissions.claim3 ? '<button class="btn-claim" disabled>Completata ✅</button>' : `<button class="btn-claim" ${m3Done ? '' : 'disabled'} onclick="claimMission(3, 50)">Riscuoti</button>`}</div>`;
    document.getElementById('missions-modal').style.display = 'block';
}

export function closeMissionsModal() { 
    document.getElementById('missions-modal').style.display = 'none'; 
    document.querySelectorAll('.top-icon-btn').forEach(btn => btn.style.display = 'flex');
}

export function showSettingsModal() { 
    closeAllMenuModals(); 
    document.querySelectorAll('.top-icon-btn').forEach(btn => btn.style.display = 'none');

    document.getElementById('stat-enemies').innerText = gameStats.enemiesKilled; 
    document.getElementById('stat-bosses').innerText = gameStats.bossesKilled; 
    document.getElementById('stat-maxlevel').innerText = gameStats.maxLevelReached; 
    document.getElementById('stat-spent').innerText = gameStats.crystalsSpent; 
    document.getElementById('settings-modal').style.display = 'block'; 
}

export function closeSettingsModal() { 
    document.getElementById('settings-modal').style.display = 'none'; 
    document.querySelectorAll('.top-icon-btn').forEach(btn => btn.style.display = 'flex');
}

export function switchSettingsTab(tabName) { document.getElementById('tab-btn-cheat').classList.remove('active'); document.getElementById('tab-btn-stats').classList.remove('active'); document.getElementById('tab-content-cheat').style.display = 'none'; document.getElementById('tab-content-stats').style.display = 'none'; document.getElementById('tab-btn-' + tabName).classList.add('active'); document.getElementById('tab-content-' + tabName).style.display = 'block'; }

export function showEquipmentMenu() { document.getElementById('main-menu').style.display = 'none'; document.getElementById('equipment-select').style.display = 'flex'; updateEquipMenuUI(); }
export function updateEquipMenuUI() {
    document.getElementById('menu-crystal-count').innerText = totalCrystals;
    let dAmCont = document.getElementById('double-amulet-container');
    if (hasDoubleAmulet) { dAmCont.innerHTML = `<span style="color:var(--amber); font-weight:bold;">✦ Zaino del Vagabondo (2 Amuleti)!</span>`; } else { dAmCont.innerHTML = `<button class="equip-btn buy" style="background:rgba(180,100,0,0.3); color:var(--amber); border-color:rgba(255,170,0,0.5);" ${totalCrystals >= 3000 ? '' : 'disabled'} onclick="buyDoubleAmulet()">Compra Zaino (⬡ 3000) — Sblocca 2° Amuleto</button>`; }
    const container = document.getElementById('equip-container'); container.innerHTML = '';
    ['elmo', 'corazza', 'amuleto'].forEach(category => {
        let catTitle = document.createElement('h3'); catTitle.className = 'equip-category-title'; catTitle.innerText = category === 'elmo' ? '— ELMI —' : (category === 'corazza' ? '— CORAZZE —' : '— AMULETI —'); container.appendChild(catTitle);
        let row = document.createElement('div'); row.className = 'char-container';
        EQUIP_DB[category].forEach(item => {
            let isUnlocked = unlockedEquip.includes(item.id); 
            let isEquipped = equippedItems[category] === item.id || (category === 'amuleto' && (equippedItems.amuleto1 === item.id || equippedItems.amuleto2 === item.id));
            let card = document.createElement('div'); card.className = `char-card ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}`;
            let btnHtml = ''; if (isEquipped) { btnHtml = `<button class="equip-btn equipped" onclick="unequipItem('${category}', '${item.id}')">Rimuovi</button>`; } else if (isUnlocked) { btnHtml = `<button class="equip-btn equip" onclick="equipItem('${category}', '${item.id}')">Equipaggia</button>`; } else { let canAfford = totalCrystals >= item.price; btnHtml = `<button class="equip-btn buy" ${canAfford ? '' : 'disabled'} onclick="buyEquip('${item.id}', ${item.price})">Forgia ⬡ ${item.price}</button>`; }
            card.innerHTML = `<div style="font-size:40px; margin-bottom:10px;">${item.icon}</div><h3>${item.name}</h3><p style="color:rgba(230,200,150,0.5); font-size:12px;">${item.desc}</p>${btnHtml}`; row.appendChild(card);
        }); container.appendChild(row);
    });
}

export function showCharacterSelect() {
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('character-select').style.display = 'flex'; document.getElementById('char-crystal-count').innerText = totalCrystals;
    const container = document.getElementById('char-cards-container'); container.innerHTML = '';
    CHARACTERS.forEach(char => {
        let isUnlocked = false;
        if (cheatUnlocked) { 
            isUnlocked = true; 
        } else if (char.unlockType === 'boss30') { 
            isUnlocked = magoUnlocked; 
        } else { 
            isUnlocked = maxLevelReached >= char.reqLevel; 
        }

        let isSelected = selectedCharId === char.id;
        let cLevel = charLevels[char.id] || 1; let stars = "⭐".repeat(cLevel) + "☆".repeat(3-cLevel);
        let wList = [...char.weapons]; if (cLevel >= 2) wList.push(char.lv2Weapon); 
        let card = document.createElement('div'); card.className = `char-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
        let upgHtml = ''; if (isUnlocked && cLevel < 3) { upgHtml = `<button class="btn-level-up" ${totalCrystals < 1000 ? 'disabled' : ''} onclick="event.stopPropagation(); upgradeChar(${char.id})">Ascendi (1000 ⬡)</button>`; } else if (cLevel === 3) { upgHtml = `<p style="color:var(--amber); font-size:11px; margin-top:10px; font-family:'Cinzel Decorative',serif;">LEGGENDARIO<br>Può impugnare 3 armi!</p>`; }
        
        let lockMsg = '';
        if (!isUnlocked) {
            if (char.unlockType === 'boss30') { 
                lockMsg = `<div class="lock-icon">🧙<br><span style="font-size:12px;">Sconfiggi 30 Titani<br>(${gameStats.bossesKilled}/30)</span></div>`; 
            } else { 
                lockMsg = `<div class="lock-icon">🔒<br><span style="font-size:14px;">Raggiungi Liv. ${char.reqLevel}</span></div>`; 
            }
        }

        let wLabel = cLevel >= 2 ? 'Arsenale disponibile' : 'Armi base';
        let wItems = wList.map(w => `<span class="w-tag">${WEAPONS_DB[w].name}</span>`).join('');
        card.innerHTML = `<div class="char-header"><div class="char-name">${char.name}</div><div class="char-stars">${stars}</div></div><div class="char-weapons-block"><span class="weapons-label">${wLabel}</span><div class="weapons-tags">${wItems}</div></div>${upgHtml}${lockMsg}`;
        if (isUnlocked) { card.onclick = () => { window.changeSelectedCharId(char.id); showCharacterSelect(); }; } container.appendChild(card);
    });
}

export function showMenu() { updateBadges(); document.getElementById('main-menu').style.display = 'flex'; document.getElementById('character-select').style.display = 'none'; document.getElementById('game-over-screen').style.display = 'none'; document.getElementById('game-ui').style.display = 'none'; document.getElementById('equipment-select').style.display = 'none'; canvas.style.display = 'none'; document.getElementById('player-name-input').value = savedName; }
export function backToMenu() { showMenu(); }

export function updateBarsUI(player) { document.getElementById('hp-bar-fill').style.width = (Math.max(0, player.hp) / player.maxHp * 100) + '%'; if(player.maxShield > 0) { document.getElementById('shield-bar-fill').style.width = (Math.max(0, player.shield) / player.maxShield * 100) + '%'; } }
export function updateWeaponsUI(player) { const ui = document.getElementById('weapons-ui'); ui.innerHTML = ''; player.weapons.forEach(w => { ui.innerHTML += `<div class="weapon-slot" style="color:${w.color}">${w.name} <span class="weapon-lvl">Lv.${w.level}</span></div>`; }); }
export function showItemFeedback(text, color) { let el = document.createElement('div'); el.className = 'item-feedback'; el.innerHTML = text; el.style.color = color; el.style.left = (canvas.width/2 - 150) + 'px'; el.style.top = (canvas.height/2 - 80) + 'px'; el.style.width = "300px"; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); }

// Rende i pulsanti della UI cliccabili dall'HTML
window.showBattlePassModal = showBattlePassModal;
window.closeBattlePassModal = closeBattlePassModal;
window.showMissionsModal = showMissionsModal;
window.closeMissionsModal = closeMissionsModal;
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.switchSettingsTab = switchSettingsTab;
window.showEquipmentMenu = showEquipmentMenu;
window.updateEquipMenuUI = updateEquipMenuUI;
window.showCharacterSelect = showCharacterSelect;
window.showMenu = showMenu;
window.backToMenu = backToMenu;
