// --- SALVATAGGI E MEMORIA (localStorage) ---
let maxLevelReached = parseInt(localStorage.getItem('survivorMaxLevel')) || 1;
let cheatUnlocked = localStorage.getItem('survivorCheat') === 'true'; 
let totalCrystals = parseInt(localStorage.getItem('survivorCrystals')) || 0;
let unlockedEquip = JSON.parse(localStorage.getItem('survivorUnlockedEquip')) || [];
let equippedItems = JSON.parse(localStorage.getItem('survivorEquipped')) || { elmo: null, corazza: null, amuleto1: null, amuleto2: null };
let hasDoubleAmulet = localStorage.getItem('survivorDoubleAmulet') === 'true';
let charLevels = JSON.parse(localStorage.getItem('survivorCharLevels')) || { 0:1, 1:1, 2:1 };

let gameStats = JSON.parse(localStorage.getItem('survivorGameStats')) || { enemiesKilled: 0, bossesKilled: 0, maxLevelReached: 1, crystalsSpent: 0 };
maxLevelReached = Math.max(maxLevelReached, gameStats.maxLevelReached);

let todayStr = new Date().toDateString();
let dailyMissions = JSON.parse(localStorage.getItem('survivorDaily')) || { date: '', bossesKilled: 0, levelsGained: 0, itemsBought: 0, claim1: false, claim2: false, claim3: false };
if (dailyMissions.date !== todayStr) {
    dailyMissions = { date: todayStr, bossesKilled: 0, levelsGained: 0, itemsBought: 0, claim1: false, claim2: false, claim3: false };
    localStorage.setItem('survivorDaily', JSON.stringify(dailyMissions));
}

let selectedCharId = 0; 
let savedName = localStorage.getItem('survivorPlayerName') || ""; 
let activePlayerName = "Eroe";

// --- VARIABILI GLOBALI DI GIOCO ---
let gameState = "MENU"; 
let paused = false; 
let frameCount = 0;
let xp = 0; let xpNeeded = 15; let level = 1; 
let currentChoices = []; let pendingWeapon = null; let sessionCrystals = 0;

let player = {};
let enemies = []; let bullets = []; let beams = []; let explosions = []; 
let elementalTrails = []; let enemyBullets = []; let gems = []; let rocks = []; let chests = [];

let bossArena = { active: false, x: 0, y: 0, radius: 800 };
let rockTelegraphs = [];

let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
let controlMode = isTouchDevice ? 'mobile' : 'pc';

let joyX = 0, joyY = 0; let isDraggingJoy = false; let joyStartX = 0, joyStartY = 0; const maxJoyDist = 55; 
let keys = {};

// --- ASSET ---
let chestImg = new Image(); chestImg.src = 'chest.png';
let chestEpicImg = new Image(); chestEpicImg.src = 'chestepic.png';

// --- DATABASE ARMI E MODELLI ---
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
