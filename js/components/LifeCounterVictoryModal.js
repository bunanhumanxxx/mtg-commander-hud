export class LifeCounterVictoryModal {
    constructor(store, winner) {
        this.store = store;
        this.winner = winner;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'game-over-modal-overlay'; // Reuse CSS class for z-index/layout
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 4000;
        `;

        this.element.innerHTML = `
            <div class="game-over-content" style="
                background: #050a14; 
                backdrop-filter: blur(10px);
                padding: 3rem; 
                border-radius: 12px; 
                text-align: center; 
                min-width: 450px; 
                border: 1px solid var(--neon-blue);
                box-shadow: 0 0 30px rgba(0, 243, 255, 0.3), inset 0 0 20px rgba(0, 243, 255, 0.1);
                position: relative;
                overflow: hidden;
            ">
                <!-- Scanline effect (reused) -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; pointer-events: none;"></div>

                <h1 style="color: var(--neon-blue); font-size: 3.5rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 4px; text-shadow: 0 0 15px var(--neon-blue);">
                    WINNER
                </h1>
                
                <div style="margin: 2rem 0; position: relative; display: inline-block;">
                    <img src="${this.winner.icon}?v=${Date.now()}" style="
                        width: 180px; 
                        height: 180px; 
                        object-fit: contain; 
                        mix-blend-mode: screen; 
                        opacity: 1.0;
                        filter: contrast(1.2) brightness(0.95) drop-shadow(0 0 5px var(--neon-pink));
                        -webkit-mask-image: radial-gradient(closest-side, black 50%, transparent 100%);
                        mask-image: radial-gradient(closest-side, black 50%, transparent 100%);
                    ">
                </div>
                
                <h2 style="font-size: 2.5rem; margin-bottom: 3rem; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5);">
                    ${this.winner.name}
                </h2>
                
                <div style="display: flex; gap: 1.5rem; justify-content: center; position: relative; z-index: 1;">
                    <button id="restart-btn" style="
                        padding: 1rem 2rem; 
                        background: rgba(50, 0, 0, 0.6); 
                        color: var(--neon-pink); 
                        border: 1px solid var(--neon-pink); 
                        border-radius: 4px; 
                        cursor: pointer; 
                        font-size: 1rem; 
                        font-weight: bold;
                        letter-spacing: 1px;
                        transition: all 0.2s;
                        box-shadow: 0 0 10px rgba(255, 0, 85, 0.1);
                    " onmouseover="this.style.background='rgba(255, 0, 85, 0.2)'" onmouseout="this.style.background='rgba(50, 0, 0, 0.6)'">
                        [ SYSTEM REBOOT ]
                    </button>
                </div>
            </div>
        `;

        // Only Reboot Button (No Log)
        this.element.querySelector('#restart-btn').addEventListener('click', () => {
            this.store.dispatch('RESTART_GAME');
            location.reload();
        });

        return this.element;
    }
}
