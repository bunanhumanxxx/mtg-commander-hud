import { generateId } from '../utils.js';

export class TokenModal {
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

        const content = document.createElement('div');
        content.style.cssText = `
            background: rgba(10, 10, 20, 0.95); 
            border: 1px solid var(--neon-blue); 
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); 
            backdrop-filter: blur(10px); 
            padding: 2rem; 
            border-radius: 8px; 
            width: 90%; 
            max-width: 500px;
            display: flex; 
            flex-direction: column; 
            gap: 1rem; 
            color: white;
        `;

        content.innerHTML = `
            <h3 style="margin: 0; text-align: center; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px;">CREATE TOKEN</h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: bold; color: var(--neon-blue); font-size: 0.9rem; text-transform: uppercase;">Target</label>
                <select id="token-scope" class="hud-select" style="width: 100%;">
                    <option value="self">Self</option>
                    <option value="others">Others</option>
                    <option value="all">All Players</option>
                </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: bold; color: var(--neon-blue); font-size: 0.9rem; text-transform: uppercase;">Name</label>
                <input type="text" id="token-name" value="Token" style="width: 100%; padding: 0.5rem; box-sizing: border-box; background: #222; color: white; border: 1px solid #555; border-radius: 4px;">
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: center;">
                <label style="font-weight: bold; color: var(--neon-blue); font-size: 0.9rem; text-transform: uppercase; min-width: 60px;">Color</label>
                <select id="token-color" class="hud-select" style="flex-grow: 1;">
                    <option value="W">White</option>
                    <option value="U">Blue</option>
                    <option value="B">Black</option>
                    <option value="R">Red</option>
                    <option value="G">Green</option>
                    <option value="C" selected>Colorless</option>
                    <option value="M">Multi</option>
                </select>
            </div>

            <fieldset style="border: 1px solid #444; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 4px;">
                <legend style="color: var(--neon-blue); font-weight: bold; padding: 0 0.5rem; text-transform: uppercase; font-size: 0.9rem;">Type</legend>
                <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                    <label class="hud-checkbox-container">
                        <input type="checkbox" value="Creature" checked> 
                        <span class="hud-checkbox-mark"></span>
                        Creature
                    </label>
                    <label class="hud-checkbox-container">
                        <input type="checkbox" value="Artifact"> 
                        <span class="hud-checkbox-mark"></span>
                        Artifact
                    </label>
                    <label class="hud-checkbox-container">
                        <input type="checkbox" value="Enchantment"> 
                        <span class="hud-checkbox-mark"></span>
                        Enchantment
                    </label>
                    <label class="hud-checkbox-container">
                        <input type="checkbox" value="Land"> 
                        <span class="hud-checkbox-mark"></span>
                        Land
                    </label>
                    <label class="hud-checkbox-container">
                        <input type="checkbox" value="Planeswalker"> 
                        <span class="hud-checkbox-mark"></span>
                        Planeswalker
                    </label>
                </div>
            </fieldset>

            <div id="stats-container" style="display: flex; gap: 1rem; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label style="color: var(--neon-blue); font-weight: bold; font-size: 0.9rem; text-transform: uppercase;">Power</label>
                    <input type="number" id="token-power" value="1" style="width: 60px; padding: 0.5rem; background: #222; color: white; border: 1px solid #555; border-radius: 4px; text-align: center;">
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label style="color: var(--neon-blue); font-weight: bold; font-size: 0.9rem; text-transform: uppercase;">Toughness</label>
                    <input type="number" id="token-toughness" value="1" style="width: 60px; padding: 0.5rem; background: #222; color: white; border: 1px solid #555; border-radius: 4px; text-align: center;">
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: bold; color: var(--neon-blue); font-size: 0.9rem; text-transform: uppercase;">Count</label>
                <input type="number" id="token-count" value="1" min="1" max="10" style="width: 80px; padding: 0.5rem; background: #222; color: white; border: 1px solid #555; border-radius: 4px;">
            </div>

            <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1rem;">
                <button id="btn-create" class="hud-btn-primary" style="padding: 0.6rem 2rem; font-size: 1rem;">CREATE</button>
                <button id="btn-cancel" style="
                    padding: 0.6rem 2rem; 
                    background: transparent; 
                    color: #888; 
                    border: 1px solid #555; 
                    cursor: pointer; 
                    border-radius: 4px;
                    text-transform: uppercase;
                    transition: all 0.2s;
                " onmouseover="this.style.borderColor='#888'; this.style.color='#aaa';" onmouseout="this.style.borderColor='#555'; this.style.color='#888';">CANCEL</button>
            </div>
        `;

        // Logic to show/hide stats based on Creature checkbox
        const checkboxes = content.querySelectorAll('input[type="checkbox"]');
        const statsContainer = content.querySelector('#stats-container');

        const updateStatsVisibility = () => {
            const isCreature = content.querySelector('input[value="Creature"]').checked;
            statsContainer.style.display = isCreature ? 'flex' : 'none';
        };

        checkboxes.forEach(cb => cb.addEventListener('change', updateStatsVisibility));
        updateStatsVisibility(); // Init state

        // Handlers
        content.querySelector('#btn-cancel').onclick = () => this.close();
        content.querySelector('#btn-create').onclick = () => {
            const scope = content.querySelector('#token-scope').value;
            const name = content.querySelector('#token-name').value || 'Token';
            const color = content.querySelector('#token-color').value;
            const types = Array.from(content.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            const count = parseInt(content.querySelector('#token-count').value, 10) || 1;

            let power = '', toughness = '';
            if (types.includes('Creature')) {
                power = content.querySelector('#token-power').value;
                toughness = content.querySelector('#token-toughness').value;
            }

            const tokenData = {
                name,
                color, // Can be used for background color logic later
                type_line: `Token ${types.join(' ')}`,
                power,
                toughness,
                count
            };

            const state = this.store.getState();
            let targetPlayers = [];
            if (scope === 'self') targetPlayers = [state.players.find(p => p.id === this.playerId)];
            else if (scope === 'others') targetPlayers = state.players.filter(p => p.id !== this.playerId);
            else targetPlayers = state.players;

            targetPlayers.forEach(p => {
                this.store.dispatch('ADD_TOKEN', { playerId: p.id, tokenData });
            });

            this.close();
        };

        this.element.onclick = (e) => {
            if (e.target === this.element) this.close();
        };

        this.element.appendChild(content);
        return this.element;
    }

    close() {
        if (this.element) this.element.remove();
    }
}
