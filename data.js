// ==========================================
// file: data.js
// ==========================================

export const WEAPON_MODELS = {
    // Spada corta - lama dorata
    pistola: (ctx, s, c) => {
        ctx.fillStyle = "#e8d080";
        ctx.beginPath();
        ctx.moveTo(s*1.8, 0); ctx.lineTo(s*0.2, -s*0.22); ctx.lineTo(-s*0.2, 0); ctx.lineTo(s*0.2, s*0.22);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fffacc";
        ctx.beginPath();
        ctx.moveTo(s*1.8, 0); ctx.lineTo(s*0.6, -s*0.1); ctx.lineTo(s*0.4, 0); ctx.lineTo(s*0.6, s*0.1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#b8860b"; ctx.fillRect(-s*0.15, -s*0.45, s*0.35, s*0.9);
        ctx.fillStyle = "#8b1a1a"; ctx.fillRect(-s*0.55, -s*0.2, s*0.4, s*0.4);
        ctx.fillStyle = "#ffd700";
        ctx.beginPath(); ctx.arc(-s*0.55, 0, s*0.22, 0, Math.PI*2); ctx.fill();
    },
    // Lancia - asta legno con punta dorata
    fucile: (ctx, s, c) => {
        ctx.fillStyle = "#5c3a1e"; ctx.fillRect(-s*0.6, -s*0.12, s*2.2, s*0.24);
        ctx.fillStyle = "#e8d080";
        ctx.beginPath();
        ctx.moveTo(s*1.6, 0); ctx.lineTo(s*0.9, -s*0.28); ctx.lineTo(s*0.75, 0); ctx.lineTo(s*0.9, s*0.28);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fffacc";
        ctx.beginPath();
        ctx.moveTo(s*1.6, 0); ctx.lineTo(s*1.1, -s*0.1); ctx.lineTo(s*0.95, 0); ctx.lineTo(s*1.1, s*0.1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#b8860b"; ctx.fillRect(s*0.7, -s*0.18, s*0.14, s*0.36);
        ctx.fillStyle = "#cc2233"; ctx.fillRect(-s*0.1, -s*0.14, s*0.18, s*0.28);
    },
    // Bastone magico - gemma cremisi
    bastone: (ctx, s, c) => {
        ctx.fillStyle = "#3d2b1a"; ctx.fillRect(-s*0.9, -s*0.14, s*3.2, s*0.28);
        ctx.fillStyle = "#b8860b";
        ctx.fillRect(-s*0.1, -s*0.2, s*0.18, s*0.4);
        ctx.fillRect(s*0.8, -s*0.2, s*0.18, s*0.4);
        ctx.fillStyle = "#ffd700";
        ctx.beginPath(); ctx.arc(s*2.1, 0, s*0.58, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#cc2233"; ctx.shadowBlur = 12; ctx.shadowColor = "#ff4455";
        ctx.beginPath(); ctx.arc(s*2.1, 0, s*0.36, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ff8899"; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(s*1.95, -s*0.12, s*0.1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#b8860b"; ctx.fillRect(-s*0.9, -s*0.2, s*0.22, s*0.4);
    },
    // Arco con corda dorata e freccia
    laser: (ctx, s, c) => {
        ctx.strokeStyle = "#5c3a1e"; ctx.lineWidth = s*0.28;
        ctx.beginPath(); ctx.arc(s*0.8, 0, s*0.9, -Math.PI*0.55, Math.PI*0.55); ctx.stroke();
        ctx.strokeStyle = "#7a4f2a"; ctx.lineWidth = s*0.12;
        ctx.beginPath(); ctx.arc(s*0.8, 0, s*0.9, -Math.PI*0.55, Math.PI*0.55); ctx.stroke();
        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s*0.8 + s*0.9*Math.cos(-Math.PI*0.55), s*0.9*Math.sin(-Math.PI*0.55));
        ctx.lineTo(s*0.8 + s*0.9*Math.cos(Math.PI*0.55), s*0.9*Math.sin(Math.PI*0.55));
        ctx.stroke();
        ctx.fillStyle = "#b8860b"; ctx.fillRect(s*0.3, -s*0.06, s*1.0, s*0.12);
        ctx.fillStyle = "#e8d080";
        ctx.beginPath(); ctx.moveTo(s*1.3, 0); ctx.lineTo(s*1.0, -s*0.18); ctx.lineTo(s*1.0, s*0.18); ctx.closePath(); ctx.fill();
    },
    // Bomba con croce ornamentale
    granata: (ctx, s, c) => {
        ctx.fillStyle = "#1a1208";
        ctx.beginPath(); ctx.arc(s*0.5, 0, s*0.85, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#b8860b"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s*0.5, 0, s*0.85, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = "#b8860b";
        ctx.fillRect(s*0.38, -s*0.85, s*0.24, s*1.7);
        ctx.fillRect(-s*0.35, -s*0.12, s*1.7, s*0.24);
        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(s*0.5, -s*0.85); ctx.bezierCurveTo(s*0.5, -s*1.4, s*1.0, -s*1.4, s*1.1, -s*1.0); ctx.stroke();
        ctx.fillStyle = "#ffaa00"; ctx.shadowBlur = 8; ctx.shadowColor = "#ffaa00";
        ctx.beginPath(); ctx.arc(s*1.1, -s*1.0, s*0.18, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    },
    // Balestra in legno e metallo
    razzo: (ctx, s, c) => {
        ctx.fillStyle = "#3d2b1a"; ctx.fillRect(-s*0.5, -s*0.22, s*2.0, s*0.44);
        ctx.fillStyle = "#b8860b"; ctx.fillRect(s*0.1, s*0.22, s*0.2, s*0.5);
        ctx.strokeStyle = "#5c3a1e"; ctx.lineWidth = s*0.2;
        ctx.beginPath(); ctx.moveTo(s*0.6, -s*0.22); ctx.lineTo(s*0.3, -s*0.75); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.6, s*0.22); ctx.lineTo(s*0.3, s*0.75); ctx.stroke();
        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s*0.3, -s*0.75); ctx.lineTo(s*0.3, s*0.75); ctx.stroke();
        ctx.fillStyle = "#e8d080"; ctx.fillRect(s*0.3, -s*0.08, s*1.3, s*0.16);
        ctx.beginPath(); ctx.moveTo(s*1.6, 0); ctx.lineTo(s*1.2, -s*0.2); ctx.lineTo(s*1.2, s*0.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#b8860b"; ctx.fillRect(s*0.5, -s*0.25, s*0.16, s*0.5);
    },
    // Asta del gelo con cristallo
    freezer: (ctx, s, c) => {
        ctx.fillStyle = "#ddeeff"; ctx.fillRect(-s*0.5, -s*0.12, s*2.0, s*0.24);
        ctx.fillStyle = "#aaccee"; ctx.fillRect(-s*0.5, -s*0.06, s*2.0, s*0.12);
        ctx.fillStyle = "#88ccff"; ctx.shadowBlur = 14; ctx.shadowColor = "#aaddff";
        ctx.beginPath(); ctx.moveTo(-s*0.5, 0); ctx.lineTo(-s*0.1, -s*0.6); ctx.lineTo(s*0.2, 0); ctx.lineTo(-s*0.1, s*0.6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#eef8ff"; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(-s*0.35, -s*0.1); ctx.lineTo(-s*0.22, -s*0.38); ctx.lineTo(-s*0.12, -s*0.1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(s*0.5, -s*0.18); ctx.lineTo(s*0.5, s*0.18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.8, -s*0.18); ctx.lineTo(s*0.8, s*0.18); ctx.stroke();
    },
    // Bastone veleno con gemma verde
    bastone_veleno: (ctx, s, c) => {
        ctx.fillStyle = "#1a2a10"; ctx.fillRect(-s*0.9, -s*0.14, s*3.2, s*0.28);
        ctx.fillStyle = "#2d5a1a";
        ctx.fillRect(-s*0.1, -s*0.2, s*0.18, s*0.4);
        ctx.fillRect(s*0.8, -s*0.2, s*0.18, s*0.4);
        ctx.fillStyle = "#3a6020";
        ctx.beginPath(); ctx.arc(s*2.1, 0, s*0.58, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#44cc22"; ctx.shadowBlur = 12; ctx.shadowColor = "#66ff33";
        ctx.beginPath(); ctx.arc(s*2.1, 0, s*0.36, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#aaff88"; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(s*1.95, -s*0.12, s*0.1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#2d5a1a"; ctx.fillRect(-s*0.9, -s*0.2, s*0.22, s*0.4);
    },
    // Doppio stiletto dorato
    uzi: (ctx, s, c) => {
        ctx.fillStyle = "#c8b840";
        ctx.beginPath(); ctx.moveTo(s*1.4, -s*0.3); ctx.lineTo(s*0.1, -s*0.5); ctx.lineTo(-s*0.1, -s*0.3); ctx.lineTo(s*0.1, -s*0.12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fffacc";
        ctx.beginPath(); ctx.moveTo(s*1.4, -s*0.3); ctx.lineTo(s*0.5, -s*0.38); ctx.lineTo(s*0.4, -s*0.3); ctx.lineTo(s*0.5, -s*0.22); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#8b1a1a"; ctx.fillRect(-s*0.2, -s*0.52, s*0.3, s*0.46);
        ctx.fillStyle = "#c8b840";
        ctx.beginPath(); ctx.moveTo(s*1.4, s*0.3); ctx.lineTo(s*0.1, s*0.5); ctx.lineTo(-s*0.1, s*0.3); ctx.lineTo(s*0.1, s*0.12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fffacc";
        ctx.beginPath(); ctx.moveTo(s*1.4, s*0.3); ctx.lineTo(s*0.5, s*0.38); ctx.lineTo(s*0.4, s*0.3); ctx.lineTo(s*0.5, s*0.22); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#8b1a1a"; ctx.fillRect(-s*0.2, s*0.06, s*0.3, s*0.46);
    },
    // Flauto ornamentale d'oro
    cerbottana: (ctx, s, c) => {
        ctx.fillStyle = "#b8860b"; ctx.fillRect(-s*0.5, -s*0.16, s*2.3, s*0.32);
        ctx.fillStyle = "#ffd700"; ctx.fillRect(-s*0.5, -s*0.1, s*2.3, s*0.08);
        ctx.fillStyle = "#5c3000";
        for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.arc(s*(0.1 + i*0.45), s*0.06, s*0.08, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = "#ffd700"; ctx.fillRect(-s*0.55, -s*0.2, s*0.18, s*0.4);
        ctx.fillStyle = "#e8d080";
        ctx.beginPath(); ctx.moveTo(s*1.8, 0); ctx.lineTo(s*1.55, -s*0.22); ctx.lineTo(s*1.55, s*0.22); ctx.closePath(); ctx.fill();
    },
    // Sfera di fuoco sacra
    fireball_wand: (ctx, s, c) => {
        ctx.fillStyle = "#5c3a1e"; ctx.fillRect(-s*0.4, -s*0.1, s*1.4, s*0.2);
        ctx.fillStyle = "#b8860b"; ctx.fillRect(-s*0.4, -s*0.14, s*0.18, s*0.28);
        ctx.fillStyle = "#cc2233"; ctx.shadowBlur = 18; ctx.shadowColor = "#ff4455";
        ctx.beginPath(); ctx.arc(s*1.2, 0, s*0.72, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ff6600"; ctx.shadowBlur = 12; ctx.shadowColor = "#ffaa00";
        ctx.beginPath(); ctx.arc(s*1.2, 0, s*0.48, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffd700"; ctx.shadowBlur = 8; ctx.shadowColor = "#ffffaa";
        ctx.beginPath(); ctx.arc(s*1.2, 0, s*0.24, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,200,0.6)";
        ctx.beginPath(); ctx.arc(s*1.05, -s*0.2, s*0.1, 0, Math.PI*2); ctx.fill();
    },
    // Sfera arcana oro
    electric_orb: (ctx, s, c) => {
        ctx.fillStyle = "#dde8ee"; ctx.fillRect(-s*0.4, -s*0.1, s*1.4, s*0.2);
        ctx.fillStyle = "#aabbcc"; ctx.fillRect(-s*0.4, -s*0.14, s*0.18, s*0.28);
        let grad = ctx.createRadialGradient(s*1.2, 0, 0, s*1.2, 0, s*0.72);
        grad.addColorStop(0, "#ffffee"); grad.addColorStop(0.4, "#ffd700"); grad.addColorStop(1, "#b8860b");
        ctx.fillStyle = grad; ctx.shadowBlur = 16; ctx.shadowColor = "#ffd700";
        ctx.beginPath(); ctx.arc(s*1.2, 0, s*0.72, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.shadowBlur = 8; ctx.shadowColor = "#ffffff";
        ctx.beginPath(); ctx.arc(s*1.2, 0, s*0.3, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,215,0,0.5)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(s*1.2, 0, s*0.72, s*0.3, Math.PI*0.3, 0, Math.PI*2); ctx.stroke();
    },
    // Scudo rotondo con stemma
    mirror_orb: (ctx, s, c) => {
        ctx.fillStyle = "#b8860b";
        ctx.beginPath(); ctx.arc(s*1.0, 0, s*0.85, 0, Math.PI*2); ctx.fill();
        let grad = ctx.createRadialGradient(s*0.85, -s*0.25, s*0.1, s*1.0, 0, s*0.72);
        grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.3, "#ddeeff"); grad.addColorStop(1, "#8899aa");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(s*1.0, 0, s*0.72, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#cc2233";
        ctx.fillRect(s*0.88, -s*0.68, s*0.24, s*1.36);
        ctx.fillRect(s*0.32, -s*0.12, s*1.36, s*0.24);
        ctx.fillStyle = "#ffd700";
        ctx.beginPath(); ctx.arc(s*1.0, 0, s*0.22, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath(); ctx.arc(s*0.78, -s*0.3, s*0.2, 0, Math.PI*2); ctx.fill();
    }
};

export const WEAPONS_DB = {
    pistola: { id: 'pistola', name: "Pistola", baseDamage: 12, fireRate: 45, range: 600, speed: 12, weaponSize: 15, bulletSize: 5, color: "silver", muzzleOffset: 25 },
    fucile:  { id: 'fucile',  name: "Fucile",  baseDamage: 8,  fireRate: 15, range: 800, speed: 20, weaponSize: 22, bulletSize: 3, color: "white", muzzleOffset: 45 },
    bastone: { id: 'bastone', name: "Bastone", baseDamage: 30, fireRate: 80, range: 1200, speed: 7, weaponSize: 20, bulletSize: 15, color: "#ff4500", muzzleOffset: 65 }, 
    laser:   { id: 'laser',   name: "Blaster", baseDamage: 18, fireRate: 40, range: 1500, speed: 0, weaponSize: 20, bulletSize: 4, color: "lime", muzzleOffset: 35 }, 
    granata: { id: 'granata', name: "Granate", baseDamage: 50, fireRate: 90, range: 400, speed: 8,  weaponSize: 16, bulletSize: 10, color: "#888", muzzleOffset: 15 },
    razzo:   { id: 'razzo',   name: "Razzo",   baseDamage: 60, fireRate: 100,range: 1000,speed: 10, weaponSize: 25, bulletSize: 14, color: "orange", muzzleOffset: 55 },
    freezer: { id: 'freezer', name: "Freezer", baseDamage: 20, fireRate: 35, range: 600, speed: 15, weaponSize: 20, bulletSize: 10, color: "#aaddff", muzzleOffset: 25 },
    bastone_veleno: { id: 'bastone_veleno', name: "Bastone Velenoso", baseDamage: 15, fireRate: 120, range: 150, speed: 0, weaponSize: 20, bulletSize: 0, color: "#00ff00", muzzleOffset: 0 }, 
    uzi: { id: 'uzi', name: "Uzi", baseDamage: 5, fireRate: 8, range: 500, speed: 18, weaponSize: 12, bulletSize: 3, color: "yellow", muzzleOffset: 15 },
    cerbottana: { id: 'cerbottana', name: "Cerbottana", baseDamage: 2, fireRate: 20, range: 700, speed: 22, weaponSize: 20, bulletSize: 4, color: "#800080", muzzleOffset: 30, poisonDamage: 5 },
    fireball_wand: { id: 'fireball_wand', name: "Palla di Fuoco", baseDamage: 35, fireRate: 70, range: 700, speed: 9, weaponSize: 18, bulletSize: 14, color: "#ff4400", muzzleOffset: 30, explodeRadius: 80 },
    electric_orb: { id: 'electric_orb', name: "Sfera Elettrica", baseDamage: 20, fireRate: 55, range: 650, speed: 11, weaponSize: 18, bulletSize: 12, color: "#00ccff", muzzleOffset: 30, chainMax: 4, chainRange: 150, chainDamage: 10 },
    mirror_orb: { id: 'mirror_orb', name: "Sfera Specchio", baseDamage: 10, fireRate: 150, range: 300, speed: 0, weaponSize: 18, bulletSize: 0, color: "#e0ffff", muzzleOffset: 0, decoyHp: 100 }
};

export const CHARACTERS = [ 
    { id: 0, name: "Recluta",  desc: "Corpo Quadrato",              reqLevel: 1,  weapons: ['pistola', 'fucile', 'bastone'],            lv2Weapon: 'bastone_veleno', unlockType: 'level' }, 
    { id: 1, name: "Punta",    desc: "Corpo Piramidale",            reqLevel: 10, weapons: ['pistola', 'razzo', 'freezer'],              lv2Weapon: 'cerbottana',     unlockType: 'level' }, 
    { id: 2, name: "Gelataio", desc: "Corpo a Cono",                reqLevel: 15, weapons: ['pistola', 'laser', 'granata'],              lv2Weapon: 'uzi',            unlockType: 'level' }, 
    { id: 3, name: "Il Mago",  desc: "Corpo Quadrato con Cappello", reqLevel: 999,weapons: ['uzi', 'fireball_wand', 'electric_orb'], lv2Weapon: 'mirror_orb',      unlockType: 'boss30' } 
];

export const EQUIP_DB = {
    elmo: [ { id: 'elmo_1', name: 'Elmo Comune', desc: '15% Schivata Proiettili', price: 100, value: 0.15, icon: '🪖' }, { id: 'elmo_2', name: 'Elmo Raro', desc: '30% Schivata Proiettili', price: 300, value: 0.30, icon: '🪖' }, { id: 'elmo_3', name: 'Elmo Epico', desc: '50% Schivata Proiettili', price: 600, value: 0.50, icon: '👑' } ],
    corazza: [ { id: 'cor_1', name: 'Corazza Comune', desc: '15% Schivata Mischia', price: 100, value: 0.15, icon: '👕' }, { id: 'cor_2', name: 'Corazza Rara', desc: '30% Schivata Mischia', price: 300, value: 0.30, icon: '🦺' }, { id: 'cor_3', name: 'Corazza Epica', desc: '50% Schivata Mischia', price: 600, value: 0.50, icon: '🛡️' } ],
    amuleto: [ { id: 'amu_ice', name: 'Amuleto Ghiaccio', desc: 'Scia congelante (3s)', price: 1000, icon: '❄️' }, { id: 'amu_fire', name: 'Amuleto Fuoco', desc: 'Scia incendiaria (3s)', price: 1000, icon: '🔥' }, { id: 'amu_revive', name: 'Amuleto Fenice', desc: 'Rinasci 1 volta (50% HP)', price: 2000, icon: '❤️‍🔥' } ]
};
