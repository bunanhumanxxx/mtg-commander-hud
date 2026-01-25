export class ZoneSelectModal {
    constructor(cardName, onSelect, onCancel, options = {}) {
        this.cardName = cardName || 'Commander';
        this.onSelect = onSelect;
        this.onCancel = onCancel;
        this.options = options;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 110000;
        `;

        const showCommand = this.options.isCommander;

        this.element.innerHTML = `
            <div class="zone-modal-content" style="background: #2a2a2a; padding: 2rem; border-radius: 8px; width: 300px; display: flex; flex-direction: column; gap: 1rem; color: white; border: 1px solid #444; max-height: 85vh; overflow-y: auto;">
                <h3 style="margin: 0; text-align: center;">Select Destination</h3>
                <p style="text-align: center; color: #ccc; font-size: 0.9rem;">
                    Move <strong style="color: gold;">${this.cardName}</strong> to:
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button class="zone-btn" data-zone="command" style="padding: 1rem; background: #FFD700; color: #000; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; display: ${showCommand ? 'block' : 'none'};">Command Zone</button>
                    <button class="zone-btn" data-zone="battlefield" style="padding: 1rem; background: #e74c3c; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">Battlefield</button>
                    <button class="zone-btn" data-zone="grave" style="padding: 0.8rem; background: #555; color: white; border: none; cursor: pointer; border-radius: 4px;">Graveyard</button>
                    <button class="zone-btn" data-zone="exile" style="padding: 0.8rem; background: #6644aa; color: white; border: none; cursor: pointer; border-radius: 4px;">Exile</button>
                    <button class="zone-btn" data-zone="library" style="padding: 0.8rem; background: #4444aa; color: white; border: none; cursor: pointer; border-radius: 4px;">Library</button>
                    <button class="zone-btn" data-zone="hand" style="padding: 0.8rem; background: #3388bb; color: white; border: none; cursor: pointer; border-radius: 4px;">Hand</button>
                </div>

                <button id="btn-cancel" style="padding: 0.5rem; background: transparent; color: #888; border: 1px solid #555; cursor: pointer; border-radius: 4px; margin-top: 0.5rem;">Cancel</button>
            </div>
        `;

        this.element.querySelectorAll('.zone-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const zone = btn.dataset.zone;
                if (this.onSelect) this.onSelect(zone);
                this.close();
            });
        });

        this.element.querySelector('#btn-cancel').addEventListener('click', () => {
            if (this.onCancel) this.onCancel();
            this.close();
        });

        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                if (this.onCancel) this.onCancel();
                this.close();
            }
        });

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
