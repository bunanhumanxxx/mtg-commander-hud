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
