export class PlayerCounterDetailModal {
    constructor(store, playerId, counters) {
        this.store = store;
        this.playerId = playerId;
        this.counters = counters; // Object { name: count }
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9300;
        `;

        const listHtml = Object.entries(this.counters).map(([name, count]) => `
            <div style="display: flex; align-items: center; justify-content: space-between; background: #333; padding: 1rem; border-radius: 4px; border: 1px solid #555;">
                <div style="font-weight: bold; font-size: 1.1rem;">${name}</div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <button class="adj-btn" data-name="${name}" data-delta="-1" style="padding: 0.3rem 0.8rem; cursor: pointer; background: #600; color: white; border: 1px solid #800;">-</button>
                    <div style="font-size: 1.5rem; color: var(--neon-pink); font-family: monospace; width: 40px; text-align: center;">
                        ${count}
                    </div>
                    <button class="adj-btn" data-name="${name}" data-delta="1" style="padding: 0.3rem 0.8rem; cursor: pointer; background: #060; color: white; border: 1px solid #080;">+</button>
                </div>
            </div>
        `).join('');

        this.element.innerHTML = `
            <div class="counter-modal-content" style="background: #2a2a2a; padding: 2rem; border-radius: 8px; width: 400px; display: flex; flex-direction: column; gap: 1.5rem; color: white; border: 1px solid #444;">
                <h3 style="margin: 0; text-align: center;">Player Counters</h3>
                
                <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 60vh; overflow-y: auto;">
                    ${listHtml.length > 0 ? listHtml : '<div style="text-align:center; color:#777;">No Counters</div>'}
                </div>

                <button id="btn-close" style="padding: 0.8rem; background: #444; color: white; border: 1px solid #666; cursor: pointer; border-radius: 4px; width: 100%; font-weight: bold;">Close</button>
            </div>
        `;

        // Event Listeners
        this.element.querySelector('#btn-close').addEventListener('click', () => {
            this.close();
        });

        this.element.querySelectorAll('.adj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const delta = parseInt(btn.dataset.delta);
                // Dispatch update directly
                // Logic: NEW count = current + delta
                const current = this.counters[name] || 0;
                const newCount = current + delta;

                this.store.dispatch('UPDATE_PLAYER_COUNTER', {
                    playerId: this.playerId,
                    counterName: name,
                    count: delta,
                });

                // Update local display (Optimistic)
                const display = btn.parentElement.querySelector('div');
                display.textContent = newCount;
                this.counters[name] = newCount;
            });
        });

        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
