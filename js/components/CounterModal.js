export class CounterModal {
    constructor(store, playerId, cardIds, existingCounters = {}) {
        this.store = store;
        this.playerId = playerId;
        this.cardIds = Array.isArray(cardIds) ? cardIds : [cardIds]; // Support batch
        this.existingCounters = existingCounters;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 6000;
        `;

        const titleText = this.cardIds.length > 1
            ? `Manage Counters (${this.cardIds.length} cards)`
            : 'Manage Counters';

        this.element.innerHTML = `
            <div class="counter-modal-content" style="
                background: #050a14; 
                padding: 2rem; 
                border-radius: 8px; 
                width: 300px; 
                display: flex; 
                flex-direction: column; 
                gap: 1rem; 
                color: white; 
                border: 1px solid cyan; 
                box-shadow: 0 0 20px cyan; 
                backdrop-filter: blur(10px);
            ">
                <h3 style="margin: 0; text-align: center; color: cyan; text-shadow: 0 0 10px cyan; text-transform: uppercase; letter-spacing: 2px;">${titleText}</h3>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: cyan; font-weight: bold;">Counter Name</label>
                    <input type="text" id="counter-name" value="+1/+1" list="counter-suggestions" style="
                        width: 100%; 
                        padding: 0.5rem; 
                        background: #222; 
                        color: white; 
                        border: 1px solid #555; 
                        border-radius: 4px;
                    ">
                    <datalist id="counter-suggestions">
                        <option value="+1/+1">
                        <option value="-1/-1">
                        <option value="loyalty">
                        <option value="charge">
                        <option value="shield">
                        <option value="stun">
                    </datalist>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: cyan; font-weight: bold;">Amount change</label>
                    <input type="number" id="counter-amount" value="1" min="1" style="
                        width: 100%; 
                        padding: 0.5rem; 
                        background: #222; 
                        color: white; 
                        border: 1px solid #555; 
                        border-radius: 4px;
                    ">
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button id="btn-add" style="
                        flex: 1; 
                        padding: 0.8rem; 
                        background: rgba(34, 85, 34, 0.8); 
                        color: white; 
                        border: 1px solid #484; 
                        cursor: pointer; 
                        border-radius: 4px; 
                        font-weight: bold;
                    ">ADD (+)</button>
                    <button id="btn-remove" style="
                        flex: 1; 
                        padding: 0.8rem; 
                        background: rgba(85, 34, 34, 0.8); 
                        color: white; 
                        border: 1px solid #844; 
                        cursor: pointer; 
                        border-radius: 4px; 
                        font-weight: bold;
                    ">REMOVE (-)</button>
                </div>
                
                <button id="btn-close" style="
                    padding: 0.5rem; 
                    background: transparent; 
                    color: #888; 
                    border: 1px solid #555; 
                    cursor: pointer; 
                    border-radius: 4px; 
                    margin-top: 0.5rem;
                ">CLOSE</button>
            </div>
        `;

        // Event Listeners
        const nameInput = this.element.querySelector('#counter-name');
        const amountInput = this.element.querySelector('#counter-amount');

        this.element.querySelector('#btn-add').addEventListener('click', () => {
            this.updateCounter(nameInput.value, parseInt(amountInput.value) || 0);
        });

        this.element.querySelector('#btn-remove').addEventListener('click', () => {
            this.updateCounter(nameInput.value, -(parseInt(amountInput.value) || 0));
        });

        this.element.querySelector('#btn-close').addEventListener('click', () => this.close());
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        return this.element;
    }

    updateCounter(type, value) {
        if (!type || value === 0) return;

        this.cardIds.forEach(id => {
            this.store.dispatch('MODIFY_CARD_COUNTER', {
                playerId: this.playerId,
                cardId: id,
                counterType: type,
                value: value
            });
        });

        this.close();
    }

    close() {
        this.element.remove();
    }
}
