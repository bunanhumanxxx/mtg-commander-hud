import { renderCommanderZone } from './CommanderZone.js';
import { renderCard } from './Card.js';

export function renderPlayerArea(player, store, isActive) {
    const playerArea = document.createElement('div');
    playerArea.className = 'player-area player-area-hud';
    playerArea.dataset.playerId = player.id;
    // Ensure visually separated (handled by CSS now)
    // playerArea.style.border = '1px solid #222';
    playerArea.style.boxSizing = 'border-box';
    playerArea.style.position = 'relative'; // For active frame overlay

    // Eliminated Style
    if (player.eliminated) {
        playerArea.style.pointerEvents = 'none'; // Lock
        playerArea.style.border = '1px solid #300';

        // Add Eliminated Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; justify-content: center; align-items: center;
            z-index: 2000;
            background: repeating-linear-gradient(45deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 10px, rgba(50,0,0,0.2) 10px, rgba(50,0,0,0.2) 20px);
            backdrop-filter: grayscale(100%) brightness(0.3); /* Dim and grayscale the content BEHIND */
            pointer-events: none;
        `;
        overlay.innerHTML = `
            <div style="
                border: 2px solid red; 
                padding: 1rem 2rem; 
                color: red; 
                font-weight: bold; 
                font-size: 1.5rem; 
                background: rgba(0,0,0,0.8);
                transform: rotate(-5deg);
                text-shadow: 0 0 10px red;
                font-family: monospace;
                letter-spacing: 2px;
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.4);
            ">SYSTEM FAILURE</div>
        `;
        playerArea.appendChild(overlay);
    }

    // Active Player Highlight (Overlay to ensure visibility over children)
    if (isActive) {
        const activeFrame = document.createElement('div');
        activeFrame.className = 'active-frame';
        activeFrame.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            border: 4px solid gold;
            box-shadow: inset 0 0 15px rgba(255, 215, 0, 0.5);
            pointer-events: none;
            z-index: 1000;
            box-sizing: border-box;
        `;
        playerArea.appendChild(activeFrame);
    }

    // Header
    const header = document.createElement('div');
    header.className = 'player-header';

    // Commander Damage Buttons Logic
    const allPlayers = store.getState().players;
    const opponents = allPlayers.filter(p => p.id !== player.id);

    const cmdContainer = document.createElement('div');
    cmdContainer.className = 'cmd-dmg-container';
    cmdContainer.style.display = 'flex';
    cmdContainer.style.gap = '5px';
    cmdContainer.style.marginRight = '1rem';

    opponents.forEach(op => {
        // Partner Logic
        if (op.commanders && op.commanders.length > 1) {
            // Check max damage to determine color
            let maxDmg = 0;
            const cmdDetails = op.commanders.map(cmd => {
                const d = player.commanderDamage[cmd.id] || 0;
                if (d > maxDmg) maxDmg = d;
                return { id: cmd.id, name: cmd.name, damage: d, image_url: cmd.image_url };
            });

            const hasLethal = maxDmg >= 21;
            const btn = document.createElement('button');
            btn.className = 'hud-badge';
            btn.innerHTML = `[ ${op.name}: Partners ]`;
            btn.title = `Commander Damage from ${op.name} (Partners)`;
            btn.style.cssText = `
                background: rgba(0,0,0,0.5); border: 1px solid ${hasLethal ? 'var(--neon-pink)' : 'var(--border-color)'};
                color: ${hasLethal ? 'var(--neon-pink)' : '#ccc'};
                font-size: 0.8rem; cursor: pointer; padding: 2px 5px; border-radius: 4px;
                display: flex; align-items: center;
            `;

            btn.onclick = () => {
                import('./PartnerDetailModal.js?v=' + Date.now()).then(({ PartnerDetailModal }) => {
                    const modal = new PartnerDetailModal(store, player.id, 'damage', {
                        opponentName: op.name,
                        opponentId: op.id,
                        commanders: cmdDetails
                    });
                    document.body.appendChild(modal.render());
                });
            };
            cmdContainer.appendChild(btn);

        } else if (op.commanders && op.commanders.length > 0) {
            // Single Commander (Existing Logic)
            op.commanders.forEach(cmd => {
                const dmg = player.commanderDamage[cmd.id] || 0;
                const btn = document.createElement('button');
                btn.className = 'hud-badge';

                // Format: [ PlayerName:Damage ]
                btn.innerHTML = `[ ${op.name}:${dmg} ]`;
                btn.title = `Commander Damage from ${cmd.name} (${op.name})`;
                btn.style.cssText = `
                    background: rgba(0,0,0,0.5); border: 1px solid ${dmg >= 21 ? 'var(--neon-pink)' : 'var(--border-color)'};
                    color: ${dmg >= 21 ? 'var(--neon-pink)' : '#ccc'};
                    font-size: 0.8rem; cursor: pointer; padding: 2px 5px; border-radius: 4px;
                    display: flex; align-items: center;
                `;

                btn.onclick = () => {
                    import('./StatusModal.js').then(({ StatusModal }) => {
                        const modal = new StatusModal(store, player.id, 'commanderDamage', dmg, cmd.id, `${cmd.name}`);
                        document.body.appendChild(modal.render());
                    });
                };
                cmdContainer.appendChild(btn);
            });
        }
    });

    // Display Commander Tax
    const pCommanders = player.commanders || [];
    const pZones = store.getState().zones[player.id];

    // Gather Tax Info
    const taxInfo = pCommanders.map(cmd => {
        let currentTax = 0;
        if (pZones) {
            const allZoneCards = [
                ...(pZones.battlefield || []),
                ...(pZones.grave || []),
                ...(pZones.exile || []),
                ...(pZones.command || []),
                ...(pZones.hand || [])
            ];
            const liveCard = allZoneCards.find(c => c.id === cmd.id);
            if (liveCard) currentTax = liveCard.commanderTax || 0;
        }
        return { name: cmd.name, tax: currentTax, image_url: cmd.image_url };
    });

    const hasTax = taxInfo.some(t => t.tax > 0);

    if (hasTax) {
        if (pCommanders.length > 1) {
            // Partner Consolidated Tax
            const taxBadge = document.createElement('div');
            taxBadge.className = 'hud-badge';
            taxBadge.innerHTML = `[ TAX (Part) ]`;
            taxBadge.title = `Commander Tax Details (Partners)`;
            taxBadge.style.cssText = `
                background: rgba(0, 50, 80, 0.6); border: 1px solid var(--neon-blue); color: var(--neon-blue);
                font-size: 0.8rem; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center; letter-spacing: 1px; font-family: monospace;cursor: pointer;
            `;
            taxBadge.onclick = () => {
                import('./PartnerDetailModal.js?v=' + Date.now()).then(({ PartnerDetailModal }) => {
                    const modal = new PartnerDetailModal(store, player.id, 'tax', { commanders: taxInfo });
                    document.body.appendChild(modal.render());
                });
            };
            cmdContainer.appendChild(taxBadge);

        } else {
            // Single Commander Tax
            taxInfo.forEach(t => {
                if (t.tax > 0) {
                    const taxBadge = document.createElement('div');
                    taxBadge.className = 'hud-badge';
                    taxBadge.innerHTML = `[ TAX +${t.tax} ]`;
                    taxBadge.title = `Commander Tax Details: +${t.tax}`;
                    taxBadge.style.cssText = `
                        background: rgba(0, 50, 80, 0.6); border: 1px solid var(--neon-blue); color: var(--neon-blue);
                        font-size: 0.8rem; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center; letter-spacing: 1px; font-family: monospace; cursor: pointer;
                    `;
                    taxBadge.onclick = () => {
                        import('./PartnerDetailModal.js?v=' + Date.now()).then(({ PartnerDetailModal }) => {
                            const modal = new PartnerDetailModal(store, player.id, 'tax', { commanders: taxInfo });
                            document.body.appendChild(modal.render());
                        });
                    };
                    cmdContainer.appendChild(taxBadge);
                }
            });
        }
    }

    // Player Counters (Poison, etc)
    const pCounters = player.counters || {};
    const counterEntries = Object.entries(pCounters).filter(([_, val]) => val !== 0);

    if (counterEntries.length > 1) {
        // Consolidated
        const badge = document.createElement('div');
        badge.className = 'hud-badge';
        badge.innerHTML = `[ Counters (${counterEntries.length}) ]`;
        badge.title = 'Click to view/edit counters';
        badge.style.cssText = `
            background: rgba(80, 30, 80, 0.6); border: 1px solid var(--neon-pink); color: var(--neon-pink);
            font-size: 0.8rem; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center; cursor: pointer;
        `;
        badge.onclick = () => {
            import('./PlayerCounterDetailModal.js?v=' + Date.now()).then(({ PlayerCounterDetailModal }) => {
                const modal = new PlayerCounterDetailModal(store, player.id, pCounters);
                document.body.appendChild(modal.render());
            });
        };
        cmdContainer.appendChild(badge);
    } else if (counterEntries.length === 1) {
        // Single
        const [name, count] = counterEntries[0];
        const badge = document.createElement('div');
        badge.className = 'hud-badge';
        badge.textContent = `${name}: ${count}`;
        badge.style.cssText = `
            background: rgba(80, 30, 80, 0.6); border: 1px solid var(--neon-pink); color: var(--neon-pink);
            font-size: 0.8rem; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center; cursor: pointer;
        `;
        badge.title = 'Click to edit';
        badge.onclick = () => {
            import('./PlayerCounterDetailModal.js?v=' + Date.now()).then(({ PlayerCounterDetailModal }) => {
                const modal = new PlayerCounterDetailModal(store, player.id, pCounters);
                document.body.appendChild(modal.render());
            });
        };
        cmdContainer.appendChild(badge);
    }

    // Player Attachments (Auras on Player)
    const allZones = store.getState().zones;
    Object.values(allZones).forEach(zList => {
        if (zList.battlefield) {
            zList.battlefield.forEach(c => {
                if (c.attachedTo === player.id) {
                    const badge = document.createElement('div');
                    badge.className = 'hud-badge';
                    badge.innerHTML = `<span style="font-size:1em;">⚔️</span> ${c.name}`;
                    badge.style.cssText = `
                        background: rgba(40, 40, 80, 0.6); border: 1px solid var(--border-color); color: #ddeeff;
                        font-size: 0.8rem; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center;
                        cursor: help;
                    `;
                    badge.title = `Enchanted by ${c.name}`;
                    cmdContainer.appendChild(badge);
                }
            });
        }
    });

    header.innerHTML = `
        <div class="p-info">
            <img src="${player.icon}" class="p-icon" style="height: 32px; width: 32px; object-fit: contain; margin-right: 0.5rem; filter: contrast(1.2) brightness(1.1);">
            <span class="glitch-text p-name-text" data-text="${player.name}" style="
                ${isActive ? 'color: var(--neon-blue); text-shadow: 0 0 5px var(--neon-blue);' : ''}
                cursor: pointer;
            " title="Click to Focus/Unfocus Field">${player.name} ${player.eliminated ? '(DEAD)' : (isActive ? '(Active)' : '')}</span>
            <span class="p-status">
                <span class="life-display hud-text-glow" style="cursor: pointer; color: var(--neon-pink); text-shadow: 0 0 5px var(--neon-pink);">HP: ${player.life}</span>
                <span class="hand-display hud-text-glow" style="cursor: pointer; color: var(--neon-blue);">HAND: ${player.handCount}</span>
                <span class="library-display hud-text-glow" style="cursor: pointer; color: #88ff88;">DECK: ${player.libraryCount || 0}</span>
            </span>
        </div>
        <div class="p-actions">
           <button class="action-btn" style="padding: 2px 8px; font-size: 0.8rem; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.5); color: var(--text-color);">Action ▼</button>
           <div class="action-menu">
               <button class="select-mode-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(255,255,255,0.1); color: white; border: 1px solid var(--border-color); cursor: pointer;">Select</button>
               <button class="filter-select-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(255,255,255,0.1); color: white; border: 1px solid var(--border-color); cursor: pointer;">Filter</button>
                <button class="add-card-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(255,255,255,0.1); color: white; border: 1px solid var(--border-color); cursor: pointer;">+ Card</button>
                <button class="token-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(255,255,255,0.1); color: white; border: 1px solid var(--border-color); cursor: pointer;">Create Token</button>
                <button class="manage-counter-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(255,255,255,0.1); color: white; border: 1px solid var(--border-color); cursor: pointer;">Player Counters</button>
                <div style="border-top: 1px solid #444; margin: 0.2rem 0;"></div>
                <button class="dice-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(0,100,200,0.2); color: #aef; border: 1px solid var(--border-color); cursor: pointer;">🎲 Dice Roll</button>
                <button class="coin-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(200,150,0,0.2); color: #fd8; border: 1px solid var(--border-color); cursor: pointer;">🪙 Coin Toss</button>
                <div style="border-top: 1px solid #444; margin: 0.2rem 0;"></div>
                <button class="game-stats-btn" style="padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; background: rgba(50,50,100,0.5); color: white; border: 1px solid var(--border-color); cursor: pointer;">Game Status</button>
            </div>
        </div>
    `;

    // Action Menu Toggle with Dynamic Positioning
    const actionBtn = header.querySelector('.action-btn');
    const actionMenu = header.querySelector('.action-menu');
    actionBtn.onclick = (e) => {
        e.stopPropagation();
        const isHidden = actionMenu.style.display === 'none';

        // Close others
        document.querySelectorAll('.action-menu').forEach(el => el.style.display = 'none');

        if (isHidden) {
            actionMenu.style.display = 'flex';

            // Dynamic Positioning Logic
            const rect = actionBtn.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // If button is in the lower 40% of the screen, open UP
            if (rect.bottom > viewportHeight * 0.6) {
                actionMenu.style.top = 'auto';
                actionMenu.style.bottom = '100%';
                actionMenu.style.marginBottom = '5px'; // Adjust spacing
                actionMenu.style.marginTop = '0';
            } else {
                // Otherwise open DOWN (Default)
                actionMenu.style.top = '100%';
                actionMenu.style.bottom = 'auto';
                actionMenu.style.marginBottom = '0';
                actionMenu.style.marginTop = '5px';
            }
        } else {
            actionMenu.style.display = 'none';
        }
    };

    // Game Stats Event
    const gameStatsBtn = header.querySelector('.game-stats-btn');
    gameStatsBtn.onclick = () => {
        actionMenu.style.display = 'none';
        import('./GameStatsModal.js?v=' + Date.now()).then(({ GameStatsModal }) => {
            const modal = new GameStatsModal(store);
            document.body.appendChild(modal.render());
        });
    };

    // Select Mode Button Style & Logic
    const selectBtn = header.querySelector('.select-mode-btn');
    const filterBtn = header.querySelector('.filter-select-btn');

    const isSelectionMode = store.getState().ui.selectionMode;
    if (isSelectionMode) {
        selectBtn.style.background = 'var(--neon-blue)';
        selectBtn.style.color = 'black';
        selectBtn.textContent = `Select (${store.getState().ui.selectedIds.length})`;
    } else {
        selectBtn.style.background = 'rgba(255,255,255,0.1)';
        selectBtn.style.color = 'white';
    }

    selectBtn.onclick = () => {
        store.dispatch('TOGGLE_SELECTION_MODE');
        actionMenu.style.display = 'none'; // Close menu
    };

    filterBtn.onclick = () => {
        actionMenu.style.display = 'none';
        import('./SelectFilterModal.js?v=' + Date.now()).then(({ SelectFilterModal }) => {
            const modal = new SelectFilterModal(store, player.id);
            document.body.appendChild(modal.render());
        });
    };

    header.querySelector('.p-status').appendChild(cmdContainer);

    // Player Name Click (Focus Toggle)
    header.querySelector('.p-name-text').addEventListener('click', (e) => {
        e.stopPropagation();
        store.dispatch('TOGGLE_PLAYER_FOCUS', { playerId: player.id });
    });

    // Life Click Event
    header.querySelector('.life-display').addEventListener('click', () => {
        import('./StatusModal.js?v=' + Date.now()).then(({ StatusModal }) => {
            const modal = new StatusModal(store, player.id, 'life', player.life);
            document.body.appendChild(modal.render());
        });
    });

    // Hand Drop Target
    const handDisplay = header.querySelector('.hand-display');
    handDisplay.addEventListener('dragover', (e) => {
        e.preventDefault();
        handDisplay.classList.add('drag-hover');
    });
    handDisplay.addEventListener('dragleave', () => {
        handDisplay.classList.remove('drag-hover');
    });
    handDisplay.addEventListener('drop', (e) => {
        e.preventDefault();
        handDisplay.classList.remove('drag-hover');
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            store.dispatch('MOVE_CARD', { cardId, sourceZone: 'battlefield', destination: 'hand', playerId: player.id });
        }
    });

    // Hand Click Event
    handDisplay.addEventListener('click', () => {
        const pZone = store.getState().zones[player.id];
        const hasDeck = pZone.library && pZone.library.length > 0;

        if (hasDeck) {
            import('./HandSimulatorModal.js?v=' + Date.now()).then(({ HandSimulatorModal }) => {
                const modal = new HandSimulatorModal(store, player.id);
                document.body.appendChild(modal.render());
            });
        } else {
            import('./HandStatusModal.js?v=' + Date.now()).then(({ HandStatusModal }) => {
                const modal = new HandStatusModal(store, player.id);
                document.body.appendChild(modal.render());
            });
        }
    });

    // Library Drop Target
    const libraryDisplay = header.querySelector('.library-display');
    libraryDisplay.addEventListener('dragover', (e) => {
        e.preventDefault();
        libraryDisplay.classList.add('drag-hover');
    });
    libraryDisplay.addEventListener('dragleave', () => {
        libraryDisplay.classList.remove('drag-hover');
    });
    libraryDisplay.addEventListener('drop', (e) => {
        e.preventDefault();
        libraryDisplay.classList.remove('drag-hover');
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            store.dispatch('MOVE_CARD', { cardId, sourceZone: 'battlefield', destination: 'library', playerId: player.id });
        }
    });

    // Library Click Event
    libraryDisplay.addEventListener('click', () => {
        import('./LibraryStatusModal.js?v=' + Date.now()).then(({ LibraryStatusModal }) => {
            const modal = new LibraryStatusModal(store, player.id);
            document.body.appendChild(modal.render());
        });
    });


    // Add Card Event
    header.querySelector('.add-card-btn').addEventListener('click', () => {
        actionMenu.style.display = 'none';
        import('./CardSearchModal.js?v=' + Date.now()).then(({ CardSearchModal }) => {
            const modal = new CardSearchModal(store, player.id);
            document.body.appendChild(modal.render());
        });
    });

    // Create Token Event
    header.querySelector('.token-btn').addEventListener('click', () => {
        actionMenu.style.display = 'none';
        import('./TokenModal.js?v=' + Date.now()).then(({ TokenModal }) => {
            const modal = new TokenModal(store, player.id);
            document.body.appendChild(modal.render());
        });
    });

    // Manage Counters Event
    header.querySelector('.manage-counter-btn').addEventListener('click', () => {
        actionMenu.style.display = 'none';
        import('./PlayerCounterModal.js?v=' + Date.now()).then(({ PlayerCounterModal }) => {
            const modal = new PlayerCounterModal(store, player.id);
            document.body.appendChild(modal.render());
        });
    });

    // Dice Button Event
    header.querySelector('.dice-btn').addEventListener('click', () => {
        actionMenu.style.display = 'none';
        import('./RandomizerModal.js').then(({ RandomizerModal }) => {
            const modal = new RandomizerModal('DICE');
            document.body.appendChild(modal.render());
        });
    });

    // Coin Button Event
    header.querySelector('.coin-btn').addEventListener('click', () => {
        actionMenu.style.display = 'none';
        import('./RandomizerModal.js').then(({ RandomizerModal }) => {
            const modal = new RandomizerModal('COIN');
            document.body.appendChild(modal.render());
        });
    });

    // Main Zones Container
    const zonesContainer = document.createElement('div');
    zonesContainer.className = 'player-zones';
    zonesContainer.style.cssText = 'flex: 1; display: flex; flex-direction: row; position: relative; overflow: hidden;';

    // Right-click on background (anywhere in zones) removed as per request.
    // Actions moved to Action Menu.
    zonesContainer.addEventListener('contextmenu', (e) => {
        // Prevent default browser menu if necessary, or just allow it since custom menu is gone?
        // Usually better to block default if it's a game board.
        if (e.target.closest('.card-on-board') || e.target.closest('.commander-zone') || e.target.closest('.used-zone')) return;
        e.preventDefault();
        // No custom menu shown.
    });

    // Get latest zone state
    const zones = store.getState().zones[player.id];

    // --- LEFT COLUMN: BATTLEFIELD ---
    const mainCol = document.createElement('div');
    mainCol.className = 'main-col';
    mainCol.style.cssText = 'flex: 1; display: flex; flex-direction: column; overflow: hidden;'; // Border right removed

    // Upper Zone (Creatures, Artifacts, Enchantments)
    const upperZone = document.createElement('div');
    upperZone.className = 'zone-upper';

    // Lower Zone (Lands)
    const lowerZone = document.createElement('div');
    lowerZone.className = 'zone-lower';

    // Render Cards
    if (zones && zones.battlefield) {
        zones.battlefield.forEach(card => {
            const cardEl = renderCard(card, store, player.id);
            if (card.isLand) {
                lowerZone.appendChild(cardEl);
            } else {
                upperZone.appendChild(cardEl);
            }
        });
    }

    mainCol.appendChild(upperZone);
    // Divider
    const landDivider = document.createElement('div');
    landDivider.className = 'hud-datastream-divider';
    mainCol.appendChild(landDivider);

    mainCol.appendChild(lowerZone);


    // --- RIGHT COLUMN: SIDEBAR (Commander & Used) ---
    const sideCol = document.createElement('div');
    sideCol.className = 'side-col';

    // Commander Zone
    const commanderZone = renderCommanderZone(player, store);
    // Note: CommanderZone internally might still have absolute styles, we will fix that in next step.
    // Overriding styles here just in case, or relying on the file update.

    // Used Zone (Use new logic below)
    // const grave = store.getState().zones[player.id].grave;
    // const usedCards = grave.filter(c => !c.isCommander);
    // const topUsed = usedCards.length > 0 ? usedCards[usedCards.length - 1] : null;

    // --- Graveyard Zone ---
    const usedZone = document.createElement('div');
    usedZone.className = 'zone-slot zone-grave';
    usedZone.title = 'Graveyard';

    // Drop Handler for Graveyard
    usedZone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
        usedZone.classList.add('drag-hover');
        e.dataTransfer.dropEffect = 'move';
    });
    usedZone.addEventListener('dragleave', () => {
        usedZone.classList.remove('drag-hover');
    });
    usedZone.addEventListener('drop', (e) => {
        e.preventDefault();
        usedZone.classList.remove('drag-hover');
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            store.dispatch('MOVE_CARD', { cardId, sourceZone: 'battlefield', destination: 'grave', playerId: player.id });
        }
    });

    const usedCards = store.getState().zones[player.id].grave || [];
    const topUsed = usedCards.length > 0 ? usedCards[usedCards.length - 1] : null;

    if (topUsed) {
        // Use separate div for BG image to allow filtering
        usedZone.innerHTML = `
            <div class="zone-bg-img" style="background-image: url('${topUsed.image_url}');"></div>
            <div class="zone-content">
                <span class="zone-count">${usedCards.length}</span>
                <span class="zone-label">GRAVE</span>
            </div>
        `;
    } else {
        usedZone.innerHTML = `
            <div class="zone-empty">
                <span style="font-size: 1.5rem; color: #555;">0</span>
                <span>GRAVE</span>
            </div>`;
    }

    usedZone.onclick = () => {
        import('./UsedListModal.js?v=' + Date.now()).then(({ UsedListModal }) => {
            const modal = new UsedListModal(store, player.id, 'grave');
            document.body.appendChild(modal.render());
        });
    };

    // --- Exile Zone ---
    const exileList = store.getState().zones[player.id].exile || [];
    const topExile = exileList.length > 0 ? exileList[exileList.length - 1] : null;

    const exileZone = document.createElement('div');
    exileZone.className = 'zone-slot zone-exile';
    exileZone.title = 'Exile Area';

    // Drop Handler for Exile
    exileZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        exileZone.classList.add('drag-hover');
        e.dataTransfer.dropEffect = 'move';
    });
    exileZone.addEventListener('dragleave', () => {
        exileZone.classList.remove('drag-hover');
    });
    exileZone.addEventListener('drop', (e) => {
        e.preventDefault();
        exileZone.classList.remove('drag-hover');
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId) {
            store.dispatch('MOVE_CARD', { cardId, sourceZone: 'battlefield', destination: 'exile', playerId: player.id });
        }
    });

    // Vortex Animation
    const vortex = document.createElement('div');
    vortex.className = 'exile-vortex';
    exileZone.appendChild(vortex);

    if (topExile) {
        // Use separate div for BG image to allow filtering
        exileZone.innerHTML += `
            <div class="zone-bg-img" style="background-image: url('${topExile.image_url}');"></div>
            <div class="zone-content">
                <span class="zone-count">${exileList.length}</span>
                <span class="zone-label">EXILE</span>
            </div>
        `;
    } else {
        exileZone.innerHTML += `
            <div class="zone-empty" style="z-index: 2; position: relative;">
                <span style="font-size: 1.5rem; color: #468;">${exileList.length}</span>
                <span>EXILE</span>
            </div>`;
    }

    exileZone.onclick = () => {
        import('./UsedListModal.js?v=' + Date.now()).then(({ UsedListModal }) => {
            const modal = new UsedListModal(store, player.id, 'exile');
            document.body.appendChild(modal.render());
        });
    };

    sideCol.appendChild(commanderZone);
    sideCol.appendChild(usedZone);
    sideCol.appendChild(exileZone);

    zonesContainer.appendChild(mainCol);

    // Vertical Separator
    const vSep = document.createElement('div');
    vSep.className = 'hud-separator-v';
    zonesContainer.appendChild(vSep);

    zonesContainer.appendChild(sideCol);

    playerArea.appendChild(header);

    // Header Separator
    const headerSep = document.createElement('div');
    headerSep.className = 'hud-separator-h';
    playerArea.appendChild(headerSep);

    playerArea.appendChild(zonesContainer);

    return playerArea;
}
