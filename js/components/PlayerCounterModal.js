export class PlayerCounterModal {
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
            max-width: 400px;
            display: flex; 
            flex-direction: column; 
            gap: 1rem; 
            color: white;
        `;

        content.innerHTML = `
            <h3 style="margin: 0; text-align: center; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px;">PLAYER COUNTER</h3>
            
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: bold; color: var(--neon-blue); font-size: 0.9rem; text-transform: uppercase;">Target</label>
                <select id="counter-scope" class="hud-select" style="width: 100%;">
                    <option value="self">Self</option>
                    <option value="others">Others</option>
                    <option value="all">All Players</option>
                </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: bold; color: var(--neon-blue); font-size: 0.9rem; text-transform: uppercase;">Counter Name</label>
                <input type="text" id="counter-name" placeholder="Poison" style="width: 100%; padding: 0.5rem; box-sizing: border-box; background: #222; color: white; border: 1px solid #555; border-radius: 4px;">
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: bold; color: var(--neon-blue); font-size: 0.9rem; text-transform: uppercase;">Amount</label>
                <input type="number" id="counter-amount" value="1" style="width: 80px; padding: 0.5rem; box-sizing: border-box; background: #222; color: white; border: 1px solid #555; border-radius: 4px;">
            </div>

            <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1rem;">
                <button id="btn-apply" class="hud-btn-primary" style="padding: 0.6rem 2rem; font-size: 1rem;">APPLY</button>
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

        // Handlers
        content.querySelector('#btn-cancel').onclick = () => this.close();
        content.querySelector('#btn-apply').onclick = () => {
            const scope = content.querySelector('#counter-scope').value;
            const counterName = content.querySelector('#counter-name').value || 'Counter';
            const count = parseInt(content.querySelector('#counter-amount').value, 10) || 0;

            if (count !== 0) {
                const state = this.store.getState();
                let targetPlayers = [];
                if (scope === 'self') targetPlayers = [state.players.find(p => p.id === this.playerId)];
                else if (scope === 'others') targetPlayers = state.players.filter(p => p.id !== this.playerId);
                else targetPlayers = state.players;

                targetPlayers.forEach(p => {
                    this.store.dispatch('UPDATE_PLAYER_COUNTER', { playerId: p.id, counterName, count });
                });
            }
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
