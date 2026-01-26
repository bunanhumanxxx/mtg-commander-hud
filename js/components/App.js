import { renderPlayerArea } from './PlayerArea.js';

// Sidebar State (Persisted across renders)
let isSidebarCollapsed = true; // Default Closed

export function renderApp(container, store) {
    function render() {
        const state = store.getState();
        // container.innerHTML = ''; // MOVED: Now handled per-mode to prevent flashing in Life Counter mode

        try {
            // Check for Winner
            if (state.winner) {
                if (state.settings.gameMode === 'life_counter') {
                    import('./LifeCounterVictoryModal.js?v=' + Date.now()).then(({ LifeCounterVictoryModal }) => {
                        if (!document.querySelector('.game-over-modal-overlay')) {
                            const modal = new LifeCounterVictoryModal(store, state.winner);
                            container.appendChild(modal.render());
                        }
                    });
                } else {
                    import('./GameOverModal.js?v=' + Date.now()).then(({ GameOverModal }) => {
                        if (!document.querySelector('.game-over-modal-overlay')) {
                            const modal = new GameOverModal(store, state.winner);
                            container.appendChild(modal.render());
                        }
                    });
                }
            } else {
                const existing = document.querySelector('.game-over-modal-overlay');
                if (existing) existing.remove();
            }

            if (!state.gameStarted) {
                // START SCREEN with Mode Selection
                container.innerHTML = '';
                container.innerHTML += `
                    <div class="setup-screen" style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width: 100%;">
                        <h1 style="color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); font-size: clamp(1.5rem, 5vw, 3rem); text-transform: uppercase; letter-spacing: 2px; white-space: nowrap; margin-bottom: 3rem;">MTG Commander System</h1>
                        
                        <div style="display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 1200px;">
                            <button id="start-full-btn" style="
                                flex: 1; min-width: 300px; padding:2rem; font-size:1.5rem; cursor:pointer; 
                                background: rgba(0, 10, 20, 0.8); border: 2px solid var(--neon-blue); color: var(--neon-blue); 
                                box-shadow: 0 0 15px var(--neon-blue), inset 0 0 15px rgba(0, 243, 255, 0.2); 
                                border-radius: 12px; text-transform: uppercase; font-weight: bold;
                                transition: all 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center;
                                text-shadow: 0 0 5px var(--neon-blue);
                            ">
                                FULL SYSTEM
                                <span style="font-size: 0.9rem; font-weight: normal; margin-top: 10px; opacity: 0.8; text-shadow: none;">Board & Life Management</span>
                            </button>

                            <button id="start-life-btn" style="
                                flex: 1; min-width: 300px; padding:2rem; font-size:1.5rem; cursor:pointer; 
                                background: rgba(20, 0, 10, 0.8); border: 2px solid var(--neon-pink); color: var(--neon-pink); 
                                box-shadow: 0 0 15px var(--neon-pink), inset 0 0 15px rgba(255, 0, 85, 0.2); 
                                border-radius: 12px; text-transform: uppercase; font-weight: bold;
                                transition: all 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center;
                                text-shadow: 0 0 5px var(--neon-pink);
                            ">
                                LIFE COUNTER
                                <span style="font-size: 0.9rem; font-weight: normal; margin-top: 10px; opacity: 0.8; text-shadow: none;">Life & Cmd Damage Only</span>
                            </button>

                            <button id="start-deck-btn" style="
                                flex: 1; min-width: 300px; padding:2rem; font-size:1.5rem; cursor:pointer; 
                                background: rgba(0, 20, 10, 0.8); border: 2px solid var(--neon-green); color: var(--neon-green); 
                                box-shadow: 0 0 15px var(--neon-green), inset 0 0 15px rgba(0, 255, 100, 0.2); 
                                border-radius: 12px; text-transform: uppercase; font-weight: bold;
                                transition: all 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center;
                                text-shadow: 0 0 5px var(--neon-green);
                            ">
                                DECK BUILDER
                                <span style="font-size: 0.9rem; font-weight: normal; margin-top: 10px; opacity: 0.8; text-shadow: none;">Construct & Manage Decks</span>
                            </button>
                        </div>
                    </div>
                `;

                // Hover Effects
                const addHover = (btnId, color) => {
                    const btn = document.getElementById(btnId);
                    btn.onmouseover = () => {
                        let bg = 'rgba(0, 243, 255, 0.3)';
                        if (color === 'red') bg = 'rgba(255, 0, 85, 0.3)';
                        if (color === 'green') bg = 'rgba(0, 255, 100, 0.3)';
                        btn.style.background = bg;
                        btn.style.transform = 'scale(1.05)';
                    };
                    btn.onmouseout = () => {
                        let bg = 'rgba(0, 243, 255, 0.1)';
                        if (color === 'red') bg = 'rgba(255, 0, 85, 0.1)';
                        if (color === 'green') bg = 'rgba(0, 255, 100, 0.1)';
                        btn.style.background = bg;
                        btn.style.transform = 'scale(1)';
                    };
                };
                addHover('start-full-btn', 'blue');
                addHover('start-life-btn', 'red');

                // Full System Setup
                document.getElementById('start-full-btn').addEventListener('click', () => {
                    import('./Modals.js?v=' + Date.now()).then(({ SetupModal }) => {
                        const modal = new SetupModal(store);
                        container.appendChild(modal.render());
                    });
                });

                // Life Counter Setup
                document.getElementById('start-life-btn').addEventListener('click', () => {
                    import('./LifeCounterSetupModal.js?v=' + Date.now()).then(({ LifeCounterSetupModal }) => {
                        const modal = new LifeCounterSetupModal(store);
                        container.appendChild(modal.render());
                    });
                });

                addHover('start-deck-btn', 'green');

                // Deck Builder Setup
                document.getElementById('start-deck-btn').addEventListener('click', () => {
                    import('./DeckBuilderSetupModal.js?v=' + Date.now()).then(({ DeckBuilderSetupModal }) => {
                        const modal = new DeckBuilderSetupModal(store);
                        container.appendChild(modal.render());
                    });
                });
                return;
            }

            // --- RENDER GAME (based on Mode) ---
            if (state.settings.gameMode === 'life_counter') {
                import('./LifeCounterApp.js?v=' + Date.now()).then(({ LifeCounterApp }) => {
                    // Check if we already have an active instance
                    if (!window.lifeCounterInstance) {
                        // First mount
                        window.lifeCounterInstance = new LifeCounterApp(store);
                        window.lifeCounterInstance.mount(container);
                    } else {
                        // Update existing (No Flash!)
                        // Ensure container is still valid (e.g. if we switched pages)
                        if (window.lifeCounterInstance.container !== container) {
                            window.lifeCounterInstance.mount(container);
                        } else {
                            window.lifeCounterInstance.update(state);
                        }
                    }
                });
                return;
            } else if (state.settings.gameMode === 'deck_builder') {
                import('./DeckBuilderApp.js?v=' + Date.now()).then(({ DeckBuilderApp }) => {
                    // Single instance logic for efficiency? Or just rebuild. Layout is simple.
                    // Let's use new instance every time for cleaner state reset.
                    container.innerHTML = '';
                    try {
                        const app = new DeckBuilderApp(store);
                        container.appendChild(app.render());
                    } catch (err) {
                        console.error('DeckBuilder Render Error:', err);
                        alert('Deck Builder Error: ' + err.message);
                        location.reload();
                    }
                }).catch(err => {
                    console.error('DeckBuilder Import Error:', err);
                    alert('Failed to load Deck Builder module: ' + err.message);
                    location.reload();
                });
                return;
            } else {
                // Cleanup Life Counter instance if we switch away
                if (window.lifeCounterInstance) {
                    window.lifeCounterInstance = null;
                }
            }

            // --- FULL SYSTEM MODE (Standard) ---
            // Clear container strictly for Full System Mode re-renders
            container.innerHTML = '';

            const mainBoard = document.createElement('div');
            mainBoard.className = 'main-board';
            // If sidebar is collapsed, mainBoard should take full width? 
            // Flex 7 vs Flex 0 means it takes all space naturally if sidebar is present but 0 width.

            // Add player count class for grid layout
            mainBoard.classList.add(`grid-players-${state.players.length}`);

            const focusedId = state.ui.focusedPlayerId;
            if (focusedId) {
                mainBoard.classList.add('has-focused-player');
            }

            state.players.forEach((player, index) => {
                const isActive = player.id === state.turn.activePlayerId;
                const playerArea = renderPlayerArea(player, store, isActive);

                if (focusedId === player.id) {
                    playerArea.classList.add('focused');
                }

                // Styles are now handled by CSS .grid-players-N
                mainBoard.appendChild(playerArea);
            });

            // Sidebar
            const sidebar = document.createElement('div');
            sidebar.className = 'sidebar';
            if (isSidebarCollapsed) {
                sidebar.classList.add('collapsed');
            }

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

            if (!isSidebarCollapsed) {
                // Only hook events if visible/rendered? 
                // Actually if collapsed, innerHTML is still there but hidden.
                // It's safer to add listeners always unless we optimize render.
                sidebar.querySelector('#next-turn-btn').addEventListener('click', () => {
                    const st = store.getState();
                    const p = st.players.find(pl => pl.id === st.turn.activePlayerId);
                    const z = st.zones[p?.id];

                    if (p && !p.noMaxHandSize && p.handCount > 7 && z && z.simHand && z.simHand.length > 0 && z.library && z.library.length > 0) {
                        import('./DiscardSelectModal.js?v=' + Date.now()).then(({ DiscardSelectModal }) => {
                            const excess = p.handCount - 7;
                            const modal = new DiscardSelectModal(store, p.id, excess, () => store.dispatch('NEXT_TURN'));
                            document.body.appendChild(modal.render());
                        });
                    } else {
                        store.dispatch('NEXT_TURN');
                    }
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
                        if (!confirm('Take a snapshot of the current board?')) return;

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

                sidebar.querySelector('#save-log-btn').addEventListener('click', () => {
                    if (confirm('Download game log?')) {
                        // 1. Get logs in chronological order (Oldest -> Newest)
                        const rawLogs = store.getState().logs.slice().reverse();
                        const players = store.getState().players;
                        const startingLife = store.getState().settings?.startingLife || 40;

                        // 2. Prepare Tracking State
                        let currentTurn = 0;
                        let activePlayerName = "";

                        // Maps
                        const lifeMap = {};
                        players.forEach(p => lifeMap[p.name] = startingLife);

                        // NEW: Track Commander Damage Running Totals to deduce Life Loss
                        // { VictimName: { SourceName: TotalDamage } }
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
                            // (CMDdmg：Attacker｛Source}→Victim：Total)
                            const cmdRegex = /\(CMDdmg：.*?｛(.*?)\}→(.*?)：(\d+)\)/;
                            // Group 1: Source, 2: Victim, 3: Total
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
            }

            container.appendChild(mainBoard);
            container.appendChild(sidebar);

            // Sidebar Toggle Button
            const toggleBtn = document.createElement('div');
            toggleBtn.className = 'sidebar-toggle-btn';
            if (!isSidebarCollapsed) toggleBtn.classList.add('is-open');
            toggleBtn.onclick = () => {
                isSidebarCollapsed = !isSidebarCollapsed;
                render();
            };
            container.appendChild(toggleBtn);

            // Floating Next Turn Button (Only when sidebar collapsed)
            if (isSidebarCollapsed) {
                const floatTurnBtn = document.createElement('div');
                floatTurnBtn.className = 'floating-turn-btn';
                floatTurnBtn.innerText = 'NEXT PHASE';
                floatTurnBtn.onclick = () => {
                    const st = store.getState();
                    const p = st.players.find(pl => pl.id === st.turn.activePlayerId);
                    const z = st.zones[p?.id];

                    if (p && !p.noMaxHandSize && p.handCount > 7 && z && z.simHand && z.simHand.length > 0 && z.library && z.library.length > 0) {
                        import('./DiscardSelectModal.js?v=' + Date.now()).then(({ DiscardSelectModal }) => {
                            const excess = p.handCount - 7;
                            const modal = new DiscardSelectModal(store, p.id, excess, () => store.dispatch('NEXT_TURN'));
                            document.body.appendChild(modal.render());
                        });
                    } else {
                        store.dispatch('NEXT_TURN');
                    }
                };
                container.appendChild(floatTurnBtn);
            }

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
