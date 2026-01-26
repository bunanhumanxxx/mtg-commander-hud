import { ScryfallAPI } from '../api.js';
import { debounce } from '../utils.js';


export class SetupModal {
    constructor(store) {
        this.store = store;
        this.element = null;
        this.players = [];
        this.loadedDecks = {}; // Track loaded decks by index (1-based from UI loop, but let's use carefully)
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal-content">
                <h2 style="margin-bottom: 2rem; color: var(--neon-blue); text-align: center; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 10px var(--neon-blue);">Game Setup</h2>
                
                <div class="form-group">
                    <label>Number of Players</label>
                    <select id="player-count" class="hud-select">
                        <option value="2">2 Players</option>
                        <option value="3">3 Players</option>
                        <option value="4" selected>4 Players</option>
                    </select>
                </div>

                <div class="form-group" style="margin-top: 1rem;">
                    <label class="hud-checkbox-container">
                        <input type="checkbox" id="manual-turn-check">
                        <span class="hud-checkbox-mark"></span>
                        Manual Turn Order
                    </label>
                    <small style="color: #888; display: block; margin-top: 0.5rem;">If checked, 1st(TL) -> 2nd(TR) -> 3rd(BL) -> 4th(BR). Unchecked = Random.</small>
                </div>

                <div id="players-config"></div>
                
                <div class="form-actions" style="margin-top: 2rem; text-align: center; display: flex; flex-direction: column; gap: 1rem;">
                    <button id="start-game-confirm" class="hud-btn-primary" style="width: 100%;">Start Game</button>
                    <button id="btn-cancel" style="background: transparent; border: none; color: #666; cursor: pointer; text-decoration: underline;">Back to Menu</button>
                </div>
            </div>
        `;

        // Styles for modal
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000;
            backdrop-filter: blur(5px);
        `;

        const content = this.element.querySelector('.modal-content');
        content.style.cssText = `
            background: rgba(10, 10, 20, 0.95); 
            padding: 2rem; 
            border-radius: 8px; 
            width: 80%; 
            max-width: 800px; 
            max-height: 90vh; 
            overflow-y: auto; 
            color: white;
            border: 1px solid var(--neon-blue);
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);
        `;

        // Listeners
        const countSelect = this.element.querySelector('#player-count');
        const manualCheck = this.element.querySelector('#manual-turn-check');

        countSelect.addEventListener('change', (e) => this.renderPlayerConfig(parseInt(e.target.value)));

        manualCheck.addEventListener('change', (e) => {
            this.manualTurnOrder = e.target.checked;
            this.renderPlayerConfig(parseInt(countSelect.value));
        });

        this.element.querySelector('#start-game-confirm').addEventListener('click', () => this.handleStart());

        this.element.querySelector('#btn-cancel').onclick = () => {
            this.element.remove();
        };

        // Initial render
        this.manualTurnOrder = false;
        this.renderPlayerConfig(4);

        return this.element;
    }

    renderPlayerConfig(count) {
        const container = this.element.querySelector('#players-config');
        container.innerHTML = '';

        for (let i = 1; i <= count; i++) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-setup-row';
            playerDiv.dataset.originalId = i; // Keep track of original creation order
            playerDiv.style.cssText = 'border: 1px solid #444; padding: 1rem; margin: 1rem 0; border-radius: 4px; background: rgba(255,255,255,0.03);';

            let turnOrderInput = '';
            if (this.manualTurnOrder) {
                let options = '<option value="" selected disabled>Select...</option>';
                const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th']; // Basic support
                for (let k = 1; k <= count; k++) {
                    options += `<option value="${k}">${ordinals[k - 1] || k}</option>`;
                }
                turnOrderInput = `
                    <div style="margin-left: 1rem;">
                        <label>Turn</label>
                        <select class="p-turn-order hud-select" style="padding: 0.3rem 1.5rem 0.3rem 0.6rem;">
                            ${options}
                        </select>
                    </div>
                `;
            }

            // Load logic display
            const loaded = this.loadedDecks[i];
            const commanderText = loaded && loaded.commanders ?
                loaded.commanders.map(c => c.name).join(' & ') : '';
            if (loaded) console.log(`Rendering player ${i} with loaded deck:`, loaded.name);

            playerDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap: 1rem;">
                        <h3 style="color: var(--neon-blue); margin:0;">Player ${i}</h3>
                        ${turnOrderInput}
                        <button class="load-deck-btn" style="
                            background: #333; color: #ccc; border: 1px solid #555; padding: 2px 8px; font-size: 0.8rem; cursor: pointer; border-radius: 4px;
                        ">📂 Load Deck JSON</button>
                        <input type="file" class="deck-file-input" accept=".json" style="display:none;">
                        <span class="deck-status" style="font-size: 0.8rem; color: #4CAF50;">${commanderText}</span>
                    </div>
                    <label class="hud-checkbox-container partner-check-label">
                        <input type="checkbox" class="partner-check">
                        <span class="hud-checkbox-mark"></span>
                        Partner
                    </label>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div>
                        <label>Name</label>
                        <input type="text" class="p-name" value="${loaded && loaded.name ? loaded.name : `Player ${i}`}" style="width: 100%; padding: 0.5rem; background: #333; color: white; border: 1px solid #555;">
                    </div>
                    <div>
                        <label>Life</label>
                        <input type="number" class="p-life" value="40" style="width: 100%; padding: 0.5rem; background: #333; color: white; border: 1px solid #555;">
                    </div>
                    <div>
                        <label>Mulligans</label>
                        <input type="number" class="p-mulligan" value="0" min="0" max="7" style="width: 100%; padding: 0.5rem; background: #333; color: white; border: 1px solid #555;">
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <label>Commander 1</label>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem;">
                        <button class="p-commander-btn" data-slot="0" style="padding: 0.5rem 1rem; cursor: pointer; background: #444; border: 1px solid #666; color: white;">+ Commander</button>
                        <div class="commander-preview-info" data-slot="0" style="display: flex; align-items: center; gap: 1rem;">
                            <span class="preview-text" style="color: #888;">None</span>
                            <div class="preview-img-container"></div>
                        </div>
                    </div>
                    <input type="hidden" class="p-commander-data-0">

                    <div class="partner-section hidden" style="margin-top: 1rem; border-top: 1px dashed #444; padding-top: 0.5rem;">
                        <label>Commander 2 (Partner)</label>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem;">
                            <button class="p-commander-btn" data-slot="1" style="padding: 0.5rem 1rem; cursor: pointer; background: #444; border: 1px solid #666; color: white;">+ Partner</button>
                            <div class="commander-preview-info" data-slot="1" style="display: flex; align-items: center; gap: 1rem;">
                                <span class="preview-text" style="color: #888;">None</span>
                                <div class="preview-img-container"></div>
                            </div>
                        </div>
                        <input type="hidden" class="p-commander-data-1">
                    </div>
                </div>
            `;

            // Partner Toggle
            const partnerCheck = playerDiv.querySelector('.partner-check');
            const partnerSection = playerDiv.querySelector('.partner-section');
            partnerCheck.addEventListener('change', (e) => {
                if (e.target.checked) partnerSection.classList.remove('hidden');
                else partnerSection.classList.add('hidden');
            });

            // JSON Loader Logic
            const loadBtn = playerDiv.querySelector('.load-deck-btn');
            const fileInput = playerDiv.querySelector('.deck-file-input');
            const deckStatus = playerDiv.querySelector('.deck-status');

            loadBtn.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const deckData = JSON.parse(evt.target.result);
                        this.loadedDecks[i] = deckData;

                        // Update UI
                        const cmdNames = (deckData.commanders || []).map(c => c.name).join(' & ');
                        deckStatus.textContent = cmdNames || 'Loaded (No Commanders)';

                        // Name
                        if (deckData.name) {
                            playerDiv.querySelector('.p-name').value = deckData.name;
                        }

                        // Commanders
                        if (deckData.commanders && deckData.commanders.length > 0) {
                            // Slot 0
                            const c1 = deckData.commanders[0];
                            this._updateCommanderSlot(playerDiv, 0, c1);

                            // Slot 1
                            if (deckData.commanders.length > 1) {
                                const c2 = deckData.commanders[1];
                                partnerCheck.checked = true;
                                partnerSection.classList.remove('hidden');
                                this._updateCommanderSlot(playerDiv, 1, c2);
                            } else {
                                partnerCheck.checked = false;
                                partnerSection.classList.add('hidden');
                                // Clear slot 1? optional
                            }
                        }

                    } catch (err) {
                        console.error('JSON Error', err);
                        alert('Invalid Deck JSON');
                    }
                }
                reader.readAsText(file);
            };

            // Pre-fill if re-rendering from loaded (though loop just re-creates)
            if (loaded && loaded.commanders) {
                if (loaded.commanders[0]) this._updateCommanderSlot(playerDiv, 0, loaded.commanders[0]);
                if (loaded.commanders.length > 1) {
                    partnerCheck.checked = true;
                    partnerSection.classList.remove('hidden');
                    this._updateCommanderSlot(playerDiv, 1, loaded.commanders[1]);
                }
            }

            // Commander Selectors (Manual)
            playerDiv.querySelectorAll('.p-commander-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const slot = e.target.dataset.slot;
                    const hiddenInput = playerDiv.querySelector(`.p-commander-data-${slot}`);

                    import('./CardSearchModal.js?v=' + Date.now()).then(({ CardSearchModal }) => {
                        const modal = new CardSearchModal(this.store, null, (card) => {
                            this._updateCommanderSlot(playerDiv, slot, card);

                            // Update local loadedDecks tracking if mixed manual/auto?
                            // Ideally stick to DOM state unless we want persistent state
                        });
                        document.body.appendChild(modal.render());
                    });
                });
            });

            container.appendChild(playerDiv);
        }

        // Add Unique Selection Logic if manual
        if (this.manualTurnOrder) {
            const selects = container.querySelectorAll('.p-turn-order');

            const updateTurnSelects = () => {
                const selectedValues = Array.from(selects)
                    .map(s => s.value)
                    .filter(v => v); // Filter out empty strings

                selects.forEach(select => {
                    const currentVal = select.value;
                    Array.from(select.options).forEach(option => {
                        if (!option.value) return; // Skip default/empty
                        if (selectedValues.includes(option.value) && option.value !== currentVal) {
                            option.disabled = true;
                        } else {
                            option.disabled = false;
                        }
                    });
                });
            };

            selects.forEach(s => {
                s.addEventListener('change', updateTurnSelects);
            });
            updateTurnSelects();
        }
    }

    _updateCommanderSlot(playerDiv, slot, card) {
        const previewRow = playerDiv.querySelector(`.commander-preview-info[data-slot="${slot}"]`);
        const previewText = previewRow.querySelector('.preview-text');
        const previewImgContainer = previewRow.querySelector('.preview-img-container');
        const hiddenInput = playerDiv.querySelector(`.p-commander-data-${slot}`);

        hiddenInput.value = JSON.stringify(card);
        previewText.textContent = card.name;
        previewText.style.color = '#fff';
        if (card.image_url) {
            previewImgContainer.style.flexShrink = '0';
            previewImgContainer.innerHTML = `<img src="${card.image_url}" style="height: 60px; max-width: 100px; border-radius: 4px; object-fit: contain; display: block;">`;
        } else {
            previewImgContainer.innerHTML = '<span style="font-size:0.8rem">No Image</span>';
        }
    }

    handleStart() {
        const rows = Array.from(this.element.querySelectorAll('.player-setup-row'));
        let players = [];

        // Validation first if manual
        if (this.manualTurnOrder) {
            let selectedOrders = [];
            for (const row of rows) {
                const val = row.querySelector('.p-turn-order').value;
                if (!val) {
                    alert('Please select a turn order for all players.');
                    return;
                }
                selectedOrders.push(parseInt(val));
            }

            const uniqueOrders = new Set(selectedOrders);
            if (uniqueOrders.size !== rows.length) {
                alert('Duplicate turn orders detected. Please assign unique turn numbers.');
                return;
            }
        }

        rows.forEach((row, index) => {
            const name = row.querySelector('.p-name').value;
            const life = parseInt(row.querySelector('.p-life').value);
            const mulligan = parseInt(row.querySelector('.p-mulligan').value);
            const cmd0Str = row.querySelector('.p-commander-data-0').value;
            const cmd1Str = row.querySelector('.p-commander-data-1').value;
            const isPartner = row.querySelector('.partner-check').checked;

            // Turn Order Handling
            let sortOrder = 0;
            if (this.manualTurnOrder) {
                sortOrder = parseInt(row.querySelector('.p-turn-order').value);
            }

            const commanders = [];
            if (cmd0Str) commanders.push(JSON.parse(cmd0Str));
            if (isPartner && cmd1Str) commanders.push(JSON.parse(cmd1Str));

            // Retrieve Loaded Deck Library if available
            // Row dataset or loadedDecks map
            // We tracked loadedDecks by index 'i' (1-based), but rows loop is 0-based.
            // The row dataset.originalId = i.
            const originalId = parseInt(row.dataset.originalId);
            const loaded = this.loadedDecks[originalId];

            let initialLibrary = null;
            if (loaded && loaded.library) {
                initialLibrary = loaded.library;
            }

            players.push({
                name,
                life,
                mulliganCount: mulligan,
                commanders: commanders,
                isPartner: isPartner,
                _sortOrder: sortOrder,
                initialLibrary: initialLibrary // Pass lib
            });
        });

        if (this.manualTurnOrder) {
            players.sort((a, b) => a._sortOrder - b._sortOrder);
        }

        players.forEach(p => delete p._sortOrder);

        // --- Transition Sequence ---
        this.element.querySelector('.modal-content').classList.add('modal-exit-anim');
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        document.body.appendChild(overlay);

        setTimeout(() => {
            this.store.dispatch('INIT_GAME', {
                players: players,
                options: { randomizeTurnOrder: !this.manualTurnOrder }
            });
            this.element.remove();
            setTimeout(() => overlay.remove(), 200);
        }, 800);
    }
}
