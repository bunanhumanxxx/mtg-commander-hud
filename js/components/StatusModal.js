export class StatusModal {
    constructor(store, playerId, type, currentValue, sourceId = null, sourceName = '') {
        this.store = store;
        this.playerId = playerId;
        this.type = type; // 'life', 'hand', 'commanderDamage'
        this.baseValue = currentValue;
        this.currentValue = currentValue;
        this.sourceId = sourceId; // For commander damage
        this.sourceName = sourceName;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'status-modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 100000;
        `;

        let title = '';
        if (this.type === 'life') title = 'Life Total';
        else if (this.type === 'hand') title = 'Hand Count';
        else if (this.type === 'commanderDamage') title = `Commander Dmg from ${this.sourceName}`;

        this.element.innerHTML = `
            <div class="status-content" style="
                background: rgba(10, 10, 20, 0.95); 
                padding: 2rem; 
                border-radius: 8px; 
                text-align: center; 
                min-width: 350px; 
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); 
                border: 1px solid var(--neon-blue); 
                backdrop-filter: blur(10px);
                color: white;
            ">
                <h3 style="margin-top: 0; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px;">${title}</h3>
                
                <div class="value-display" style="margin: 1.5rem 0;">
                    <div style="font-size: 3.5rem; font-weight: bold; font-family: 'Orbitron', monospace; text-shadow: 0 0 10px rgba(0,0,0,0.5); color: white;">${this.currentValue}</div>
                    <div class="delta-display" style="font-size: 1.2rem; color: #aaa; min-height: 1.5rem;"></div>
                </div>

                <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <button class="adj-btn" data-val="1" style="padding: 0.8rem 1.2rem; background: rgba(34, 85, 34, 0.8); color: white; border: 1px solid #484; border-radius: 4px; cursor: pointer; font-weight: bold;">+1</button>
                    <button class="adj-btn" data-val="5" style="padding: 0.8rem 1.2rem; background: rgba(34, 85, 34, 0.8); color: white; border: 1px solid #484; border-radius: 4px; cursor: pointer; font-weight: bold;">+5</button>
                    <div style="width: 10px;"></div>
                    <button class="adj-btn" data-val="-1" style="padding: 0.8rem 1.2rem; background: rgba(85, 34, 34, 0.8); color: white; border: 1px solid #844; border-radius: 4px; cursor: pointer; font-weight: bold;">-1</button>
                    <button class="adj-btn" data-val="-5" style="padding: 0.8rem 1.2rem; background: rgba(85, 34, 34, 0.8); color: white; border: 1px solid #844; border-radius: 4px; cursor: pointer; font-weight: bold;">-5</button>
                </div>

                 <div style="margin-bottom: 1.5rem; display: flex; justify-content: center; gap: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px; border: 1px solid #444;">
                     <input type="number" id="custom-val" placeholder="+/- Value" style="padding: 0.5rem; width: 100px; text-align: center; background: #333; border: 1px solid #555; color: white; border-radius: 4px;">
                     <button id="apply-custom" style="padding: 0.5rem 1rem; background: #444; color: white; border: 1px solid #666; border-radius: 4px; cursor: pointer;">Apply</button>
                 </div>
                 
                <div class="action-buttons" style="display: flex; gap: 1rem;">
                    <button class="done-btn" style="
                        flex: 1; 
                        padding: 1rem; 
                        background: rgba(0, 243, 255, 0.1); 
                        border: 1px solid var(--neon-blue); 
                        border-radius: 4px; 
                        color: var(--neon-blue); 
                        cursor: pointer; 
                        font-weight: bold; 
                        text-transform: uppercase;
                        box-shadow: 0 0 5px var(--neon-blue);
                    ">DONE</button>
                    <button class="cancel-btn" style="
                        flex: 1; 
                        padding: 1rem; 
                        background: transparent; 
                        border: 1px solid #666; 
                        border-radius: 4px; 
                        color: #aaa; 
                        cursor: pointer; 
                        font-weight: bold;
                    ">CANCEL</button>
                </div>
            </div>
        `;

        // Listeners for adjustments
        this.element.querySelectorAll('.adj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.dataset.val);
                this.updateLocal(val);
            });
        });

        const customInput = this.element.querySelector('#custom-val');
        this.element.querySelector('#apply-custom').addEventListener('click', () => {
            const val = parseInt(customInput.value);
            if (!isNaN(val)) {
                this.updateLocal(val);
                customInput.value = '';
                customInput.focus();
            }
        });

        // Done / Cancel
        this.element.querySelector('.done-btn').addEventListener('click', () => this.submit());
        this.element.querySelector('.cancel-btn').addEventListener('click', () => this.close());
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        return this.element;
    }

    updateLocal(amount) {
        this.currentValue += amount;

        // Update display
        // Robust selector: first child of value-display
        const valDisplay = this.element.querySelector('.value-display > div:first-child');
        if (valDisplay) valDisplay.textContent = this.currentValue;

        // Update delta display
        const delta = this.currentValue - this.baseValue;
        const deltaDisplay = this.element.querySelector('.delta-display');
        if (delta > 0) {
            deltaDisplay.textContent = `(+${delta})`;
            deltaDisplay.style.color = 'var(--neon-blue)'; // Maching theme
        } else if (delta < 0) {
            deltaDisplay.textContent = `(${delta})`;
            deltaDisplay.style.color = 'var(--neon-pink)'; // Matching theme
        } else {
            deltaDisplay.textContent = '';
        }
    }

    submit() {
        const delta = this.currentValue - this.baseValue;
        if (delta !== 0) {
            if (this.type === 'life') {
                this.store.dispatch('UPDATE_LIFE', { playerId: this.playerId, amount: delta });
            } else if (this.type === 'hand') {
                this.store.dispatch('UPDATE_HAND', { playerId: this.playerId, amount: delta });
            } else if (this.type === 'commanderDamage') {
                this.store.dispatch('UPDATE_COMMANDER_DAMAGE', {
                    playerId: this.playerId,
                    sourceId: this.sourceId,
                    amount: delta,
                    sourceName: this.sourceName
                });
            }
        }
        this.close();
    }

    close() {
        this.element.remove();
    }
}
