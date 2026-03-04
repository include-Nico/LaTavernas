// Questo file fa da ponte tra i moduli ES e l'HTML
// Va caricato DOPO main.js

window.addEventListener('moduleLoaded', () => {
    // Tutte le funzioni sono già esposte in main.js e ui.js
    // tramite window.xxx = xxx, questo file assicura
    // che vengano richiamate solo dopo il caricamento
});
