import { ScryfallAPI } from '../api.js';
import { generateId } from '../utils.js';

export class ImportDeckModal {
    constructor(store, playerId, onComplete = null) {
        this.store = store;
        this.playerId = playerId;
        this.onComplete = onComplete;
        this.element = null;
        this.isProcessing = false;
        this.log = [];
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9500;
        `;

        this.element.innerHTML = `
            <div class="import-modal-content" style="
                background: rgba(10, 10, 20, 0.95); 
                padding: 2rem; 
                border-radius: 8px; 
                width: 600px; 
                max-width: 90%; 
                max-height: 90vh; 
                display: flex; 
                flex-direction: column; 
                gap: 1rem; 
                color: white; 
                border: 1px solid var(--neon-blue); 
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); 
                backdrop-filter: blur(10px);
            ">
                <h3 style="margin: 0; text-align: center; color: var(--neon-blue); text-transform: uppercase;">Import Deck List</h3>
                <p style="color: #ccc; font-size: 0.9rem; text-align: center; margin: 0;">
                    Format: <span style="font-family: monospace; background: #333; padding: 2px 4px;">Count CardName</span><br>
                    Example: <span style="font-family: monospace;">4 Lightning Bolt</span> or <span style="font-family: monospace;">1 稲妻</span>
                </p>
                
                <textarea id="import-text" placeholder="Paste your deck list here..." style="
                    width: 100%; height: 200px; background: #222; color: white; border: 1px solid #555; 
                    padding: 1rem; border-radius: 4px; resize: vertical; font-family: monospace;
                    min-height: 150px;
                "></textarea>

                <div id="import-log" style="
                    background: #111; color: #888; font-family: monospace; font-size: 0.8rem; 
                    padding: 0.5rem; height: 100px; overflow-y: auto; border: 1px solid #333; 
                    border-radius: 4px; display: none;
                "></div>

                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button id="btn-cancel" style="
                        padding: 0.8rem 2rem; background: transparent; color: #888; 
                        border: 1px solid #555; cursor: pointer; border-radius: 4px;
                        text-transform: uppercase; font-weight: bold;
                    ">Cancel</button>
                    <button id="btn-do" style="
                        padding: 0.8rem 2rem; background: var(--neon-blue); color: black; 
                        border: none; cursor: pointer; border-radius: 4px;
                        text-transform: uppercase; font-weight: bold;
                        box-shadow: 0 0 10px rgba(0,243,255,0.4);
                    ">Do Import</button>
                </div>
            </div>
        `;

        this.element.querySelector('#btn-cancel').onclick = () => {
            if (!this.isProcessing) this.close();
        };

        this.element.querySelector('#btn-do').onclick = () => this.startImport();

        this.element.onclick = (e) => {
            if (e.target === this.element && !this.isProcessing) this.close();
        };

        return this.element;
    }

    async startImport() {
        if (this.isProcessing) return;

        const text = this.element.querySelector('#import-text').value;
        if (!text.trim()) return;

        this.isProcessing = true;
        const doBtn = this.element.querySelector('#btn-do');
        const cancelBtn = this.element.querySelector('#btn-cancel');
        const logDiv = this.element.querySelector('#import-log');

        doBtn.disabled = true;
        doBtn.textContent = 'Processing...';
        doBtn.style.opacity = '0.5';
        doBtn.style.cursor = 'wait';

        cancelBtn.style.display = 'none';
        logDiv.style.display = 'block';

        const lines = text.split('\n').filter(l => l.trim().length > 0);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Regex handles "4 Name", "4x Name", "4 Name (Set) #123" (Name part takes rest)
            const match = line.match(/^(\d+)\s+(?:x\s*)?(.+)$/);

            if (!match) {
                this.addLog(`⚠️ Skipping invalid line: "${line}"`, 'orange');
                failCount++;
                continue;
            }

            const count = parseInt(match[1]);
            const name = match[2].trim();

            this.addLog(`🔍 Searching: ${name}...`);

            try {
                // Determine if we should query exact or not. 
                // ScryfallAPI.searchCards does a general search.
                // We'll use strict search syntax if possible or just use the name.
                // Using `!"name"` forces exact name search which is safer for imports.
                const query = `!"${name}"`;
                const results = await ScryfallAPI.searchCards(query);

                if (results && results.length > 0) {
                    // Results are already sorted by JP priority if available
                    const cardData = results[0];
                    this.addLog(`✅ Found: ${cardData.name} (${cardData.set})`, 'var(--neon-green)');

                    // Add 'count' times
                    for (let c = 0; c < count; c++) {
                        this.store.dispatch('ADD_CARD_TO_DECK', {
                            playerId: this.playerId,
                            card: {
                                ...cardData,
                                id: generateId(),
                                instanceId: generateId(),
                                tapped: false,
                                counters: {},
                                x: 0, y: 0
                            }
                        });
                    }
                    successCount++;
                } else {
                    // Fallback: Try loose search if exact failed
                    const looseResults = await ScryfallAPI.searchCards(name);
                    if (looseResults && looseResults.length > 0) {
                        const cardData = looseResults[0];
                        this.addLog(`⚠️ Loose Found: ${cardData.name} (${cardData.set})`, 'yellow');
                        for (let c = 0; c < count; c++) {
                            this.store.dispatch('ADD_CARD_TO_DECK', {
                                playerId: this.playerId,
                                card: {
                                    ...cardData,
                                    id: generateId(),
                                    instanceId: generateId(),
                                    tapped: false,
                                    counters: {},
                                    x: 0, y: 0
                                }
                            });
                        }
                        successCount++;
                    } else {
                        this.addLog(`❌ Not Found: ${name}`, 'red');
                        failCount++;
                    }
                }
            } catch (e) {
                this.addLog(`❌ Error: ${name}`, 'red');
                failCount++;
            }

            // Rate limit delay
            await new Promise(r => setTimeout(r, 100));
            // Scroll log
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        this.addLog(`🏁 Done! Success: ${successCount}, Failed: ${failCount}`, 'white');
        doBtn.textContent = 'Close';
        doBtn.style.opacity = '1';
        doBtn.style.cursor = 'pointer';
        doBtn.disabled = false;
        doBtn.onclick = () => this.close();
    }

    addLog(msg, color = '#888') {
        const div = document.createElement('div');
        div.textContent = msg;
        div.style.color = color;
        this.element.querySelector('#import-log').appendChild(div);
    }

    close() {
        this.element.remove();
        if (this.onComplete) this.onComplete();
    }
}
