import { renderPlayerArea } from './PlayerArea.js';

export function renderApp(container, store) {
    function render() {
        const state = store.getState();
        container.innerHTML = ''; // Clear current

        try {
            // Check for Winner
            if (state.winner) {
                import('./GameOverModal.js?v=' + Date.now()).then(({ GameOverModal }) => {
                    if (!document.querySelector('.game-over-modal-overlay')) {
                        const modal = new GameOverModal(store, state.winner);
                        container.appendChild(modal.render());
                    }
                });
            } else {
                const existing = document.querySelector('.game-over-modal-overlay');
                if (existing) existing.remove();
            }

            if (!state.gameStarted) {
                container.innerHTML = `
                    <div class="setup-screen" style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width: 100%;">
                        <h1 style="color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); font-size: 3rem; text-transform: uppercase; letter-spacing: 2px;">MTG Commander System</h1>
                        <button id="start-btn" style="padding:1rem 3rem; font-size:1.5rem; cursor:pointer; background: transparent; border: 2px solid var(--neon-blue); color: var(--neon-blue); box-shadow: 0 0 15px var(--neon-blue);">INITIALIZE SYSTEM</button>
                        <p style="margin-top: 1rem; color: #888; font-size: 0.8rem;">Note: If buttons don't work, ensure you are running on a local server (CORS).</p>
                    </div>
                `;

                document.getElementById('start-btn').addEventListener('click', () => {
                    import('./Modals.js?v=' + Date.now()).then(({ SetupModal }) => {
                        const modal = new SetupModal(store);
                        container.appendChild(modal.render());
                    }).catch(err => {
                        console.error('Failed to load Modals:', err);
                        alert('Error loading application components. If you are opening this file directly, please use a local server (e.g., VS Code Live Server, python -m http.server).');
                    });
                });
                return;
            }

            // Main Game Layout
            const mainBoard = document.createElement('div');
            mainBoard.className = 'main-board';

            state.players.forEach((player, index) => {
                const isActive = player.id === state.turn.activePlayerId;
                const playerArea = renderPlayerArea(player, store, isActive);

                // Layout Logic
                const count = state.players.length;
                if (count === 2) {
                    playerArea.style.width = '100%';
                    playerArea.style.height = '50%';
                } else if (count === 3) {
                    if (index === 0) {
                        playerArea.style.width = '100%';
                        playerArea.style.height = '50%';
                    } else {
                        playerArea.style.width = '50%';
                        playerArea.style.height = '50%';
                    }
                } else {
                    // 4 Players: 2x2 Grid
                    playerArea.style.width = '50%';
                    playerArea.style.height = '50%';
                }
                mainBoard.appendChild(playerArea);
            });

            // Sidebar
            const sidebar = document.createElement('div');
            sidebar.className = 'sidebar';
            sidebar.innerHTML = `
                <h3>Turn ${state.turn.count}</h3>
                <p>Active: <strong style="color: var(--neon-blue); text-shadow: 0 0 5px var(--neon-blue);">${state.players.find(p => p.id === state.turn.activePlayerId)?.name}</strong></p>
                <button id="next-turn-btn" style="margin: 1rem 0; padding: 0.5rem; width: 100%; cursor: pointer; border: 1px solid var(--neon-blue); color: var(--neon-blue); background: rgba(0, 243, 255, 0.1);">>> NEXT PHASE</button>
                <div class="log-area" style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 0.5rem; font-size: 0.8rem; border: 1px solid var(--border-color); margin-top: 1rem; font-family: monospace; color: #aaa;">
                    ${state.logs.map(log => `<div style="margin-bottom: 4px; border-bottom: 1px solid #333; padding-bottom: 2px;">> ${log}</div>`).join('')}
                </div>
                
                <div style="margin-top: auto; display:flex; flex-direction:column; gap:0.5rem;">
                    <button id="memo-btn" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid #666; color: #ddd; cursor: pointer;">[ MEMO ]</button>
                    <div style="display:flex; gap:0.5rem;">
                        <button id="snap-btn" style="flex:1; background: rgba(0, 255, 100, 0.1); border: 1px solid #3c8; border-radius: 4px; color: #3c8; cursor: pointer;">[ SNAP ]</button>
                        <button id="undo-btn" style="flex:1; background: rgba(255, 150, 0, 0.1); border: 1px solid #d84; border-radius: 4px; color: #d84; cursor: pointer;">[ UNDO ]</button>
                    </div>
                    <button id="save-log-btn" style="width: 100%; border: 1px solid #888; background: transparent; color: #888;">[ LOG ]</button>
                    <button id="in-game-restart-btn" style="width: 100%; background: rgba(100,0,0,0.3); border: 1px solid #f55; color: #f55;">[ REBOOT ]</button>
                </div>
            `;

            sidebar.querySelector('#next-turn-btn').addEventListener('click', () => {
                store.dispatch('NEXT_TURN');
            });

            // Event Listeners for new buttons
            sidebar.querySelector('#memo-btn').addEventListener('click', () => {
                import('./MemoModal.js').then(({ MemoModal }) => {
                    const modal = new MemoModal(store);
                    document.body.appendChild(modal.render());
                });
            });

            sidebar.querySelector('#snap-btn').addEventListener('click', () => {
                if (typeof html2canvas !== 'undefined') {
                    const target = document.querySelector('.main-board') || document.body;

                    html2canvas(target, {
                        backgroundColor: '#1a1a1a', // Match theme
                        useCORS: true,
                        logging: false
                    }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `mtg-board-snap-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                    }).catch(err => {
                        console.error('Snapshot failed:', err);
                        alert('Snapshot failed. See console.');
                    });
                } else {
                    alert('Snapshot library not loaded yet.');
                }
            });

            sidebar.querySelector('#undo-btn').addEventListener('click', () => {
                if (confirm('Undo last action?')) {
                    store.dispatch('UNDO');
                }
            });

            sidebar.querySelector('#in-game-restart-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to restart the game? Current progress will be lost.')) {
                    // Transition Animation
                    const overlay = document.createElement('div');
                    overlay.className = 'transition-overlay';
                    document.body.appendChild(overlay);

                    // Optional: Glitch out the board
                    const board = document.querySelector('.main-board');
                    if (board) board.classList.add('modal-exit-anim');

                    setTimeout(() => {
                        store.dispatch('RESTART_GAME');
                        setTimeout(() => overlay.remove(), 500);
                    }, 800);
                }
            });

            container.appendChild(mainBoard);
            container.appendChild(sidebar);
        } catch (e) {
            console.error('Render Loop Error:', e);
            alert('A Critical System Error occurred during render. Please check console for details.\n\n' + e.message);
        }
    }

    // Subscribe to store updates
    const unsubscribe = store.subscribe(render);

    // Initial call
    render();

    return unsubscribe;
}
