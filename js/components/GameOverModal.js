export class GameOverModal {
    constructor(store, winner) {
        this.store = store;
        this.winner = winner;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'game-over-modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 4000;
        `;

        this.element.innerHTML = `
            <div class="game-over-content" style="
                background: rgba(10, 15, 20, 0.95); 
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
                <!-- Scanline effect -->
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
                    <button id="dl-log-btn" style="
                        padding: 1rem 2rem; 
                        background: rgba(0,0,0,0.6); 
                        color: var(--neon-blue); 
                        border: 1px solid var(--neon-blue); 
                        border-radius: 4px; 
                        cursor: pointer; 
                        font-size: 1rem; 
                        letter-spacing: 1px;
                        transition: all 0.2s;
                        box-shadow: 0 0 10px rgba(0, 243, 255, 0.1);
                    " onmouseover="this.style.background='rgba(0, 243, 255, 0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">
                        [ DOWNLOAD LOG ]
                    </button>
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

        // Listeners
        this.element.querySelector('#dl-log-btn').addEventListener('click', () => {
            if (!confirm('Download game log?')) return;

            const rawLogs = this.store.getState().logs.slice().reverse();
            const players = this.store.getState().players;
            const startingLife = this.store.getState().settings?.startingLife || 40;

            // 2. Prepare Tracking State
            let currentTurn = 0;
            let activePlayerName = "";

            // Maps
            const lifeMap = {};
            players.forEach(p => lifeMap[p.name] = startingLife);

            // Track Commander Damage Running Totals to deduce Life Loss
            const cmdDmgTotals = {};

            // 3. Prepare CSV Header
            // Cols: Timestamp, Turn, Active Player, Life, Message
            // BOM included
            let csvContent = "\uFEFFTimestamp,Turn,Active Player,Life,Message\n";

            // 4. Process logs
            rawLogs.forEach(entryStr => {
                const match = entryStr.match(/^\[(.*?)\] (.*)$/);
                if (!match) return; // Skip invalid format

                const time = match[1];
                let msg = match[2];

                // --- State Tracking Logic --- //

                // A. Check for Turn Start
                const turnMatch = msg.match(/^Turn (\d+): (.*?)'s turn/);
                if (turnMatch) {
                    currentTurn = turnMatch[1];
                    activePlayerName = turnMatch[2];

                    // Clean up message
                    const fullTurnMatch = msg.match(/^Turn (\d+): (.*)$/);
                    if (fullTurnMatch) msg = fullTurnMatch[2];
                }

                // B. Check for Life Change
                const lifeMatch = msg.match(/^(.*?)'s life changed.*?Current: (-?\d+)/);
                if (lifeMatch) {
                    const pName = lifeMatch[1];
                    const newLife = parseInt(lifeMatch[2]);
                    lifeMap[pName] = newLife;
                }

                // C. Check for Commander Damage (New Format)
                // Log: (CMDdmg：Attacker｛Source}→Victim：Total)
                const cmdRegex = /\(CMDdmg：.*?｛(.*?)\}→(.*?)：(\d+)\)/;
                const cmdMatch = msg.match(cmdRegex);
                if (cmdMatch) {
                    const sourceName = cmdMatch[1];
                    const victimName = cmdMatch[2];
                    const newTotal = parseInt(cmdMatch[3]);

                    // Initialize tracking if needed
                    if (!cmdDmgTotals[victimName]) cmdDmgTotals[victimName] = {};
                    const prevTotal = cmdDmgTotals[victimName][sourceName] || 0;

                    const damageAmount = newTotal - prevTotal;

                    // Update total
                    cmdDmgTotals[victimName][sourceName] = newTotal;

                    // Update Life (Deduce loss)
                    if (lifeMap[victimName] !== undefined) {
                        lifeMap[victimName] -= damageAmount;
                    }
                }

                // D. Check for Elimination (Life 0)
                const elimMatch = msg.match(/^(.*?) has been eliminated/);
                if (elimMatch) {
                    // Check if elimination was due to CMD dmg (which might be handled above, but set to 0 to be safe/consistent)
                    lifeMap[elimMatch[1]] = 0;
                }

                // --- Row Construction ---
                let currentLife = "";
                if (activePlayerName && lifeMap[activePlayerName] !== undefined) {
                    currentLife = lifeMap[activePlayerName];
                }

                // Escape quotes
                msg = msg.replace(/"/g, '""');

                // Add Row
                csvContent += `"${time}","${currentTurn}","${activePlayerName}","${currentLife}","${msg}"\n`;
            });

            // 5. Trigger Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mtg-game-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            a.click();
        });

        this.element.querySelector('#restart-btn').addEventListener('click', () => {
            if (confirm('Start a new game?')) {
                // Transition Animation
                const overlay = document.createElement('div');
                overlay.className = 'transition-overlay';
                document.body.appendChild(overlay);

                // Glitch out the modal content
                const content = this.element.querySelector('.game-over-content');
                if (content) {
                    content.style.animation = 'glitch-scale-out 0.8s forwards';
                }

                setTimeout(() => {
                    this.store.dispatch('RESTART_GAME');
                    this.close();
                    setTimeout(() => overlay.remove(), 500);
                }, 800);
            }
        });

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
