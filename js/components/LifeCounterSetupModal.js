export class LifeCounterSetupModal {
    constructor(store) {
        this.store = store;
        this.element = null;
        this.settings = {
            playerCount: 4,
            startingLife: 40,
            players: []
        };
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'setup-modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(5px);
        `;

        // Inject Custom Styles for Checkbox
        const style = document.createElement('style');
        style.textContent = `
            .partner-check {
                appearance: none; -webkit-appearance: none;
                width: 18px; height: 18px;
                background: #333;
                border: 1px solid #555;
                border-radius: 3px;
                cursor: pointer;
                position: relative;
                transition: all 0.2s;
                vertical-align: middle;
            }
            .partner-check:checked {
                background: rgba(0, 243, 255, 0.2);
                border-color: var(--neon-blue);
                box-shadow: 0 0 10px var(--neon-blue);
            }
            .partner-check:checked::after {
                content: '';
                position: absolute;
                top: 2px; left: 6px;
                width: 4px; height: 9px;
                border: solid var(--neon-blue);
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
                filter: drop-shadow(0 0 2px var(--neon-blue));
            }
        `;
        this.element.appendChild(style);

        this.element.innerHTML += `
            <div class="setup-content" style="
                background: rgba(10, 15, 20, 0.95); padding: 2rem; border-radius: 10px;
                border: 1px solid var(--neon-blue); box-shadow: 0 0 30px rgba(0, 243, 255, 0.1);
                width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
                color: white;
            ">
                <h2 style="color: var(--neon-blue); text-align: center; margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 2px;">Life Counter Setup</h2>

                <!-- Player Count Selection -->
                <div style="margin-bottom: 2rem; text-align: center;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #888;">Number of Players</label>
                    <div style="display: flex; justify-content: center; gap: 10px;">
                        ${[2, 3, 4, 5, 6].map(num => `
                            <button class="count-btn" data-count="${num}" style="
                                padding: 10px 20px; background: transparent; 
                                border: 1px solid #444; color: #888; 
                                border-radius: 4px; cursor: pointer; font-weight: bold;
                                transition: all 0.2s;
                            ">${num}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- Life Setting -->
                <div style="margin-bottom: 2rem; text-align: center;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #888;">Starting Life</label>
                    <div style="display: flex; justify-content: center; gap: 10px;">
                        <button class="life-btn" data-life="20">20</button>
                        <button class="life-btn active" data-life="40">40</button>
                    </div>
                </div>

                <!-- Player Details -->
                <div id="player-config-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 2rem;">
                    <!-- Injected via JS -->
                </div>

                <button id="start-game-btn" class="hud-btn-primary" style="width: 100%; padding: 1rem; font-size: 1.2rem;">START GAME</button>
                <button id="back-btn" style="
                    width: 100%; padding: 0.8rem; margin-top: 10px; 
                    background: transparent; border: none; color: #666; 
                    cursor: pointer; text-decoration: underline;
                ">Back to Menu</button>
            </div>
        `;

        // Style helper for Life Buttons
        const styleBtns = this.element.querySelectorAll('.life-btn');
        styleBtns.forEach(btn => {
            btn.style.cssText = `
                padding: 10px 30px; background: transparent; 
                border: 1px solid #444; color: #888; 
                border-radius: 4px; cursor: pointer; font-weight: bold;
            `;
            if (btn.classList.contains('active')) {
                btn.style.borderColor = 'var(--neon-blue)';
                btn.style.color = 'var(--neon-blue)';
                btn.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.3)';
            }
            btn.onclick = () => {
                this.settings.startingLife = parseInt(btn.dataset.life);
                styleBtns.forEach(b => {
                    b.style.borderColor = '#444';
                    b.style.color = '#888';
                    b.style.boxShadow = 'none';
                });
                btn.style.borderColor = 'var(--neon-blue)';
                btn.style.color = 'var(--neon-blue)';
                btn.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.3)';
            };
        });

        // Count Buttons
        const countBtns = this.element.querySelectorAll('.count-btn');
        countBtns.forEach(btn => {
            const num = parseInt(btn.dataset.count);
            if (num === 4) this._setActive(btn); // Default

            btn.onclick = () => {
                this.settings.playerCount = num;
                countBtns.forEach(b => this._setInactive(b));
                this._setActive(btn);
                this._renderPlayerInputs();
            };
        });

        // Initial Render of Inputs
        this._renderPlayerInputs();

        // Start Button
        this.element.querySelector('#start-game-btn').onclick = () => {
            // Harvest Names and Partner Status
            const inputs = this.element.querySelectorAll('.player-row');
            const players = [];
            inputs.forEach((row, index) => {
                const nameInput = row.querySelector('.player-name-input');
                const partnerCheck = row.querySelector('.partner-check');
                players.push({
                    name: nameInput.value || `Player ${index + 1}`,
                    life: this.settings.startingLife,
                    isPartner: partnerCheck.checked,
                    // Simple commander stubs for logic compatibility if needed
                    commanders: partnerCheck.checked ? [{ id: 'c1' }, { id: 'c2' }] : [{ id: 'c1' }]
                });
            });

            this.store.dispatch('INIT_GAME', {
                players: players,
                options: {
                    randomizeTurnOrder: true,
                    gameMode: 'life_counter'
                }
            });
            this.element.remove();
        };

        this.element.querySelector('#back-btn').onclick = () => {
            this.element.remove();
        };

        return this.element;
    }

    _renderPlayerInputs() {
        const list = this.element.querySelector('#player-config-list');
        list.innerHTML = '';
        for (let i = 0; i < this.settings.playerCount; i++) {
            const row = document.createElement('div');
            row.className = 'player-row';
            row.style.cssText = `
                display: flex; align-items: center; gap: 10px;
                background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px;
            `;
            row.innerHTML = `
                <span style="color: #666; font-weight: bold; width: 20px;">${i + 1}</span>
                <input type="text" class="player-name-input" placeholder="Player ${i + 1}" style="
                    flex: 1; background: transparent; border: none; 
                    border-bottom: 1px solid #444; color: white; padding: 5px;
                    font-size: 1rem;
                ">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #aaa; cursor: pointer; transition: color 0.2s;">
                    <input type="checkbox" class="partner-check"> Partner
                </label>
            `;
            list.appendChild(row);
        }
    }

    _setActive(btn) {
        btn.style.borderColor = 'var(--neon-blue)';
        btn.style.color = 'var(--neon-blue)';
        btn.style.background = 'rgba(0, 243, 255, 0.1)';
    }

    _setInactive(btn) {
        btn.style.borderColor = '#444';
        btn.style.color = '#888';
        btn.style.background = 'transparent';
    }
}
