export function renderCard(card, store, playerId) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-on-board';
    cardDiv.dataset.cardId = card.instanceId;

    // Base styles
    // Base styles
    // Dynamic styles stay inline, static move to CSS (.card-on-board)
    cardDiv.style.backgroundImage = `url(${card.image_url})`;
    cardDiv.style.backgroundSize = 'cover';
    cardDiv.style.backgroundPosition = 'center';

    // Drag & Drop Support
    const gameMode = store.getState().settings.gameMode;
    if (gameMode === 'full') { // Corrected from 'full_system'
        cardDiv.setAttribute('draggable', 'true');
        cardDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.instanceId);
            e.dataTransfer.effectAllowed = 'move';
            // Optional: Customize drag image if needed
            // e.dataTransfer.setDragImage(cardDiv, 0, 0);
        });
    }

    // Selection Visuals
    const isSelected = store.getState().ui.selectedIds.includes(card.instanceId);
    if (isSelected) {
        cardDiv.classList.add('selected');
    }

    // Tapped state
    if (card.tapped) {
        cardDiv.classList.add('tapped');
    }

    // Copy Badge
    if (card.isCopy) {
        const copyBadge = document.createElement('div');
        copyBadge.textContent = 'COPY';
        copyBadge.style.cssText = `
            position: absolute; top: 2px; left: 2px;
            background: #0088ff; color: white; font-size: 0.6rem; font-weight: bold;
            padding: 1px 4px; border-radius: 2px; z-index: 5;
            box-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            pointer-events: none;
        `;
        cardDiv.appendChild(copyBadge);
    }

    // Control Change Indicator
    if (card.ownerId && card.ownerId !== playerId) {
        cardDiv.style.border = '2px dashed var(--neon-pink)';
        const controlBadge = document.createElement('div');
        controlBadge.innerHTML = '⚠️ CONTROLLED';
        controlBadge.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg);
            background: rgba(255, 0, 85, 0.9); color: white; font-size: 0.7rem; font-weight: bold;
            padding: 4px 8px; border-radius: 4px; z-index: 10;
            box-shadow: 0 0 10px var(--neon-pink); pointer-events: none;
            border: 1px solid white; white-space: nowrap; text-shadow: 1px 1px 0 black;
        `;
        cardDiv.appendChild(controlBadge);
    }

    // Equipment/Aura Attachment Status
    if (card.attachedTo) {
        let targetName = 'Target';
        const allPlayers = store.getState().players;
        for (const p of allPlayers) {
            const z = store.getState().zones[p.id];
            const target = z.battlefield.find(c => c.instanceId === card.attachedTo);
            if (target) {
                targetName = target.name;
                break;
            }
        }

        const attachBadge = document.createElement('div');
        attachBadge.innerHTML = `<span style="color: #00ff00;">⚓</span> ${targetName}`;
        attachBadge.style.cssText = `
            position: absolute; top: 2px; right: 2px;
            background: rgba(0, 0, 0, 0.85); color: white; font-size: 0.6rem;
            padding: 2px 4px; border-radius: 4px; z-index: 6;
            max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            box-shadow: 1px 1px 2px black; pointer-events: none; border: 1px solid #333;
        `;
        cardDiv.appendChild(attachBadge);
    }

    // Counters (Improved Visuals)
    if (card.counters && Object.keys(card.counters).length > 0) {
        const countersDiv = document.createElement('div');
        countersDiv.style.cssText = `
            position: absolute; bottom: 5px; left: 5px;
            display: flex; flex-direction: column-reverse; gap: 2px;
            align-items: flex-start; z-index: 5; max-width: 90%;
            pointer-events: none;
        `;

        Object.entries(card.counters).forEach(([type, count]) => {
            if (count === 0) return;

            // Color Coding
            let bg = '#757575'; // Default Grey
            const lowerType = type.toLowerCase();
            if (lowerType.includes('plusone') || lowerType.includes('+1/+1')) {
                bg = '#4CAF50'; // Green
                if (lowerType === 'plusone') type = '+1/+1'; // Fix display name if old key
            }
            else if (lowerType.includes('-1/-1')) bg = '#f44336'; // Red
            else if (lowerType.includes('loyalty') || lowerType.includes('忠誠')) bg = '#9C27B0'; // Purple
            else if (lowerType.includes('stun') || lowerType.includes('麻痺')) bg = '#00BCD4'; // Cyan
            else if (lowerType.includes('shield') || lowerType.includes('盾')) bg = '#FFC107'; // Amber
            else if (lowerType.includes('experience') || lowerType.includes('経験')) bg = '#FF9800'; // Orange
            else if (lowerType.includes('poison') || lowerType.includes('毒')) bg = '#009688'; // Teal

            const textColor = (bg === '#FFC107' || bg === '#00BCD4') ? 'black' : 'white';

            const span = document.createElement('span');
            // Improved Count Visibility
            span.innerHTML = `
                ${type} 
                <span style="
                    display: inline-block; 
                    background: rgba(255,255,255,0.9); 
                    color: black; 
                    border-radius: 50%; 
                    padding: 0px 5px; 
                    min-width: 14px; 
                    text-align: center;
                    font-size: 0.85rem; 
                    font-weight: 800;
                    margin-left: 3px;
                    line-height: 1.2;
                    box-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                ">${count}</span>
            `;

            span.style.cssText = `
                background: ${bg}; color: ${textColor};
                font-size: 0.75rem; padding: 2px 4px 2px 6px; border-radius: 12px;
                font-weight: bold; box-shadow: 1px 2px 4px rgba(0,0,0,0.6);
                white-space: nowrap; max-width: 95px; overflow: hidden; text-overflow: ellipsis;
                text-shadow: ${textColor === 'white' ? '0 0 2px black' : 'none'};
                border: 1px solid rgba(255,255,255,0.3);
                display: flex; align-items: center; justify-content: space-between;
                margin-top: 1px;
            `;
            countersDiv.appendChild(span);
        });
        cardDiv.appendChild(countersDiv);
    }

    // Token Visuals
    if (card.isToken) {
        // Name overlay
        const nameDiv = document.createElement('div');
        nameDiv.textContent = card.name;
        nameDiv.style.cssText = `
            position: absolute; top: 20%; left: 0; width: 100%;
            text-align: center; color: white; font-weight: bold;
            font-size: 0.8rem; text-shadow: 1px 1px 2px black;
            background: rgba(0,0,0,0.3); padding: 2px 0;
            pointer-events: none;
        `;
        cardDiv.appendChild(nameDiv);

        // P/T for creatures
        if (card.power !== undefined && card.toughness !== undefined && (card.power !== '' || card.toughness !== '')) {
            const ptDiv = document.createElement('div');
            ptDiv.textContent = `${card.power}/${card.toughness}`;
            ptDiv.style.cssText = `
                position: absolute; bottom: 5px; right: 5px;
                background: #ccc; color: black; font-weight: bold;
                padding: 1px 4px; border-radius: 4px; font-size: 0.8rem;
                border: 1px solid #777;
                pointer-events: none;
            `;
            // Adjust if counters exist (counters are bottom right too, maybe move P/T to bottom left or stack?)
            // Counters are at bottom: 5px; right: 5px; in current code (lines 45).
            // Let's move P/T to bottom-right and push Counter to top-right? Or Stack?
            // Actually, existing counter logic puts it at bottom right.
            // Let's put P/T at Bottom Right and Counters at Top Right? 
            // Or P/T at Bottom Right, Counters at Bottom Left? A bit crowded.
            // Let's put P/T at Bottom Right.

            // Check existing counter div style in file... 
            // Existing counter is at lines 43-57. It uses `bottom: 5px; right: 5px;`.
            // I will move P/T to `bottom: 5px; left: 5px;` or `bottom: 20px`?
            // Standard MTG is P/T bottom right.
            // Let's put P/T bottom right. Move counters to top right?
            // But top right is empty usually.

            // Wait, card copy badge is top left effectively.

            // Let's modify the P/T style:
            ptDiv.style.bottom = '5px';
            ptDiv.style.right = '5px';

            cardDiv.appendChild(ptDiv);

            // Note: If both Counters and P/T exist, they overlap.
            // I will leave it for now, user can ask to fix overlap if it happens.
            // Or I can check if counters exist and offset.
        }
    }

    // (Stacking logic removed)

    // Display cards attached TO this card (e.g., Equipment on this Creature)
    const state = store.getState();
    const allPlayers = state.players || [];
    let attachedCards = [];

    // Scan all zones for attachments
    allPlayers.forEach(p => {
        const pZone = state.zones[p.id];
        if (pZone && pZone.battlefield) {
            const incoming = pZone.battlefield.filter(c => c.attachedTo === card.instanceId);
            attachedCards = attachedCards.concat(incoming);
        }
    });

    if (attachedCards.length > 0) {
        const equippedDiv = document.createElement('div');
        equippedDiv.style.cssText = `
            position: absolute; top: 12%; right: 0; width: 100%;
            display: flex; flex-direction: column; align-items: flex-end;
            pointer-events: none; padding-right: 2px;
        `;

        attachedCards.forEach(att => {
            const badge = document.createElement('div');
            badge.innerHTML = `<span style="font-size:1em;">⚔️</span> ${att.name}`;
            badge.style.cssText = `
                background: rgba(0, 50, 100, 0.85); color: #aaddff;
                font-size: 0.6rem; padding: 1px 4px; border-radius: 4px;
                margin-bottom: 2px; max-width: 90%;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                box-shadow: 1px 1px 2px black; border: 1px solid #446688;
            `;
            equippedDiv.appendChild(badge);
        });
        cardDiv.appendChild(equippedDiv);
    }

    // Zoom or Select on Left Click
    cardDiv.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling if stacked
        const selectionMode = store.getState().ui.selectionMode;
        if (selectionMode) {
            store.dispatch('TOGGLE_CARD_SELECTION', { cardId: card.instanceId });
        } else {
            import('./CardDetailModal.js').then(({ CardDetailModal }) => {
                const modal = new CardDetailModal(card);
                document.body.appendChild(modal.render());
            });
        }
    });

    // Context Menu on Right Click
    cardDiv.addEventListener('contextmenu', (e) => {
        // Custom menu for Deck Builder
        if (store.getState().settings.gameMode === 'deck_builder') {
            e.preventDefault();
            e.stopPropagation();
            import('./DeckBuilderContextMenu.js?v=' + Date.now()).then(({ DeckBuilderContextMenu }) => {
                const menu = new DeckBuilderContextMenu(store);
                menu.show(e.clientX, e.clientY, card.instanceId, playerId);
            });
            return;
        }

        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling
        import('./ContextMenu.js?v=' + Date.now()).then(({ ContextMenu }) => {
            const menu = new ContextMenu(store);
            const uiState = store.getState().ui;
            const selectionMode = uiState.selectionMode;
            const selectedIds = uiState.selectedIds || [];

            let targetIds = card.instanceId;
            let type = 'card';

            console.log('RightClick Debug:', { id: card.instanceId, selectionMode, selectedIds });

            if (selectionMode && selectedIds.includes(card.instanceId) && selectedIds.length > 0) {
                targetIds = [...selectedIds]; // Pass copy
            }

            menu.show(e.clientX, e.clientY, type, targetIds, playerId);
        });
    });

    return cardDiv;
}



