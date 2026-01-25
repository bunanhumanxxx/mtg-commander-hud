import { renderCard } from './Card.js';

export class DeckBuilderApp {
    constructor(store) {
        this.store = store;
        this.element = null;
        this.unsubscribe = null;
        this.currentView = 'main'; // 'main' or 'sideboard'
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'deck-builder-app';
        this.element.style.cssText = `
            width: 100%; height: 100vh; display: flex; flex-direction: column;
            background: #111; color: white;
        `;

        // Create Container
        this.element.innerHTML = `
            <header style="
                padding: 1rem 2rem; background: #000; border-bottom: 2px solid var(--neon-green);
                display: flex; justify-content: space-between; align-items: center;
                box-shadow: 0 0 20px rgba(0, 255, 100, 0.2);
                overflow-x: auto; white-space: nowrap; gap: 2rem;
            ">
                <div style="display:flex; align-items:center; gap: 1rem; flex-shrink: 0;">
                    <h2 style="color: var(--neon-green); margin: 0; text-transform: uppercase; font-size: 1.5rem; text-shadow: 0 0 5px var(--neon-green);">Deck Builder</h2>
                    <input type="text" id="deck-name-input" value="My Deck" style="
                        background: #222; border: 1px solid #555; border-radius: 4px; color: white;
                        font-size: 1.2rem; padding: 0.5rem; width: 250px; text-align: center;
                    ">
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #ccc; cursor: pointer;">
                        <input type="checkbox" id="check-partner"> Partner Commander
                    </label>
                </div>
                
                <div style="display: flex; gap: 1rem; align-items: center; flex-shrink: 0;">
                    <div style="background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #444;">
                         <span id="card-count" style="color: white; font-family: monospace; font-size: 1.2rem; font-weight: bold;">0 Cards</span>
                    </div>
                    <button id="btn-hand" style="
                        padding: 0.8rem 2rem; background: #9C27B0; border: none;
                        color: white; cursor: pointer; text-transform: uppercase; font-weight: bold; border-radius: 4px;
                        font-size: 1rem; box-shadow: 0 0 10px rgba(156, 39, 176, 0.4);
                    ">HAND</button>
                    <button id="btn-import" style="
                        padding: 0.8rem 2rem; background: #2196F3; border: none;
                        color: white; cursor: pointer; text-transform: uppercase; font-weight: bold; border-radius: 4px;
                        font-size: 1rem; box-shadow: 0 0 10px rgba(33, 150, 243, 0.4);
                    ">IMPORT</button>
                    <button id="btn-save" style="
                        padding: 0.8rem 2rem; background: var(--neon-green); border: none;
                        color: black; cursor: pointer; text-transform: uppercase; font-weight: bold; border-radius: 4px;
                        font-size: 1rem; box-shadow: 0 0 10px rgba(0,255,100,0.4);
                    ">Save JSON</button>
                    <button id="btn-exit" style="
                        padding: 0.8rem 2rem; background: #333; border: 1px solid #666;
                        color: white; cursor: pointer; text-transform: uppercase; border-radius: 4px;
                        font-size: 1rem;
                    ">Exit</button>
                </div>
            </header>

            <div class="builder-body" style="flex: 1; display: flex; overflow: hidden;">
                <!-- Single Main Pane -->
                <div class="main-deck-pane" style="flex: 1; display: flex; flex-direction: column; background: #1a1a1a; min-width: 0;">
                    <div class="toolbar" style="padding: 1.5rem; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; background: #111; overflow-x: auto; white-space: nowrap; gap: 2rem;">
                        
                        <!-- View Switcher -->
                        <select id="view-select" style="
                            padding: 0.5rem 1rem; background: #222; color: white; border: 1px solid var(--neon-green);
                            font-size: 1.2rem; border-radius: 4px; cursor: pointer; flex-shrink: 0;
                        ">
                            <option value="main">Main Deck</option>
                            <option value="sideboard">Candidates (Sideboard)</option>
                        </select>
                        
                        <!-- Stats Bar -->
                        <div id="deck-stats" style="
                            display: flex; gap: 1rem; font-size: 0.9rem; color: #888; 
                            background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #333;
                            flex-shrink: 0;
                        ">
                            <!-- Stats injected here -->
                        </div>

                        <div style="display:flex; gap: 0.5rem; flex-shrink: 0;">
                            <!-- SELECT Button -->
                            <button id="btn-select-mode" style="
                                padding: 0.5rem 1.5rem; background: #333; color: white; border: 1px solid #555;
                                cursor: pointer; border-radius: 4px; font-size: 1rem; transition: all 0.2s;
                            ">
                                SELECT
                            </button>

                            <button id="btn-add-card" style="
                                padding: 1rem 2rem; background: transparent; color: var(--neon-green); border: 2px solid var(--neon-green);
                                cursor: pointer; font-weight: bold; border-radius: 50px; font-size: 1.2rem;
                                display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
                            " onmouseover="this.style.background='var(--neon-green)'; this.style.color='black';"
                              onmouseout="this.style.background='transparent'; this.style.color='var(--neon-green)';">
                                <span style="font-size:1.5rem; line-height: 0;">+</span> ADD CARD
                            </button>
                        </div>
                    </div>
                    <div id="deck-grid" style="
                        flex: 1; overflow-y: auto; padding: 2rem;
                        display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.2rem;
                    ">
                        <!-- Cards -->
                    </div>
                </div>
            </div>
        `;

        // Bind Events
        this.element.querySelector('#btn-exit').onclick = () => {
            if (confirm('Exit Deck Builder? Unsaved changes will be lost.')) {
                location.reload(); // Simple way to go back to start
            }
        };

        this.element.querySelector('#btn-save').onclick = () => this._saveDeck();

        this.element.querySelector('#btn-import').onclick = () => {
            const player = this.store.getState().players[0];
            import('./ImportDeckModal.js?v=' + Date.now()).then(({ ImportDeckModal }) => {
                const modal = new ImportDeckModal(this.store, player.id, () => this._update());
                document.body.appendChild(modal.render());
            });
        };

        this.element.querySelector('#btn-hand').onclick = () => {
            const player = this.store.getState().players[0];
            import('./HandSimulatorModal.js?v=' + Date.now()).then(({ HandSimulatorModal }) => {
                const modal = new HandSimulatorModal(this.store, player.id);
                document.body.appendChild(modal.render());
            });
        };

        this.element.querySelector('#btn-add-card').onclick = () => {
            const player = this.store.getState().players[0]; // Builder is player 0
            import('./CardSearchModal.js?v=' + Date.now()).then(({ CardSearchModal }) => {
                // Pass custom callback instead of auto-add to board
                const modal = new CardSearchModal(this.store, player.id, (card) => {
                    this.store.dispatch('ADD_CARD_TO_DECK', { playerId: player.id, card });
                });
                document.body.appendChild(modal.render());
            });
        };

        const selectBtn = this.element.querySelector('#btn-select-mode');
        selectBtn.onclick = () => {
            this.store.dispatch('TOGGLE_SELECTION_MODE');
        };

        this.element.querySelector('#view-select').onchange = (e) => {
            this.currentView = e.target.value;
            this._update();
        };

        this.element.querySelector('#deck-name-input').addEventListener('change', (e) => {
            // We should probably sync this to store or just keep it in DOM for save
        });

        // Initialize with current state
        this._update();
        this.unsubscribe = this.store.subscribe(() => this._update());

        return this.element;
    }

    _update() {
        const state = this.store.getState();
        const player = state.players[0];
        if (!player) return;

        // Update Header
        const deckNameInput = this.element.querySelector('#deck-name-input');
        if (player.name !== 'Deck Builder' && deckNameInput.value === 'My Deck') {
            deckNameInput.value = player.name;
        }

        // Update Select Button
        const selectBtn = this.element.querySelector('#btn-select-mode');
        if (selectBtn) {
            if (state.ui.selectionMode) {
                selectBtn.style.background = 'var(--neon-green)';
                selectBtn.style.color = 'black';
                selectBtn.style.boxShadow = '0 0 10px var(--neon-green)';
            } else {
                selectBtn.style.background = '#333';
                selectBtn.style.color = 'white';
                selectBtn.style.boxShadow = 'none';
            }
        }

        const library = state.zones[player.id].library || [];
        const sideboard = state.zones[player.id].sideboard || [];

        // Count depends on view? Or always main?
        // Let's show currently viewed count
        const currentList = this.currentView === 'main' ? library : sideboard;
        this.element.querySelector('#card-count').textContent = `${currentList.length} Cards`;

        // Ensure dropdown matches state (incase of re-render)
        this.element.querySelector('#view-select').value = this.currentView;

        // Render Grid
        const deckGrid = this.element.querySelector('#deck-grid');
        deckGrid.innerHTML = '';

        // Grouping Logic
        const groups = {
            'Commander': [],
            'Creature': [],
            'Planeswalker': [],
            'Instant': [],
            'Sorcery': [],
            'Artifact': [],
            'Enchantment': [],
            'Land': [],
            'Other': []
        };

        const getGroupKey = (card) => {
            if (card.isCommander) return 'Commander';
            const t = (card.type_line || '').toLowerCase();
            if (t.includes('creature') || t.includes('クリーチャー')) return 'Creature';
            if (t.includes('planeswalker') || t.includes('プレインズウォーカー')) return 'Planeswalker';
            if (t.includes('instant') || t.includes('インスタント')) return 'Instant';
            if (t.includes('sorcery') || t.includes('ソーサリー')) return 'Sorcery';
            if (t.includes('artifact') || t.includes('アーティファクト')) return 'Artifact';
            if (t.includes('enchantment') || t.includes('エンチャント')) return 'Enchantment';
            if (t.includes('land') || t.includes('土地')) return 'Land';
            return 'Other';
        };

        // Distribute to groups
        currentList.forEach(card => {
            const key = getGroupKey(card);
            groups[key].push(card);
        });

        // Add Total Header
        const totalHeader = document.createElement('div');
        totalHeader.textContent = `Total: ${currentList.length} Cards`;
        totalHeader.style.cssText = `
            grid-column: 1 / -1;
            background: rgba(0, 255, 100, 0.1); color: var(--neon-green);
            padding: 0.5rem 1rem; margin-bottom: 0.5rem;
            border: 1px solid var(--neon-green); border-radius: 4px;
            font-weight: bold; text-transform: uppercase;
            font-size: 1rem; letter-spacing: 1px; text-align: center;
        `;
        deckGrid.appendChild(totalHeader);

        // Render Groups
        Object.keys(groups).forEach(key => {
            const groupCards = groups[key];
            if (groupCards.length === 0) return;

            // Sort by Name within group
            groupCards.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            // Section Header
            const header = document.createElement('div');
            header.textContent = `${key} (${groupCards.length})`;
            header.style.cssText = `
                grid-column: 1 / -1;
                background: #222; color: var(--neon-green);
                padding: 0.2rem 1rem; margin-top: 0.8rem; margin-bottom: 0.2rem;
                border-bottom: 1px solid #444; font-weight: bold; text-transform: uppercase;
                font-size: 0.85rem; letter-spacing: 1px;
            `;
            // First item margin fix
            if (deckGrid.children.length === 0) header.style.marginTop = '0';

            deckGrid.appendChild(header);

            // Render Cards
            groupCards.forEach(card => {
                const el = renderCard(card, this.store, player.id);
                // Force responsive size for grid
                el.style.width = '100%';
                el.style.height = 'auto';
                el.style.aspectRatio = '2.5/3.5';

                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.appendChild(el);

                // Add Commander Badge in Grid if marked
                if (card.isCommander) {
                    const cmdBadge = document.createElement('div');
                    cmdBadge.innerText = 'CMDR';
                    cmdBadge.style.cssText = `
                        position: absolute; bottom: 0; left: 0; right: 0;
                        background: rgba(255, 215, 0, 0.8); color: black; font-weight: bold;
                        text-align: center; font-size: 0.8rem; pointer-events: none;
                        text-shadow: 0 0 2px white;
                    `;
                    wrapper.appendChild(cmdBadge);
                    el.style.border = '2px solid gold';
                }

                deckGrid.appendChild(wrapper);
            });
        });

        // Always show main deck stats for now? Or switch?
        // Let's show stats for the VIEWED list.
        this._updateStats(currentList);
    }

    _updateStats(library) {
        const statsEl = this.element.querySelector('#deck-stats');
        if (!statsEl) return;

        // Note: MOVE_CARD logic for library currently adds to grave. That's fine for "removing" from deck list.
        // Simple logic: A card can be multiple types (Artifact Creature), so prioritize or count both?
        // "translateType" above returns first match.
        // Requirement says "count card types".
        // Artifact Creature should probably count as Creature primarily, or both?
        // Usually deck stats show breakdown.
        // Let's count ALL matches for accuracy if user wants to see "Artifacts: 5, Creatures: 20".
        // But if sum > total cards, it might be confusing.
        // Let's stick to primary type classification for simplest view: Land > Creature > PW > Instant/Sorcery > Artifact > Enchantment.
        // Actually, standard is: Land, Creature, Non-Creature Spells.
        // Re-calculate strictly allowing multiples?
        // Let's do a multi-check for better stats.
        const multiCounts = {
            'クリーチャー': 0,
            '土地': 0,
            'ソーサリー/インスタント': 0,
            'アーティファクト': 0,
            'エンチャント': 0,
            'PW': 0
        };

        library.forEach(card => {
            const t = (card.type_line || '').toLowerCase();
            if (t.includes('creature') || t.includes('クリーチャー')) multiCounts['クリーチャー']++;
            if (t.includes('land') || t.includes('土地')) multiCounts['土地']++;
            if (t.includes('instant') || t.includes('sorcery') || t.includes('インスタント') || t.includes('ソーサリー')) multiCounts['ソーサリー/インスタント']++;
            if (t.includes('artifact') || t.includes('アーティファクト')) multiCounts['アーティファクト']++;
            if (t.includes('enchantment') || t.includes('エンチャント')) multiCounts['エンチャント']++;
            if (t.includes('planeswalker') || t.includes('プレインズウォーカー')) multiCounts['PW']++;
        });

        // Generate HTML
        // Use icons or colors for better visibility?
        statsEl.innerHTML = Object.entries(multiCounts)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `<span style="margin-right:0.6rem;"><span style="color:#ccc; font-size:0.9em;">${type}:</span> <strong style="color:var(--neon-green); font-size:1.1em; text-shadow:0 0 5px rgba(0,255,100,0.5);">${count}</strong></span>`)
            .join('<span style="color:#333; margin:0 5px;">|</span>');

        if (statsEl.innerHTML === '') statsEl.innerHTML = '<span style="color:#666;">No Cards</span>';
    }

    _saveDeck() {
        const state = this.store.getState();
        const player = state.players[0];
        const deckName = this.element.querySelector('#deck-name-input').value;
        const library = state.zones[player.id].library || [];
        const sideboard = state.zones[player.id].sideboard || [];

        // Separation for Save:
        // Commanders should go to 'commanders' array.
        // Remainder stays in 'library'.
        // BUT user wanted them VISUALLY in list.
        // File format usually separates them.
        const commanders = library.filter(c => c.isCommander);
        const mainDeck = library.filter(c => !c.isCommander);

        const deckData = {
            deckName: deckName,
            commanders: commanders,
            library: mainDeck,
            sideboard: sideboard
        };

        const json = JSON.stringify(deckData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deckName.replace(/\s+/g, '_')}.json`;
        a.click();
    }
}
