import { renderCard } from './Card.js';

export class DiscardSelectModal {
    constructor(store, playerId, requiredCount, onComplete) {
        this.store = store;
        this.playerId = playerId;
        this.requiredCount = requiredCount;
        this.onComplete = onComplete;
        this.selectedIds = new Set();
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); display: flex; click-events: none;
            justify-content: center; align-items: center; z-index: 9999;
        `;

        const zone = this.store.getState().zones[this.playerId];
        const hand = zone.simHand || [];

        this.element.innerHTML = `
            <div class="modal-content" style="
                background: #050a14; padding: 2rem; border: 2px solid #f44336; 
                border-radius: 8px; width: 90%; max-width: 1000px;
                display: flex; flex-direction: column; gap: 1rem;
                max-height: 90vh;
            ">
                <div style="text-align: center;">
                    <h2 style="color: #f44336; margin: 0; text-transform: uppercase;">Hand Limit Exceeded</h2>
                    <p style="color: #ccc; margin-top: 0.5rem;">
                        You have <strong style="color: white;">${hand.length}</strong> cards. 
                        Max is 7. Please discard <strong style="color: #f44336; font-size: 1.2rem;">${this.requiredCount}</strong> card(s).
                    </p>
                </div>

                <div id="discard-grid" style="
                    flex: 1; overflow-y: auto; padding: 1rem;
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem;
                    background: rgba(0,0,0,0.3); border-radius: 4px;
                ">
                    <!-- Cards -->
                </div>

                <button id="btn-confirm-discard" disabled style="
                    padding: 1rem; background: #333; color: #555; border: 1px solid #444;
                    font-weight: bold; font-size: 1.1rem; text-transform: uppercase; cursor: not-allowed;
                    transition: all 0.2s;
                ">
                    Discard ${this.requiredCount} Cards
                </button>
            </div>
        `;

        const grid = this.element.querySelector('#discard-grid');
        const confirmBtn = this.element.querySelector('#btn-confirm-discard');

        hand.forEach(card => {
            const originalEl = renderCard(card, this.store, this.playerId);
            const el = originalEl.cloneNode(true); // Clone to strip normal events

            el.style.width = '100%';
            el.style.height = 'auto';
            el.style.aspectRatio = '2.5/3.5';
            el.style.cursor = 'pointer';
            el.style.border = '2px solid transparent';
            el.style.borderRadius = '6px';
            el.style.transition = 'all 0.1s';

            // Selection Logic
            el.onclick = () => {
                if (this.selectedIds.has(card.instanceId)) {
                    this.selectedIds.delete(card.instanceId);
                    el.style.border = '2px solid transparent';
                    el.style.transform = 'scale(1)';
                    el.style.opacity = '1';
                } else {
                    if (this.selectedIds.size < this.requiredCount) {
                        this.selectedIds.add(card.instanceId);
                        el.style.border = '2px solid #f44336';
                        el.style.transform = 'scale(0.95)';
                        el.style.opacity = '0.7';
                    }
                }
                this._updateButton(confirmBtn);
            };

            grid.appendChild(el);
        });

        confirmBtn.onclick = () => {
            if (confirm('Discard selected cards?')) {
                this.handleDiscard();
            }
        };

        return this.element;
    }

    _updateButton(btn) {
        if (this.selectedIds.size === this.requiredCount) {
            btn.disabled = false;
            btn.style.background = '#f44336';
            btn.style.color = 'white';
            btn.style.cursor = 'pointer';
            btn.style.border = '1px solid #d32f2f';
            btn.textContent = `Discard ${this.requiredCount} Cards`;
        } else {
            btn.disabled = true;
            btn.style.background = '#333';
            btn.style.color = '555';
            btn.style.cursor = 'not-allowed';
            const remaining = this.requiredCount - this.selectedIds.size;
            btn.textContent = `Select ${remaining} more...`;
        }
    }

    handleDiscard() {
        this.store.dispatch('DISCARD_SIM_CARDS', {
            playerId: this.playerId,
            cardIds: Array.from(this.selectedIds)
        });

        // Cleanup and Callback
        this.element.remove();
        if (this.onComplete) this.onComplete();
    }
}
