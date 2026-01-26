export class LibraryStatusModal {
    constructor(store, playerId) {
        this.store = store;
        this.playerId = playerId;
        this.element = null;
        this.destination = ''; // '', 'hand', 'grave', 'exile'
        this.logSummary = {
            grave: 0,
            exile: 0,
            hand: 0,
            simple: 0 // No destination (just +/-)
        };
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9100;
        `;

        const player = this.store.getState().players.find(p => p.id === this.playerId);
        const currentCount = player.libraryCount || 0;

        this.element.innerHTML = `
            <div class="library-modal-content" style="background: #2a2a2a; padding: 2rem; border-radius: 8px; width: 350px; display: flex; flex-direction: column; gap: 1.5rem; color: white; border: 1px solid #444;">
                <h3 style="margin: 0; text-align: center;">Library Management</h3>
                
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <label style="font-size: 0.8rem; color: #aaa;">Target Destination for Decrease</label>
                    <select id="lib-dest-select" style="padding: 0.5rem; width: 100%; background: #333; color: white; border: 1px solid #555;">
                        <option value="">(None)</option>
                        <option value="hand">Hand</option>
                        <option value="grave">Graveyard</option>
                        <option value="exile">Exile</option>
                    </select>
                </div>

                <div style="display: flex; justify-content: center; align-items: center; gap: 1rem;">
                    <div style="font-size: 3rem; font-weight: bold; font-family: monospace; color: #88ff88;" id="lib-count-display">${currentCount}</div>
                </div>

                <div style="display: flex; justify-content: center; gap: 0.5rem;">
                    <button class="adj-btn" data-val="-1" style="padding: 0.8rem 1.2rem; background: #552222; color: white; border: 1px solid #774444; border-radius: 4px; cursor: pointer;">-1</button>
                    <button class="adj-btn" data-val="-5" style="padding: 0.8rem 1.2rem; background: #552222; color: white; border: 1px solid #774444; border-radius: 4px; cursor: pointer;">-5</button>
                    <div style="width: 10px;"></div>
                    <button class="adj-btn" data-val="1" style="padding: 0.8rem 1.2rem; background: #225522; color: white; border: 1px solid #447744; border-radius: 4px; cursor: pointer;">+1</button>
                    <button class="adj-btn" data-val="5" style="padding: 0.8rem 1.2rem; background: #225522; color: white; border: 1px solid #447744; border-radius: 4px; cursor: pointer;">+5</button>
                </div>

                <div id="sim-search-container" style="display: none; padding: 0 1rem;">
                    <button id="btn-search-deck" style="width: 100%; padding: 0.8rem; background: #00add8; color: white; border: none; font-weight: bold; border-radius: 4px; cursor: pointer;">
                        SEARCH DECK (Sim)
                    </button>
                </div>

                <button id="btn-close" style="padding: 0.8rem; background: #444; color: white; border: 1px solid #666; cursor: pointer; border-radius: 4px; width: 100%; font-weight: bold;">Close (Apply Log)</button>
            </div>
        `;

        // Event Listeners
        const select = this.element.querySelector('#lib-dest-select');
        select.value = this.destination;
        select.addEventListener('change', (e) => {
            this.destination = e.target.value;
        });

        this.element.querySelectorAll('.adj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.dataset.val);
                this.adjust(val);
            });
        });

        this.element.querySelector('#btn-close').addEventListener('click', () => {
            this.closeAndLog();
        });

        // Search Logic
        const zone = this.store.getState().zones[this.playerId];
        if (zone && zone.simLibrary) {
            this.element.querySelector('#sim-search-container').style.display = 'block';
            this.element.querySelector('#btn-search-deck').onclick = () => {
                import('./SimSearchModal.js?v=' + Date.now()).then(({ SimSearchModal }) => {
                    const modal = new SimSearchModal(this.store, this.playerId, this.destination, () => {
                        // Refresh Display after Search
                        const p = this.store.getState().players.find(x => x.id === this.playerId);
                        const display = this.element.querySelector('#lib-count-display');
                        if (display) display.textContent = p.libraryCount;
                    });
                    document.body.appendChild(modal.render());
                });
            };
        }

        return this.element;
    }

    adjust(amount) {
        // Update Store Silently
        this.store.dispatch('ADJUST_LIBRARY', {
            playerId: this.playerId,
            amount: amount,
            destination: amount < 0 ? this.destination : '', // Only move if decreasing
            silent: true
        });

        // Update Local Display
        const player = this.store.getState().players.find(p => p.id === this.playerId);
        const display = this.element.querySelector('#lib-count-display');
        if (display) display.textContent = player.libraryCount;

        // Track for logging
        if (amount < 0 && this.destination) {
            this.logSummary[this.destination] += Math.abs(amount);
        } else {
            this.logSummary.simple += amount;
        }
    }

    closeAndLog() {
        // Construct Log Message
        const parts = [];
        if (this.logSummary.hand > 0) parts.push(`moved ${this.logSummary.hand} to Hand`);
        if (this.logSummary.grave > 0) parts.push(`milled ${this.logSummary.grave} to Graveyard`);
        if (this.logSummary.exile > 0) parts.push(`exiled ${this.logSummary.exile} from Library`);
        if (this.logSummary.simple !== 0) parts.push(`adjusted deck by ${this.logSummary.simple > 0 ? '+' : ''}${this.logSummary.simple}`);

        if (parts.length > 0) {
            const player = this.store.getState().players.find(p => p.id === this.playerId);
            const msg = `${player.name} ${parts.join(', ')}. (Deck: ${player.libraryCount})`;
            this.store.dispatch('LOG_ACTION', msg);
        }

        this.element.remove();
    }
}
