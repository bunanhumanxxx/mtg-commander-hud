import { renderCard } from './Card.js';

export class HandSimulatorModal {
    constructor(store, playerId) {
        this.store = store;
        this.playerId = playerId;
        this.element = null;
        this.unsubscribe = null;
        this.useMode = false;
        this.useMode = false;
        this.selectedCardIds = new Set(); // Track selected cards for Use Mode
        this._globalClick = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: flex-end; 
            z-index: 9200; padding-bottom: 2rem;
        `;

        this.element.innerHTML = `
            <div class="hand-sim-content" style="
                background: rgba(10, 15, 20, 0.98); 
                width: 95%; height: 80vh; 
                border: 1px solid var(--neon-blue); 
                border-radius: 12px 12px 0 0;
                box-shadow: 0 0 30px rgba(0, 243, 255, 0.2); 
                display: flex; flex-direction: column;
                position: relative;
            ">
                <!-- Header / Controls -->
                <div style="
                    padding: 0.5rem 1rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;
                    background: rgba(0,0,0,0.5); border-radius: 12px 12px 0 0;
                    overflow-x: auto; white-space: nowrap; flex-shrink: 0; min-height: 60px;
                ">
                    <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0; margin-right: 1rem;">
                        <h3 style="margin: 0; color: var(--neon-blue); text-transform: uppercase;">Hand Simulator</h3>
                        <span id="sim-deck-count" style="
                            background: #333; color: #ccc; padding: 2px 8px; border-radius: 4px; font-size: 0.9rem; font-family: monospace;
                        ">Deck: 0</span>
                        
                        <!-- No Max Hand Checkbox (Full System Only) -->
                        <label id="no-max-hand-container" style="display: none; align-items: center; gap: 0.5rem; color: #aaa; font-size: 0.9rem; cursor: pointer; margin-left: 1rem;">
                             <input type="checkbox" id="sim-no-max-hand"> No Max Hand
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button id="btn-start" class="sim-btn" style="border-color: var(--neon-green); color: var(--neon-green);">START</button>
                        <button id="btn-mulligan" class="sim-btn" style="border-color: #ff9900; color: #ff9900;">MULLI</button>
                        <button id="btn-draw" class="sim-btn" style="border-color: #00bef5; color: #00bef5;">DRAW</button>
                        <button id="btn-search" class="sim-btn">SEARCH</button>
                        <button id="btn-use" class="sim-btn" style="border-color: #f44336; color: #f44336;">USE MODE</button>
                        <button id="btn-close" class="sim-btn" style="border-color: #666; color: #ccc;">CLOSE</button>
                    </div>
                </div>

                <!-- Hand Area -->
                <div id="sim-hand-area" style="
                    flex: 1; padding: 1rem; overflow: auto; 
                    display: flex; flex-wrap: wrap; align-content: flex-start; gap: 0.5rem;
                    background: radial-gradient(circle at center, #222 0%, #111 80%);
                    min-width: 300px;
                ">
                    <!-- Cards go here -->
                </div>
                
                <div id="sim-info" style="
                    padding: 0.5rem 1rem; text-align: center; color: #666; font-size: 0.9rem; border-top: 1px solid #333;
                ">
                    Controls: Toggle "USE MODE" -> Click to Select -> Right Click to Use.
                </div>
            </div>
            <style>
                .sim-btn {
                    padding: 0.5rem 1rem; background: transparent; border: 1px solid #555; color: white;
                    cursor: pointer; border-radius: 4px; font-weight: bold; font-family: 'Rajdhani', sans-serif;
                    transition: all 0.2s;
                }
                .sim-btn:hover { background: rgba(255,255,255,0.1); }
                .sim-btn.active { background: rgba(244, 67, 54, 0.2); box-shadow: 0 0 10px rgba(244, 67, 54, 0.5); }
                
                /* Custom Checkbox */
                #sim-no-max-hand {
                    appearance: none; -webkit-appearance: none;
                    width: 16px; height: 16px;
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 3px;
                    cursor: pointer;
                    position: relative;
                    vertical-align: middle;
                }
                #sim-no-max-hand:checked {
                    background: cyan;
                    border-color: cyan;
                    box-shadow: 0 0 5px cyan;
                }
                #sim-no-max-hand:checked::after {
                    content: '✔';
                    position: absolute; top: -3px; left: 1px;
                    font-size: 12px; color: black; font-weight: bold;
                }
            </style>
        `;

        this._bindEvents();
        this._update();
        this.unsubscribe = this.store.subscribe(() => this._update());

        // Close context menu on global click
        this._globalClick = (e) => {
            if (!e.target.closest('#sim-ctx-menu')) {
                this._hideCtxMenu();
            }
        };
        document.addEventListener('click', this._globalClick);

        // No Max Hand Logic
        const settings = this.store.getState().settings;
        const noMaxContainer = this.element.querySelector('#no-max-hand-container');
        const noMaxCheck = this.element.querySelector('#sim-no-max-hand');

        if (settings.gameMode !== 'deck_builder') {
            noMaxContainer.style.display = 'flex';
            const player = this.store.getState().players.find(p => p.id === this.playerId);
            if (player) noMaxCheck.checked = player.noMaxHandSize || false;

            noMaxCheck.addEventListener('change', (e) => {
                this.store.dispatch('TOGGLE_NO_MAX_HAND', {
                    playerId: this.playerId,
                    value: e.target.checked
                });
            });
        }

        return this.element;
    }

    _showSearchModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-search-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9300; display: flex; justify-content: center; align-items: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #111; width: 80%; height: 80%; border: 1px solid #444; border-radius: 8px;
            display: flex; flex-direction: column; overflow: hidden;
        `;

        const header = document.createElement('div');
        header.innerHTML = '<h3 style="margin:0; padding: 1rem; color:white; background:#222;">Library Search (Simulated)</h3>';
        header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE';
        closeBtn.style.padding = '0.5rem 1rem';
        closeBtn.onclick = () => modal.remove();
        header.appendChild(closeBtn);
        content.appendChild(header);

        const list = document.createElement('div');
        list.style.cssText = 'flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;';

        const zone = this.store.getState().zones[this.playerId];
        const library = zone.simLibrary || [];

        library.forEach(card => {
            const item = document.createElement('div');
            // item.textContent = card.name; // Hide text, show image
            item.title = card.name;
            item.className = 'sim-search-card';
            item.style.cssText = `
                width: 140px; aspect-ratio: 2.5/3.5;
                background-image: url(${card.image_url}); background-size: cover; background-position: center;
                border-radius: 6px; cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                border: 1px solid #444; transition: transform 0.1s;
            `;
            item.onmouseenter = () => item.style.transform = 'scale(1.05)';
            item.onmouseleave = () => item.style.transform = 'scale(1)';

            item.onclick = () => {
                if (confirm(`Add ${card.name} to hand? (Will shuffle deck)`)) {
                    this.store.dispatch('TEST_SEARCH', {
                        playerId: this.playerId,
                        cardId: card.instanceId
                    });
                    modal.remove();
                }
            };
            list.appendChild(item);
        });

        content.appendChild(list);
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    _bindEvents() {
        this.element.querySelector('#btn-close').onclick = () => this.close();

        this.element.querySelector('#btn-start').onclick = () => {
            if (confirm('Reset deck and draw new hand?')) {
                this.store.dispatch('TEST_INIT_HAND', { playerId: this.playerId });
                this.selectedCardIds.clear();
            }
        };

        this.element.querySelector('#btn-mulligan').onclick = () => {
            this.store.dispatch('TEST_MULLIGAN', { playerId: this.playerId });
            this.selectedCardIds.clear();
        };

        this.element.querySelector('#btn-draw').onclick = () => {
            this.store.dispatch('TEST_DRAW', { playerId: this.playerId });
        };

        this.element.querySelector('#btn-search').onclick = () => {
            this._showSearchModal();
        };

        const useBtn = this.element.querySelector('#btn-use');
        useBtn.style.display = 'inline-block';
        useBtn.onclick = () => {
            this.useMode = !this.useMode;
            this.selectedCardIds.clear();
            if (this.useMode) {
                useBtn.classList.add('active');
                useBtn.textContent = 'USE MODE (ON)';
            } else {
                useBtn.classList.remove('active');
                useBtn.textContent = 'USE MODE';
            }
            this._update();
        };
    }

    _update() {
        const state = this.store.getState();
        const zone = state.zones[this.playerId];
        if (!zone) return;

        // Update Deck Count
        const deckCount = zone.simLibrary ? zone.simLibrary.length : 0;
        const countSpan = this.element.querySelector('#sim-deck-count');
        if (countSpan) countSpan.textContent = `Deck: ${deckCount}`;

        const container = this.element.querySelector('#sim-hand-area');
        container.innerHTML = '';

        const hand = zone.simHand || [];

        if (hand.length === 0) {
            container.innerHTML = '<div style="color: #444; width: 100%; text-align: center;">Simulated Hand is empty. Press START.</div>';
            return;
        }

        hand.forEach(card => {
            // Render card and CLONE IT to strip listeners from Card.js
            const originalEl = renderCard(card, this.store, this.playerId);
            const el = originalEl.cloneNode(true);

            el.className = 'card-in-hand';
            el.style.cssText = `
                width: 200px; aspect-ratio: 2.5/3.5; 
                background-image: url(${card.image_url}); background-size: cover; background-position: center;
                border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                flex-shrink: 0; cursor: pointer; transition: transform 0.2s, border 0.2s;
                position: relative;
            `;

            if (this.useMode) {
                // Selection Logic
                // Selection Logic
                if (this.selectedCardIds.has(card.instanceId)) {
                    el.style.border = '3px solid #f44336';
                    el.style.transform = 'scale(1.05)';
                } else {
                    el.style.border = '1px solid #444';
                    el.style.opacity = '1';
                }

                el.onclick = (e) => {
                    e.stopPropagation();
                    if (this.selectedCardIds.has(card.instanceId)) {
                        this.selectedCardIds.delete(card.instanceId);
                    } else {
                        this.selectedCardIds.add(card.instanceId);
                    }
                    this._hideCtxMenu();
                    this._update();
                };

                el.oncontextmenu = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!this.selectedCardIds.has(card.instanceId)) {
                        this.selectedCardIds.add(card.instanceId);
                        this._update();
                    }
                    this._showCtxMenu(e.clientX, e.clientY);
                    return false;
                };
            } else {
                el.title = 'Click to Preview / Right Click to Move';
                el.style.border = '1px solid #444';
                // Click to Preview
                el.onclick = (e) => {
                    e.stopPropagation();
                    import('./CardDetailModal.js?v=' + Date.now()).then(({ CardDetailModal }) => {
                        const modal = new CardDetailModal(card);
                        document.body.appendChild(modal.render());
                    });
                };
                // Right Click to Move (Single Item)
                el.oncontextmenu = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Select strictly this card for the action
                    this.selectedCardIds.clear();
                    this.selectedCardIds.add(card.instanceId);

                    this._showCtxMenu(e.clientX, e.clientY);
                    return false;
                };
            }

            if (!this.useMode) {
                el.onmouseenter = () => el.style.transform = 'translateY(-10px) scale(1.05)';
                el.onmouseleave = () => el.style.transform = 'translateY(0) scale(1)';
            }

            container.appendChild(el);
        });
    }

    _showCtxMenu(x, y) {
        this._hideCtxMenu();

        const menu = document.createElement('div');
        menu.id = 'sim-ctx-menu';
        menu.style.cssText = `
            position: fixed; top: ${y}px; left: ${x}px;
            background: rgba(20, 20, 30, 0.95); border: 1px solid var(--neon-blue);
            border-radius: 4px; padding: 0.5rem; z-index: 9500;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; gap: 0.5rem; min-width: 100px;
        `;

        const count = this.selectedCardIds.size;
        const btn = document.createElement('button');
        btn.textContent = `MOVE (${count})`;
        btn.style.cssText = `
            background: #f44336; color: white; border: none; padding: 0.5rem 1rem;
            cursor: pointer; font-weight: bold; border-radius: 2px; text-align: left;
        `;
        btn.onclick = (e) => {
            e.stopPropagation();
            this._hideCtxMenu();

            const state = this.store.getState();
            // Check Game Mode
            if (state.settings.gameMode === 'deck_builder') {
                // Deck Builder Mode: Just remove from hand (Void)
                this.store.dispatch('MOVE_SIM_CARDS', {
                    playerId: this.playerId,
                    cardIds: Array.from(this.selectedCardIds),
                    destination: 'void' // Unknown destination triggers deletion in store logic
                });
                this.selectedCardIds.clear();
                this._update();
                return;
            }

            // Full System / Other Modes: Show Zone Select Modal
            const zone = state.zones[this.playerId];
            const hasCommander = zone?.simHand?.some(c => this.selectedCardIds.has(c.instanceId) && c.isCommander);

            import('./ZoneSelectModal.js?v=' + Date.now()).then(({ ZoneSelectModal }) => {
                const modal = new ZoneSelectModal(`${count} Cards`, (zone) => {
                    this.store.dispatch('MOVE_SIM_CARDS', {
                        playerId: this.playerId,
                        cardIds: Array.from(this.selectedCardIds),
                        destination: zone
                    });
                    this.selectedCardIds.clear();
                    this._update();
                }, () => { }, { isCommander: hasCommander });
                document.body.appendChild(modal.render());
            });
        };

        menu.appendChild(btn);
        document.body.appendChild(menu);
    }

    _hideCtxMenu() {
        const existing = document.getElementById('sim-ctx-menu');
        if (existing) existing.remove();
    }

    close() {
        if (this.unsubscribe) this.unsubscribe();
        if (this._globalClick) document.removeEventListener('click', this._globalClick);
        this._hideCtxMenu();
        this.element.remove();
    }
}
