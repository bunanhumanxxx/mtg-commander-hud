export class CardStatusModal {
    constructor(store, playerId, cardId) {
        this.store = store;
        this.playerId = playerId;
        this.cardId = cardId;
        this.element = null;

        // Fetch current card data for display/init
        const zone = this.store.getState().zones[playerId];
        if (zone) {
            this.card = zone.battlefield.find(c => c.instanceId === cardId);
        }
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9000;
        `;

        if (!this.card) {
            this.element.innerHTML = '<div style="color:white;">Card not found</div>';
            this.element.onclick = () => this.close();
            return this.element;
        }

        const currentPower = this.card.power !== undefined ? this.card.power : '';
        const currentToughness = this.card.toughness !== undefined ? this.card.toughness : '';
        // Only show ADDITION input for type, as requested? 
        // Or show current and allow append? 
        // Request says "Add inputted type to original type". 
        // So I will provide an input for "Type Modification / Addition".

        this.element.innerHTML = `
            <div class="status-modal-content" style="
                background: rgba(10, 10, 20, 0.95); 
                padding: 2rem; 
                border-radius: 8px; 
                width: 350px; 
                display: flex; 
                flex-direction: column; 
                gap: 1rem; 
                color: white; 
                border: 1px solid var(--neon-blue); 
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); 
                backdrop-filter: blur(10px);
            ">
                <h3 style="margin: 0; text-align: center; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px;">Status Modification</h3>
                <p style="text-align: center; color: #ccc; font-size: 0.8rem;">${this.card.name}</p>
                
                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem; color: var(--neon-blue); font-weight: bold;">Power</label>
                        <input id="input-power" type="text" value="${currentPower}" style="
                            width: 100%; 
                            padding: 5px; 
                            background: #222; 
                            color: white; 
                            border: 1px solid #555; 
                            text-align: center; 
                            border-radius: 4px;
                        ">
                    </div>
                    <div style="display: flex; align-items: flex-end; padding-bottom: 5px; font-weight: bold; color: #888;">/</div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem; color: var(--neon-blue); font-weight: bold;">Toughness</label>
                        <input id="input-toughness" type="text" value="${currentToughness}" style="
                            width: 100%; 
                            padding: 5px; 
                            background: #222; 
                            color: white; 
                            border: 1px solid #555; 
                            text-align: center; 
                            border-radius: 4px;
                        ">
                    </div>
                </div>

                <div>
                    <label style="font-size: 0.8rem; color: var(--neon-blue); font-weight: bold;">Add Type</label>
                    <input id="input-type" type="text" placeholder="e.g. God, Zombie" style="
                        width: 100%; 
                        padding: 5px; 
                        background: #222; 
                        color: white; 
                        border: 1px solid #555; 
                        border-radius: 4px;
                    ">
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button id="btn-update" style="
                        flex: 1; 
                        padding: 0.5rem; 
                        background: rgba(0, 243, 255, 0.1); 
                        color: var(--neon-blue); 
                        border: 1px solid var(--neon-blue); 
                        cursor: pointer; 
                        border-radius: 4px; 
                        font-weight: bold; 
                        text-transform: uppercase;
                    ">UPDATE</button>
                    <button id="btn-reset" style="
                        flex: 1; 
                        padding: 0.5rem; 
                        background: rgba(255, 50, 50, 0.1); 
                        color: #ff9999; 
                        border: 1px solid #ff5555; 
                        cursor: pointer; 
                        border-radius: 4px;
                    ">RESET</button>
                    <button id="btn-cancel" style="
                        flex: 1; 
                        padding: 0.5rem; 
                        background: transparent; 
                        color: #888; 
                        border: 1px solid #555; 
                        cursor: pointer; 
                        border-radius: 4px;
                    ">CANCEL</button>
                </div>
            </div>
        `;

        // Event Listeners
        this.element.querySelector('#btn-cancel').onclick = () => this.close();

        this.element.querySelector('#btn-reset').onclick = () => {
            this.store.dispatch('UPDATE_CARD_STATUS', {
                playerId: this.playerId,
                cardId: this.cardId,
                isReset: true
            });
            this.close();
        };

        this.element.querySelector('#btn-update').onclick = () => {
            const power = this.element.querySelector('#input-power').value;
            const toughness = this.element.querySelector('#input-toughness').value;
            const type = this.element.querySelector('#input-type').value;

            this.store.dispatch('UPDATE_CARD_STATUS', {
                playerId: this.playerId,
                cardId: this.cardId,
                power: power,
                toughness: toughness,
                type: type, // This is the ADDED type
                isReset: false
            });
            this.close();
        };

        // Close on outside click
        this.element.onclick = (e) => {
            if (e.target === this.element) this.close();
        };

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
