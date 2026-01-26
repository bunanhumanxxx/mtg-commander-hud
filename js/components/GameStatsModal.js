export class GameStatsModal {
    constructor(store) {
        this.store = store;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9000;
        `;

        const state = this.store.getState();
        const players = state.players;
        const zones = state.zones;

        // --- Calculation Logic ---

        const stats = players.map(p => {
            const pZone = zones[p.id];
            const cards = pZone ? pZone.battlefield : [];

            // Counts
            const counts = {
                creature: 0,
                artifact: 0,
                enchantment: 0,
                land: 0,
                planeswalker: 0
            };

            // Extremes - Arrays for ties
            let maxPower = -1;
            let maxPowerCards = [];

            let maxCmc = -1;
            let maxCmcCards = [];

            let minCmc = 999;
            let minCmcCards = [];

            cards.forEach(c => {
                const typeLine = (c.type_line || '').toLowerCase();
                const power = c.power; // string or number
                const cmc = c.cmc !== undefined ? c.cmc : 0; // Assuming cmc exists

                // Type Counting
                if (typeLine.includes('creature') || typeLine.includes('クリーチャー')) counts.creature++;
                if (typeLine.includes('artifact') || typeLine.includes('アーティファクト')) counts.artifact++;
                if (typeLine.includes('enchantment') || typeLine.includes('エンチャント')) counts.enchantment++;
                if (typeLine.includes('land') || typeLine.includes('土地')) counts.land++;
                if (typeLine.includes('planeswalker') || typeLine.includes('プレインズウォーカー')) counts.planeswalker++;

                // Creature Stats
                if (typeLine.includes('creature') || typeLine.includes('クリーチャー')) {
                    // Power
                    let pVal = -1;
                    if (power !== undefined && power !== '*') {
                        pVal = parseInt(power);
                        if (isNaN(pVal)) pVal = 0;
                    }
                    if (pVal > maxPower) {
                        maxPower = pVal;
                        maxPowerCards = [c];
                    } else if (pVal === maxPower && pVal !== -1) {
                        maxPowerCards.push(c);
                    }

                    // Cost (CMC)
                    if (cmc > maxCmc) {
                        maxCmc = cmc;
                        maxCmcCards = [c];
                    } else if (cmc === maxCmc && cmc !== -1) {
                        maxCmcCards.push(c);
                    }

                    if (cmc < minCmc) {
                        minCmc = cmc;
                        minCmcCards = [c];
                    } else if (cmc === minCmc) {
                        minCmcCards.push(c);
                    }
                }
            });

            if (minCmc === 999) minCmc = -1; // Reset if no creatures

            return {
                id: p.id,
                name: p.name,
                counts,
                maxPower: { val: maxPower, cards: maxPowerCards },
                maxCmc: { val: maxCmc, cards: maxCmcCards },
                minCmc: { val: minCmc, cards: minCmcCards }
            };
        });

        // Global Extremes
        let globalMaxPower = { val: -1, cards: [] };
        let globalMaxCmc = { val: -1, cards: [] };
        let globalMinCmc = { val: 999, cards: [] };

        // Global Counts
        const globalCounts = {
            creature: 0,
            artifact: 0,
            enchantment: 0,
            land: 0,
            planeswalker: 0
        };

        stats.forEach(s => {
            globalCounts.creature += s.counts.creature;
            globalCounts.artifact += s.counts.artifact;
            globalCounts.enchantment += s.counts.enchantment;
            globalCounts.land += s.counts.land;
            globalCounts.planeswalker += s.counts.planeswalker;

            // Global Max Power
            if (s.maxPower.val > globalMaxPower.val) {
                globalMaxPower = {
                    val: s.maxPower.val,
                    cards: s.maxPower.cards.map(c => ({ ...c, _ownerName: s.name }))
                };
            } else if (s.maxPower.val === globalMaxPower.val && s.maxPower.val !== -1) {
                globalMaxPower.cards.push(...s.maxPower.cards.map(c => ({ ...c, _ownerName: s.name })));
            }

            // Global Max CMC
            if (s.maxCmc.val > globalMaxCmc.val) {
                globalMaxCmc = {
                    val: s.maxCmc.val,
                    cards: s.maxCmc.cards.map(c => ({ ...c, _ownerName: s.name }))
                };
            } else if (s.maxCmc.val === globalMaxCmc.val && s.maxCmc.val !== -1) {
                globalMaxCmc.cards.push(...s.maxCmc.cards.map(c => ({ ...c, _ownerName: s.name })));
            }

            // Global Min CMC
            if (s.minCmc.val !== -1) { // Only check if valid
                if (s.minCmc.val < globalMinCmc.val) {
                    globalMinCmc = {
                        val: s.minCmc.val,
                        cards: s.minCmc.cards.map(c => ({ ...c, _ownerName: s.name }))
                    };
                } else if (s.minCmc.val === globalMinCmc.val) {
                    globalMinCmc.cards.push(...s.minCmc.cards.map(c => ({ ...c, _ownerName: s.name })));
                }
            }
        });
        if (globalMinCmc.val === 999) globalMinCmc.val = -1;

        // --- Render HTML ---

        const formatCards = (data, isGlobal = false) => {
            if (!data.cards || data.cards.length === 0) return '-';

            // If too many, maybe limit? For now, render all.
            const list = data.cards.map(c => {
                let txt = c.name;
                if (isGlobal && c._ownerName) txt += ` [${c._ownerName}]`;
                return `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${txt}</div>`;
            }).join('');

            return `
                <div style="display: flex; flex-direction: column; gap: 2px; max-height: 100px; overflow-y: auto;">
                    ${list}
                    <div style="font-size: 0.8rem; color: #aaa; border-top: 1px dashed #444; margin-top: 2px;">Value: ${data.val}</div>
                </div>
             `;
        };

        const thStyle = "padding: 8px; text-align: left; border-bottom: 1px solid #555; font-size: 0.8rem; color: #aaa;";
        const tdStyle = "padding: 8px; border-bottom: 1px solid #444; font-size: 0.9rem; vertical-align: top;";

        let rows = stats.map(s => `
            <tr>
                <td style="${tdStyle} font-weight: bold;">${s.name}</td>
                <td style="${tdStyle}">${s.counts.creature}</td>
                <td style="${tdStyle}">${s.counts.artifact}</td>
                <td style="${tdStyle}">${s.counts.enchantment}</td>
                <td style="${tdStyle}">${s.counts.land}</td>
                <td style="${tdStyle}">${s.counts.planeswalker}</td>
                <td style="${tdStyle}">${formatCards(s.maxCmc)}</td>
                <td style="${tdStyle}">${formatCards(s.minCmc)}</td>
                <td style="${tdStyle}">${formatCards(s.maxPower)}</td>
            </tr>
        `).join('');

        // Total Row
        rows += `
             <tr style="background: #333;">
                <td style="${tdStyle} font-weight: bold;">TOTAL / GLOBAL</td>
                <td style="${tdStyle} font-weight: bold;">${globalCounts.creature}</td>
                <td style="${tdStyle} font-weight: bold;">${globalCounts.artifact}</td>
                <td style="${tdStyle} font-weight: bold;">${globalCounts.enchantment}</td>
                <td style="${tdStyle} font-weight: bold;">${globalCounts.land}</td>
                <td style="${tdStyle} font-weight: bold;">${globalCounts.planeswalker}</td>
                <td style="${tdStyle}">${formatCards(globalMaxCmc, true)}</td>
                <td style="${tdStyle}">${formatCards(globalMinCmc, true)}</td>
                <td style="${tdStyle}">${formatCards(globalMaxPower, true)}</td>
            </tr>
        `;

        this.element.innerHTML = `
            <div class="stats-modal-content" style="
                background: #050a14; 
                padding: 2rem; 
                border-radius: 8px; 
                width: 95%; 
                max-width: 1400px; 
                display: flex; 
                flex-direction: column; 
                gap: 1rem; 
                color: white; 
                border: 1px solid var(--neon-blue); 
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); 
                backdrop-filter: blur(10px); 
                max-height: 90vh; 
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px;">Game Statistics</h2>
                    <button class="close-btn" style="
                        padding: 0.5rem 1rem; 
                        background: transparent; 
                        border: 1px solid #666; 
                        color: #ccc; 
                        cursor: pointer; 
                        border-radius: 4px;
                    ">Close</button>
                </div>
                
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr>
                                <th style="${thStyle} width: 10%;">Player</th>
                                <th style="${thStyle}">Creature</th>
                                <th style="${thStyle}">Artifact</th>
                                <th style="${thStyle}">Enchantment</th>
                                <th style="${thStyle}">Land</th>
                                <th style="${thStyle}">PW</th>
                                <th style="${thStyle} width: 15%;">Max Cost (Cr)</th>
                                <th style="${thStyle} width: 15%;">Min Cost (Cr)</th>
                                <th style="${thStyle} width: 15%;">Max Power</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Close logic
        this.element.querySelector('.close-btn').onclick = () => this.close();
        this.element.onclick = (e) => {
            if (e.target === this.element) this.close();
        };

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
