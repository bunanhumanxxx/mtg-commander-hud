export class SelectFilterModal {
    constructor(store, playerId) {
        this.store = store;
        this.playerId = playerId;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9000;
        `;

        this.element.innerHTML = `
            <div class="filter-modal-content" style="
                background: #050a14; 
                border: 1px solid var(--neon-blue); 
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); 
                backdrop-filter: blur(10px); 
                color: white; 
                max-width: 400px; 
                width: 90%; 
                padding: 2rem; 
                border-radius: 8px; 
                display: flex; 
                flex-direction: column; 
                gap: 1.5rem;
            ">
                <h3 style="margin: 0; text-align: center; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px;">Advanced Selection</h3>
                
                <!-- Player Scope -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label style="font-weight: bold; color: var(--neon-blue);">Target Players</label>
                    <select id="filter-scope" style="padding: 0.5rem; background: #222; color: white; border: 1px solid #555; border-radius: 4px;">
                        <option value="self">自分 (Self)</option>
                        <option value="others">自分以外 (Others)</option>
                        <option value="all">全員 (All Players)</option>
                    </select>
                </div>

                <!-- Card Types -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label style="font-weight: bold; color: var(--neon-blue);">Card Types (OR)</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px; border: 1px solid #444;">
                        <label class="hud-checkbox-container">
                            <input type="checkbox" value="creature" checked> 
                            <span class="hud-checkbox-mark"></span>
                            Creature
                        </label>
                        <label class="hud-checkbox-container">
                            <input type="checkbox" value="artifact"> 
                            <span class="hud-checkbox-mark"></span>
                            Artifact
                        </label>
                        <label class="hud-checkbox-container">
                            <input type="checkbox" value="enchantment"> 
                            <span class="hud-checkbox-mark"></span>
                            Enchantment
                        </label>
                        <label class="hud-checkbox-container">
                            <input type="checkbox" value="planeswalker"> 
                            <span class="hud-checkbox-mark"></span>
                            Planeswalker
                        </label>
                        <label class="hud-checkbox-container">
                            <input type="checkbox" value="land"> 
                            <span class="hud-checkbox-mark"></span>
                            Land
                        </label>
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                    <button id="btn-apply" style="
                        flex: 2; 
                        padding: 0.8rem; 
                        background: rgba(0, 243, 255, 0.1); 
                        color: var(--neon-blue); 
                        border: 1px solid var(--neon-blue); 
                        cursor: pointer; 
                        border-radius: 4px; 
                        font-weight: bold;
                        text-transform: uppercase;
                        transition: all 0.2s;
                    ">SELECT</button>
                    <button id="btn-cancel" style="
                        flex: 1; 
                        padding: 0.8rem; 
                        background: transparent; 
                        color: #888; 
                        border: 1px solid #555; 
                        cursor: pointer; 
                        border-radius: 4px;
                    ">CANCEL</button>
                </div>
            </div>
        `;

        this.element.querySelector('#btn-apply').onclick = () => this.applyFilter();
        this.element.querySelector('#btn-cancel').onclick = () => this.close();
        this.element.onclick = (e) => {
            if (e.target === this.element) this.close();
        };

        return this.element;
    }

    applyFilter() {
        const scope = this.element.querySelector('#filter-scope').value;
        const typeCheckboxes = this.element.querySelectorAll('input[type="checkbox"]:checked');
        const types = Array.from(typeCheckboxes).map(cb => cb.value);

        if (types.length === 0) {
            alert('Please select at least one card type.');
            return;
        }

        const state = this.store.getState();
        const myId = this.playerId;

        let targetPlayers = [];
        if (scope === 'self') {
            targetPlayers = [state.players.find(p => p.id === myId)];
        } else if (scope === 'others') {
            targetPlayers = state.players.filter(p => p.id !== myId);
        } else {
            targetPlayers = state.players;
        }

        let matchedIds = [];

        targetPlayers.forEach(p => {
            const zone = state.zones[p.id];
            if (zone && zone.battlefield) {
                zone.battlefield.forEach(card => {
                    // Robust Type Check
                    const checkType = (card, typeKey) => {
                        const enKey = typeKey.toLowerCase();
                        const jaKeyMap = {
                            'creature': 'クリーチャー',
                            'artifact': 'アーティファクト',
                            'enchantment': 'エンチャント',
                            'planeswalker': 'プレインズウォーカー',
                            'land': '土地'
                        };
                        const jaKey = jaKeyMap[enKey];

                        // Helper to check a single string
                        const matchStr = (str) => {
                            if (!str) return false;
                            const s = str.toLowerCase();
                            return s.includes(enKey) || (jaKey && s.includes(jaKey));
                        };

                        // Check English (Original) and Display (JP/EN)
                        if (matchStr(card.original_type_line)) return true;
                        if (matchStr(card.type_line)) return true;
                        if (matchStr(card.printed_type_line)) return true;

                        // Check Faces (for DFCs or Split cards)
                        if (card.card_faces && Array.isArray(card.card_faces)) {
                            return card.card_faces.some(face =>
                                matchStr(face.type_line) || matchStr(face.printed_type_line)
                            );
                        }

                        return false;
                    };

                    const isMatch = types.some(t => checkType(card, t));

                    if (isMatch) {
                        matchedIds.push(card.instanceId);
                    }
                });
            }
        });

        // Toggle Selection Mode ON if not already
        // And Set Selected IDs
        this.store.dispatch('SELECT_MULTIPLE_CARDS', { cardIds: matchedIds });

        this.close();
    }

    close() {
        if (this.element) this.element.remove();
    }
}
