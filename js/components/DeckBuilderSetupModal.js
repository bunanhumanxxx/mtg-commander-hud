export class DeckBuilderSetupModal {
    constructor(store) {
        this.store = store;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 1000;
        `;

        this.element.innerHTML = `
            <div class="modal-content" style="
                background: rgba(10, 20, 10, 0.95); 
                padding: 3rem; 
                border-radius: 12px; 
                text-align: center; 
                min-width: 500px; 
                border: 1px solid var(--neon-green);
                box-shadow: 0 0 30px rgba(0, 255, 100, 0.2);
            ">
                <h2 style="color: var(--neon-green); margin-bottom: 2rem; text-transform: uppercase;">Deck Builder</h2>
                
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <button id="btn-new-deck" style="
                        padding: 1rem; background: rgba(0, 255, 100, 0.1); 
                        border: 1px solid var(--neon-green); color: var(--neon-green); font-size: 1.2rem; cursor: pointer;
                        text-transform: uppercase; font-weight: bold; transition: all 0.2s;
                    ">[ NEW DECK ]</button>
                    
                    <div style="position: relative;">
                        <button id="btn-load-trigger" style="
                            padding: 1rem; width: 100%; background: rgba(255, 255, 255, 0.05); 
                            border: 1px solid #666; color: #ccc; font-size: 1.2rem; cursor: pointer;
                            text-transform: uppercase; font-weight: bold; transition: all 0.2s;
                        ">[ LOAD DECK JSON ]</button>
                        <input type="file" id="file-input" accept=".json" style="
                            position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
                        ">
                    </div>

                    <button id="btn-cancel" style="
                        margin-top: 1rem; padding: 0.8rem; background: transparent; 
                        border: none; color: #666; cursor: pointer; text-decoration: underline;
                    ">Back to Menu</button>
                </div>
            </div>
        `;

        // Event Listeners
        this.element.querySelector('#btn-new-deck').addEventListener('click', () => {
            this._startDeckBuilder({
                commanders: [],
                library: [],
                deckName: 'New Deck'
            });
        });

        const fileInput = this.element.querySelector('#file-input');

        // Visual Feedback for File Hover
        const loadBtn = this.element.querySelector('#btn-load-trigger');
        fileInput.addEventListener('mouseenter', () => loadBtn.style.background = 'rgba(255,255,255,0.1)');
        fileInput.addEventListener('mouseleave', () => loadBtn.style.background = 'rgba(255,255,255,0.05)');

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    // Validate basic structure
                    if (!data.library && !data.commanders) {
                        alert('Invalid Deck File');
                        return;
                    }
                    this._startDeckBuilder(data);
                } catch (err) {
                    console.error(err);
                    alert('Failed to parse JSON');
                }
            };
            reader.readAsText(file);
        });

        this.element.querySelector('#btn-cancel').onclick = () => {
            this.element.remove();
        };

        return this.element;
    }

    _startDeckBuilder(deckData) {
        // Init Game with 1 Player "Builder"
        // We will misuse 'INIT_GAME' to set up a dummy state, but DeckBuilderApp might override it or use it.
        // Let's use INIT_GAME to set up the Store correctly with 1 player.

        const builderPlayer = {
            name: deckData.deckName || 'Deck Builder',
            life: 40,
            commanders: deckData.commanders || [],
            // We can preload library into 'library' zone?
            // Store expects 'libraryCount', keeping cards in 'library' zone is handled by INIT logic?
            // No, INIT_GAME creates empty zones usually.
            // We might need a custom action to load deck?
        };

        this.store.dispatch('INIT_GAME', {
            players: [builderPlayer],
            options: { gameMode: 'deck_builder', randomizeTurnOrder: false }
        });

        // If we have library data, we need to populate it.
        // Store doesn't have a 'LOAD_DECK' action yet.
        // We can manually push to state or add action.
        // Let's add AD_HOC_LOAD action or just use ADD_CARD loop? loop is slow.
        // Better: Dispatch 'LOAD_DECK_STATE'
        if (deckData.library && Array.isArray(deckData.library)) {
            // We need to inject these into the player's library zone.
            // But Store.js initial setup puts everything in library? No, it sets count.
            // Wait, Store.js > _initGame logic:
            // "const currentLibrary = deckSize - initialHand;"
            // It doesn't actually populate card objects in zone.library usually (unless simulated?).
            // For Deck Builder, we want REAL objects in library/sideboard zones to view them.

            // Let's handle this in DeckBuilderApp initialization?
            // Or add a store action now.
        }

        // Pass deckData to App via some way? 
        // Store is best.
        // Let's attach an ephemeral property to store or use a new action.
        this.store.dispatch('LOAD_DECK_DATA', {
            playerId: this.store.getState().players[0].id, // The ID generated by INIT_GAME
            library: deckData.library || [],
            sideboard: deckData.sideboard || [],
            commanders: deckData.commanders || []
        });

        this.element.remove();
    }
}
