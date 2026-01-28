export function renderCommanderZone(player, store) {
    const zone = document.createElement('div');
    zone.className = 'commander-zone commander-zone-hud';
    // Styles moved to CSS (.commander-zone-hud)

    // Use live zone data instead of static player data
    const allCommandersInHelper = store.getState().zones[player.id].command || [];

    // Filter commanders: Those with 'commanderStatus' are strictly tracked, others are in Command Zone proper
    const activeCommanders = allCommandersInHelper.filter(c => !c.commanderStatus);
    const hiddenCommanders = allCommandersInHelper.filter(c => c.commanderStatus);

    activeCommanders.forEach(cmd => {
        const cmdCard = document.createElement('div');
        cmdCard.className = 'commander-card';
        // Basic Card Style
        cmdCard.style.cssText = `
            width: 80px; 
            height: 112px; 
            background-size: cover; 
            background-image: url(${cmd.image_url}); 
            background-color: #555;
            border-radius: 4px;
            cursor: pointer;
            pointer-events: auto;
            position: relative;
        `;

        // Drag Start
        cmdCard.draggable = true;
        cmdCard.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', cmd.id); // For existing simplified logic if any
            e.dataTransfer.setData('application/json', JSON.stringify({
                cardId: cmd.id,
                sourceZone: 'command',
                playerId: player.id,
                isCommander: true
            }));
            e.dataTransfer.effectAllowed = 'move';

            // Visual feedback
            cmdCard.style.opacity = '0.5';
            setTimeout(() => cmdCard.style.opacity = '1', 0); // Reset immediately but keep ghost? Or keep it dim?
            // Usually standard HTML5 drag keeps the element visible but creates a ghost.
            // If we dim it, we should restore it on dragend.
        };

        cmdCard.ondragend = () => {
            cmdCard.style.opacity = '1';
        };

        // Right click context menu (Confirmation to Cast)
        cmdCard.oncontextmenu = (e) => {
            e.preventDefault();
            import('./ConfirmationModal.js?v=' + Date.now()).then(({ ConfirmationModal }) => {
                const modal = new ConfirmationModal(
                    '統率者を戦場に出しますか？',
                    () => {
                        store.dispatch('CAST_COMMANDER', { playerId: player.id, cardId: cmd.id });
                    },
                    () => {
                        console.log('Cast cancelled');
                    }
                );
                document.body.appendChild(modal.render());
            });
        };

        // Left click detail view
        cmdCard.addEventListener('click', (e) => {
            console.log('Commander clicked:', cmd.name);
            import('./CardDetailModal.js').then(({ CardDetailModal }) => {
                const modal = new CardDetailModal(cmd);
                document.body.appendChild(modal.render());
            });
        });

        zone.appendChild(cmdCard);
    });

    // Drop Zone Logic (Accept only Commanders)
    zone.ondragover = (e) => {
        e.preventDefault(); // Essential to allow drop
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-hover');
    };

    zone.ondragleave = () => {
        zone.classList.remove('drag-hover');
    };

    zone.ondrop = (e) => {
        e.preventDefault();
        zone.classList.remove('drag-hover');

        let targetCardId = null;
        let sourceZone = 'battlefield';

        try {
            const raw = e.dataTransfer.getData('application/json');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.playerId === player.id && data.isCommander) {
                    targetCardId = data.cardId;
                    sourceZone = data.sourceZone || 'battlefield';
                }
            }
        } catch (err) { /* Ignore */ }

        // Fallback: Store lookup via ID
        if (!targetCardId) {
            const txtId = e.dataTransfer.getData('text/plain');
            if (txtId) {
                const pZone = store.getState().zones[player.id];
                // Check Battlefield
                if (pZone && pZone.battlefield) {
                    const found = pZone.battlefield.find(c => c.instanceId === txtId);
                    if (found && found.isCommander) {
                        targetCardId = found.instanceId;
                        sourceZone = 'battlefield';
                    }
                }
            }
        }

        if (targetCardId) {
            store.dispatch('MOVE_CARD', {
                playerId: player.id,
                cardId: targetCardId,
                destination: 'command',
                sourceZone: sourceZone
            });
        } else {
            console.warn('Commander Zone Drop Rejected: Not a valid commander.');
        }
    };

    if (activeCommanders.length === 0) {
        zone.classList.add('is-empty');
        zone.innerHTML = '<span style="font-size: 0.7rem; color: rgba(0, 243, 255, 0.6); letter-spacing: 1px;">NO COMMANDER</span>';
    } else {
        zone.classList.add('has-card');
    }

    // Check for commanders in other zones to display status
    const allZones = store.getState().zones[player.id];
    const locs = [];

    // 1. Add Status Commanders (Exile/Library stored in command zone with status)
    hiddenCommanders.forEach(c => {
        const labelMap = {
            'exile': '追放',
            'library': '山札'
        };
        locs.push({
            zone: 'command', // Physically in command array
            label: labelMap[c.commanderStatus] || c.commanderStatus,
            name: c.name,
            id: c.id,
            isStatus: true
        });
    });

    // 2. Helper to find cmd in normal zones (Grave / Hand)
    // Note: Exile is handled via commanderStatus now, so we don't scan 'exile' zone for commanders
    // Unless existing commanders are there? Assuming migration meant new moves use status.
    // We'll keep scanning 'exile' just in case of mixed state, or disable if strictly enforced.
    // User said: "Exile... do not add to list". So future moves won't be in zone['exile'].

    const findCmd = (zName, label) => {
        if (allZones[zName]) {
            allZones[zName].forEach(c => {
                if (c.isCommander) {
                    locs.push({
                        zone: zName,
                        label: label,
                        name: c.name,
                        id: c.instanceId || c.id
                    });
                }
            });
        }
    };

    findCmd('grave', '墓地');
    findCmd('hand', '手札');
    findCmd('exile', '追放');

    if (locs.length > 0) {
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            margin-top: 5px; width: 100%; text-align: center;
            font-size: 0.7rem; color: #aaa; background: rgba(0,0,0,0.5);
            padding: 4px; border-radius: 4px; pointer-events: auto;
            display: flex; flex-direction: column; gap: 4px;
        `;

        locs.forEach(item => {
            const span = document.createElement('div');
            span.innerHTML = `<span style="color:#8af; font-weight:bold;">${item.label}</span><br><span style="font-size:0.9em;">${item.name}</span>`;
            span.style.cssText = 'cursor: pointer; background: #222; border: 1px solid #444; border-radius: 3px; padding: 2px;';
            span.title = 'Click to move';

            span.onclick = (e) => {
                e.stopPropagation();
                // Open ZoneSelect
                import('./ZoneSelectModal.js').then(({ ZoneSelectModal }) => {
                    const modal = new ZoneSelectModal(
                        item.name,
                        (destination) => {
                            store.dispatch('MOVE_CARD', {
                                playerId: player.id,
                                cardId: item.id,
                                destination: destination,
                                sourceZone: item.zone
                            });
                        },
                        () => { },
                        { isCommander: true } // FORCE isCommander so they can move back to Command Zone
                    );
                    document.body.appendChild(modal.render());
                });
            };
            infoDiv.appendChild(span);
        });

        zone.appendChild(infoDiv);
    }

    return zone;
}
