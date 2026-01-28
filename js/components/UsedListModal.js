export class UsedListModal {
    constructor(store, playerId, zoneType = 'grave') {
        this.store = store;
        this.playerId = playerId;
        this.zoneType = zoneType;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9000;
        `;

        const state = this.store.getState();
        const player = state.players.find(p => p.id === this.playerId);
        const zone = state.zones[this.playerId];

        // dynamic list based on type
        const targetList = zone && zone[this.zoneType] ? zone[this.zoneType] : [];

        // No filter for commanders - if they are here, show them.
        const displayCards = [...targetList].reverse();

        const titleMap = {
            'grave': 'Graveyard',
            'exile': 'Exile Zone'
        };
        const title = titleMap[this.zoneType] || 'Zone';

        const listHtml = displayCards.map((c, index) => {
            const imgHtml = c.image_url
                ? `<img src="${c.image_url}" style="height: 50px; border-radius: 4px; border: 1px solid #444;">`
                : `<div style="width: 36px; height: 50px; background: #222; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; text-align: center; border: 1px dashed #555; color: #888;">?</div>`;

            return `
            <div class="hud-used-card-item used-card-item" data-index="${index}" draggable="true">
                ${imgHtml}
                <div>
                    <div class="card-name">${c.name}</div>
                    <div style="font-size: 0.8rem; color: #888;">${c.type_line || ''}</div>
                </div>
            </div>
            `;
        }).join('');

        this.element.innerHTML = `
            <div class="hud-used-modal" style="
                background: #050a14;
                padding: 1rem;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                display: flex;
                flex-direction: column;
                max-height: 80vh;
                border: 1px solid cyan;
                box-shadow: 0 0 20px cyan;
                color: white;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid cyan; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; color: cyan; text-transform: uppercase; text-shadow: 0 0 5px cyan;">${title} (${targetList.length})</h3>
                    <button class="close-btn" style="
                        background: transparent; 
                        border: 1px solid cyan; 
                        color: cyan; 
                        cursor: pointer; 
                        padding: 0.2rem 0.6rem; 
                        border-radius: 4px;
                        box-shadow: 0 0 5px cyan;
                    ">X</button>
                </div>
                <div class="hud-used-list-container" style="overflow-y: auto; flex: 1;">
                    ${targetList.length > 0 ? listHtml : '<div style="padding: 1rem; text-align: center; color: #666;">Empty</div>'}
                </div>
            </div>
        `;

        this.element.querySelector('.close-btn').onclick = () => this.close();

        const listContainer = this.element.querySelector('.hud-used-list-container');
        if (listContainer) {
            listContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.used-card-item');
                if (item) {
                    const idx = parseInt(item.dataset.index);
                    const card = displayCards[idx];
                    import('./CardDetailModal.js?v=' + Date.now()).then(({ CardDetailModal }) => {
                        const modal = new CardDetailModal(card);
                        document.body.appendChild(modal.render());
                    });
                }
            });

            // Drag Start Delegation
            listContainer.addEventListener('dragstart', (e) => {
                const item = e.target.closest('.used-card-item');
                if (item) {
                    const idx = parseInt(item.dataset.index);
                    const card = displayCards[idx];

                    e.dataTransfer.setData('text/plain', card.instanceId || card.id);
                    e.dataTransfer.setData('application/json', JSON.stringify({
                        cardId: card.instanceId || card.id,
                        sourceZone: this.zoneType,
                        playerId: this.playerId,
                        isCommander: !!card.isCommander
                    }));
                    e.dataTransfer.effectAllowed = 'move';
                    item.style.opacity = '0.5';

                    // Restore opacity on dragend (add listener here or rely on CSS/re-render? Best to add listener)
                    item.addEventListener('dragend', () => item.style.opacity = '1', { once: true });
                }
            });

            listContainer.addEventListener('contextmenu', (e) => {
                const item = e.target.closest('.used-card-item');
                if (item) {
                    e.preventDefault();
                    const idx = parseInt(item.dataset.index);
                    const card = displayCards[idx];
                    import('./ContextMenu.js?v=' + Date.now()).then(({ ContextMenu }) => {
                        const menu = new ContextMenu(this.store);
                        menu.show(e.clientX, e.clientY, 'card', card.instanceId || card.id, this.playerId, {
                            sourceZone: this.zoneType,
                            onActionCompleted: () => this.close()
                        });
                    });
                }
            });
        }

        // Drop on Overlay (Outside Popup) Logic
        this.element.addEventListener('dragenter', (e) => {
            if (e.target === this.element) this.element.classList.add('active-drop-zone');
        });

        this.element.addEventListener('dragleave', (e) => {
            if (e.target === this.element) this.element.classList.remove('active-drop-zone');
        });

        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.target === this.element) {
                e.dataTransfer.dropEffect = 'move';
                if (!this.element.classList.contains('active-drop-zone')) {
                    this.element.classList.add('active-drop-zone');
                }
            } else {
                e.dataTransfer.dropEffect = 'none';
                this.element.classList.remove('active-drop-zone');
            }
        });

        this.element.addEventListener('drop', (e) => {
            e.preventDefault();
            this.element.classList.remove('active-drop-zone');
            // Trigger ONLY if dropped on the background overlay (this.element)
            if (e.target === this.element) {
                try {
                    const raw = e.dataTransfer.getData('application/json');
                    if (raw) {
                        const data = JSON.parse(raw);
                        // Check if it's from current list to avoid weird cross-window drags triggering this specific modal
                        if (data.sourceZone === this.zoneType && data.playerId === this.playerId) {

                            // Find card object
                            const card = targetList.find(c => (c.instanceId || c.id) === data.cardId);
                            if (card) {
                                this.close(); // Close this modal

                                import('./ZoneSelectModal.js').then(({ ZoneSelectModal }) => {
                                    const modal = new ZoneSelectModal(
                                        card.name,
                                        (destination) => {
                                            this.store.dispatch('MOVE_CARD', {
                                                playerId: this.playerId,
                                                cardId: card.instanceId || card.id,
                                                destination: destination,
                                                sourceZone: this.zoneType
                                            });
                                        },
                                        () => { },
                                        { isCommander: card.isCommander }
                                    );
                                    document.body.appendChild(modal.render());
                                });
                            }
                        }
                    }
                } catch (err) { console.error('Drop error in UsedList:', err); }
            }
        });

        this.element.onclick = (e) => {
            if (e.target === this.element) this.close();
        };

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
