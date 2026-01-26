export class RandomizerModal {
    constructor(type) {
        this.type = type; // 'DICE' or 'COIN'
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal-content" style="background: #050a14; border: 1px solid var(--neon-blue); box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); backdrop-filter: blur(10px); color: var(--text-color); max-width: 400px; width: 90%; padding: 2rem; border-radius: 8px; text-align: center;">
                <h2 style="margin-bottom: 1.5rem; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px;">
                    ${this.type === 'DICE' ? '🎲 DICE ROLL' : '🪙 COIN TOSS'}
                </h2>

                <div id="randomizer-controls" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                    ${this.type === 'DICE' ? `
                        <div style="display: flex; gap: 1rem; justify-content: center; align-items: center;">
                            <label>Type:</label>
                            <select id="dice-type" style="background: #222; color: white; border: 1px solid #555; padding: 0.5rem; border-radius: 4px;">
                                <option value="6">D6 (6-sided)</option>
                                <option value="20">D20 (20-sided)</option>
                            </select>
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 1rem; justify-content: center; align-items: center;">
                        <label>Count:</label>
                        <select id="item-count" style="background: #222; color: white; border: 1px solid #555; padding: 0.5rem; border-radius: 4px;">
                            ${[1, 2, 3, 4, 5, 10].map(n => `<option value="${n}">${n}</option>`).join('')}
                        </select>
                    </div>

                    <button id="do-randomize-btn" style="
                        background: rgba(0, 243, 255, 0.1); 
                        border: 1px solid var(--neon-blue); 
                        color: var(--neon-blue); 
                        padding: 0.8rem; 
                        font-size: 1.2rem; 
                        cursor: pointer; 
                        margin-top: 1rem;
                        font-weight: bold;
                        transition: all 0.2s;
                    ">
                        ${this.type === 'DICE' ? 'ROLL DICE' : 'TOSS COIN'}
                    </button>
                </div>

                <div id="result-area" style="
                    min-height: 100px; 
                    background: rgba(0,0,0,0.5); 
                    border: 1px dashed #444; 
                    border-radius: 4px; 
                    padding: 1rem; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                    align-items: center; 
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                ">
                    <span style="color: #666; font-size: 0.9rem;">Ready to randomize...</span>
                </div>

                <div style="text-align: right;">
                    <button id="close-modal" style="background: transparent; border: 1px solid #666; color: #888; padding: 0.5rem 1rem; cursor: pointer;">CLOSE</button>
                </div>
            </div>
        `;

        // Style overrides for modal positioning (if not global)
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; justify-content: center; align-items: center;
            z-index: 3000;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(2px);
        `;

        this.element.querySelector('#close-modal').onclick = () => this.element.remove();
        this.element.querySelector('#do-randomize-btn').onclick = () => this.runRandomizer();

        // Close on outside click
        this.element.onclick = (e) => {
            if (e.target === this.element) this.element.remove();
        };

        return this.element;
    }

    runRandomizer() {
        const count = parseInt(this.element.querySelector('#item-count').value);
        const resultArea = this.element.querySelector('#result-area');

        // Clear previous
        resultArea.innerHTML = '';

        if (this.type === 'DICE') {
            const sides = parseInt(this.element.querySelector('#dice-type').value);
            let total = 0;
            const results = [];

            for (let i = 0; i < count; i++) {
                const val = Math.floor(Math.random() * sides) + 1;
                results.push(val);
                total += val;
            }

            // Display Results
            const resContainer = document.createElement('div');
            resContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;';

            results.forEach(r => {
                const die = document.createElement('div');
                die.textContent = r;
                die.style.cssText = `
                    width: 40px; height: 40px; 
                    display: flex; justify-content: center; align-items: center; 
                    border: 2px solid ${r === sides ? 'gold' : (r === 1 ? 'red' : 'var(--neon-blue)')};
                    color: ${r === sides ? 'gold' : (r === 1 ? 'red' : 'white')};
                    font-weight: bold; font-size: 1.2rem; 
                    border-radius: ${sides === 6 ? '4px' : '50%'};
                    background: rgba(255,255,255,0.05);
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                `;
                resContainer.appendChild(die);
            });

            const totalEl = document.createElement('div');
            totalEl.style.cssText = 'margin-top: 10px; font-size: 1.5rem; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue);';
            totalEl.innerHTML = `TOTAL: <strong>${total}</strong>`;

            resultArea.appendChild(resContainer);
            resultArea.appendChild(totalEl);

        } else if (this.type === 'COIN') {
            let heads = 0;
            let tails = 0;
            const resContainer = document.createElement('div');
            resContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;';

            for (let i = 0; i < count; i++) {
                const isHeads = Math.random() < 0.5;
                if (isHeads) heads++; else tails++;

                const coin = document.createElement('div');
                coin.textContent = isHeads ? 'H' : 'T';
                coin.title = isHeads ? 'Heads' : 'Tails';
                coin.style.cssText = `
                    width: 40px; height: 40px; 
                    display: flex; justify-content: center; align-items: center; 
                    border: 2px solid ${isHeads ? 'gold' : 'silver'};
                    color: ${isHeads ? 'gold' : 'silver'};
                    font-weight: bold; font-size: 1.2rem; 
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                `;
                resContainer.appendChild(coin);
            }

            const summary = document.createElement('div');
            summary.style.cssText = 'margin-top: 10px; font-size: 1.2rem; color: #ddd;';
            summary.innerHTML = `<span style="color: gold">Heads: ${heads}</span> / <span style="color: silver">Tails: ${tails}</span>`;

            resultArea.appendChild(resContainer);
            resultArea.appendChild(summary);
        }
    }
}
