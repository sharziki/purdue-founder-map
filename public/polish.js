// Pointer light adapted from Kokonut UI SpotlightCards (MIT); see docs/design/ASSET-LEDGER.md.
document.querySelectorAll('.start-options a').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--spot-x',`${e.clientX-r.left}px`);card.style.setProperty('--spot-y',`${e.clientY-r.top}px`)}));
