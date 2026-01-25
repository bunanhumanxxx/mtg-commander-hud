export class DeckBuilderContextMenu {
    constructor(store) {
        this.store = store;
        this.element = null;
    }

    show(x, y, cardId, playerId) {
        // Close existing
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        // Create Menu
        this.element = document.createElement('div');
        this.element.className = 'context-menu';
        this.element.style.cssText = `
            position: fixed; top: ${y}px; left: ${x}px;
            background: rgba(10, 15, 20, 0.95);
            border: 1px solid var(--neon-green);
            box-shadow: 0 0 15px rgba(0, 255, 100, 0.2);
            border-radius: 4px; z-index: 10000;
            display: flex; flex-direction: column;
            min-width: 150px; padding: 0.5rem 0;
            backdrop-filter: blur(5px);
        `;

        // Determine targets (Batch vs Single)
        const state = this.store.getState();
        const ui = state.ui;
        const selection = ui.selectedIds || [];
        const targets = (ui.selectionMode && selection.includes(cardId)) ? selection : [cardId];

        // Action: Set as Commander (Toggle)
        this._addOption('Commander', () => {
            if (targets.length > 1) {
                alert('Error: Cannot assign Commander status to multiple cards at once.');
                return;
            }

            const targetId = targets[0];
            const zone = state.zones[playerId];
            const library = zone.library || [];

            // Find target card
            const card = library.find(c => c.instanceId === targetId);

            if (!card) {
                const sb = zone.sideboard || [];
                const sbCard = sb.find(c => c.instanceId === targetId);
                if (sbCard) {
                    alert("Commanders must be in Main Deck (Library). Move it there first.");
                }
                return;
            }

            const currentCommanders = library.filter(c => c.isCommander);

            if (card.isCommander) {
                // Toggle OFF
                this.store.dispatch('UPDATE_CARD_PROPERTY', {
                    playerId, cardId: targetId, property: 'isCommander', value: false, zoneName: 'library'
                });
            } else {
                // Toggle ON
                const isPartner = document.getElementById('check-partner')?.checked;
                const limit = isPartner ? 2 : 1;

                if (currentCommanders.length >= limit) {
                    alert(`Cannot assign more than ${limit} Commander(s). Uncheck existing one first.`);
                    return;
                }

                this.store.dispatch('UPDATE_CARD_PROPERTY', {
                    playerId, cardId: targetId, property: 'isCommander', value: true, zoneName: 'library'
                });
            }
        });

        // Determine current zone for Move logic (Check first target)
        // Assumption: All selected cards are in the same zone if selected together? 
        // Not guaranteed, but visually probable. 
        // We will check zone for each card in loop, but for Menu Option, we infer from clicked card.
        const zone = state.zones[playerId];
        let clickedZone = 'library';
        if (zone.sideboard && zone.sideboard.find(c => c.instanceId === cardId)) clickedZone = 'sideboard';

        // Action: Move... (Submenu logic simplified to direct options or robust loop)
        this._addOption('Move...', (e) => {
            this.element.innerHTML = '';

            // Back
            const back = document.createElement('div');
            back.textContent = '< Back';
            back.style.cssText = 'padding: 0.5rem 1rem; color: #888; cursor: pointer; border-bottom: 1px solid #333; font-size: 0.8rem;';
            back.onclick = (evt) => {
                evt.stopPropagation();
                this.element.remove();
            };
            // this.element.appendChild(back); 

            // Option: Delete
            this._addOption(`削除 (Delete) ${targets.length > 1 ? `(${targets.length})` : ''}`, () => {
                targets.forEach(tid => {
                    // Detect zone for each
                    let z = 'library';
                    if (zone.sideboard && zone.sideboard.find(c => c.instanceId === tid)) z = 'sideboard';

                    this.store.dispatch('MOVE_CARD', {
                        playerId: playerId,
                        cardId: tid,
                        destination: 'grave', // Trash
                        sourceZone: z
                    });
                });
            });

            // Option: To Sideboard
            if (clickedZone === 'library') {
                this._addOption(`候補 (Sideboard) ${targets.length > 1 ? `(${targets.length})` : ''}`, () => {
                    targets.forEach(tid => {
                        this.store.dispatch('MOVE_CARD', {
                            playerId: playerId,
                            cardId: tid,
                            destination: 'sideboard',
                            sourceZone: 'library'
                        });
                    });
                });
            } else if (clickedZone === 'sideboard') {
                this._addOption(`メインデッキへ (To Main) ${targets.length > 1 ? `(${targets.length})` : ''}`, () => {
                    targets.forEach(tid => {
                        this.store.dispatch('MOVE_CARD', {
                            playerId: playerId,
                            cardId: tid,
                            destination: 'library',
                            sourceZone: 'sideboard'
                        });
                    });
                });
            }

        }, true);

        document.body.appendChild(this.element);

        // Close menu if clicked outside
        const outsideClickListener = (event) => {
            if (this.element && !this.element.contains(event.target)) {
                this.element.remove();
                document.removeEventListener('click', outsideClickListener);
            }
        };
        document.addEventListener('click', outsideClickListener);
    }

    _addOption(label, onClick, keepOpen = false) {
        const item = document.createElement('div');
        item.textContent = label;
        item.style.cssText = `
            padding: 0.8rem 1.5rem; cursor: pointer; color: white;
            transition: background 0.2s; font-size: 0.9rem;
        `;
        item.onmouseover = () => {
            item.style.background = 'rgba(0, 255, 100, 0.2)';
            item.style.color = 'var(--neon-green)';
        };
        item.onmouseout = () => {
            item.style.background = 'transparent';
            item.style.color = 'white';
        };
        item.onclick = (e) => {
            if (e) e.stopPropagation();
            onClick(e);
            if (!keepOpen) this.element.remove();
        };
        this.element.appendChild(item);
    }
}
