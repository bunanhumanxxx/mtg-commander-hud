export class ControlSelectModal {
    constructor(store, card, currentControllerId) {
        this.store = store;
        this.card = card;
        this.currentControllerId = currentControllerId;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal-content" style="max-width: 320px; text-align: center;">
                <h3 style="color: var(--neon-blue); margin-bottom: 1rem; font-size: 1.2rem;">Change Control</h3>
                <p style="color: #ccc; margin-bottom: 1rem; font-size: 0.9rem;">Select target player to take control of <br><strong style="color: white;">${this.card.name}</strong></p>
                
                <div class="control-options" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <!-- Player Buttons Injected Here -->
                </div>

                <div style="margin-top: 1.5rem; display: flex;">
                    <button class="cancel-btn" style="
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

        // Modal Styles
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        const content = this.element.querySelector('.modal-content');
        content.style.cssText = `
            background: rgba(10, 20, 30, 0.95); padding: 1.5rem; border-radius: 8px; 
            border: 1px solid var(--neon-blue); box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);
            width: 90%; max-width: 320px;
        `;

        const optionsContainer = this.element.querySelector('.control-options');
        const state = this.store.getState();

        // 1. "Return to Owner" Button (If currently stolen)
        // Determine owner: if card.ownerId is set, use it. Else assume current controller (if never swapped) or we need to find out.
        // Actually, if we are changing control, we assume we know the owner. If not set, we set it now in store.
        // For UI, if card.ownerId exists and != currentControllerId, show Return button.

        if (this.card.ownerId && this.card.ownerId !== this.currentControllerId) {
            const owner = state.players.find(p => p.id === this.card.ownerId);
            const returnBtn = document.createElement('button');
            returnBtn.className = 'hud-btn-primary';
            returnBtn.style.background = 'rgba(255, 0, 85, 0.2)';
            returnBtn.style.borderColor = 'var(--neon-pink)';
            returnBtn.style.color = 'var(--neon-pink)';
            returnBtn.innerHTML = `Return to Owner (${owner ? owner.name : 'Unknown'})`;
            returnBtn.onclick = () => {
                this.store.dispatch('CHANGE_CONTROL', {
                    cardId: this.card.id,
                    currentControllerId: this.currentControllerId,
                    newControllerId: this.card.ownerId
                });
                this.close();
            };
            optionsContainer.appendChild(returnBtn);
        }

        // 2. Target Players (excluding self)
        state.players.forEach(p => {
            if (p.id !== this.currentControllerId) {
                const btn = document.createElement('button');
                btn.className = 'hud-btn-primary'; // Reuse existing class if available, or style inline
                btn.style.cssText = `
                    padding: 0.8rem; background: rgba(0, 243, 255, 0.1); border: 1px solid var(--neon-blue); 
                    color: white; cursor: pointer; transition: all 0.2s; text-align: left;
                `;
                btn.innerHTML = `Give to <strong>${p.name}</strong>`;

                btn.onmouseover = () => { btn.style.background = 'rgba(0, 243, 255, 0.3)'; };
                btn.onmouseout = () => { btn.style.background = 'rgba(0, 243, 255, 0.1)'; };

                btn.onclick = () => {
                    this.store.dispatch('CHANGE_CONTROL', {
                        cardId: this.card.id,
                        currentControllerId: this.currentControllerId,
                        newControllerId: p.id
                    });
                    this.close();
                };
                optionsContainer.appendChild(btn);
            }
        });

        this.element.querySelector('.cancel-btn').addEventListener('click', () => this.close());
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        return this.element;
    }

    close() {
        if (this.element) this.element.remove();
    }
}
