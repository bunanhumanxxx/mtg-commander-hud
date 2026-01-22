import { generateId } from '../utils.js';

export class ContextMenu {
    constructor(store) {
        this.store = store;
        this.element = null;
    }

    show(x, y, type, targetId, playerId, data = {}) {
        this.close(); // Close existing

        this.element = document.createElement('div');
        this.element.className = 'hud-context-menu';
        this.element.style.position = 'fixed';
        this.element.style.top = `${y}px`;
        this.element.style.left = `${x}px`;
        this.element.style.zIndex = '2147483647';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.minWidth = '150px';

        let menuItems = [];

        let targetIds = Array.isArray(targetId) ? targetId : (targetId ? [targetId] : []);
        const isBatch = targetIds.length > 1;
        const primaryTargetId = targetIds[0];

        if (type === 'card') {
            // Check for Equipment or Aura (Single Target Only)
            const zone = this.store.getState().zones[playerId];
            const sourceZone = data.sourceZone || 'battlefield';
            const card = zone && zone[sourceZone] ? zone[sourceZone].find(c => c.instanceId === primaryTargetId) : null;

            // console.log('ContextMenu target:', targetIds, card); // DEBUG

            let isEquipOrAura = false;

            if (!isBatch && card) { // Only check for single target
                const typeLine = (card.type_line || '').toLowerCase();
                const printedType = (card.printed_type_line || '').toLowerCase();

                const checkType = (t) => {
                    return t.includes('equipment') || t.includes('aura') ||
                        t.includes('装備品') || t.includes('オーラ') ||
                        (t.includes('enchantment') && t.includes('creature')) ||
                        (t.includes('エンチャント') && t.includes('クリーチャー'));
                };

                isEquipOrAura = checkType(typeLine) || checkType(printedType);

                if (!isEquipOrAura && card.card_faces && Array.isArray(card.card_faces)) {
                    isEquipOrAura = card.card_faces.some(face => {
                        const fType = (face.type_line || '').toLowerCase();
                        const fPType = (face.printed_type_line || '').toLowerCase();
                        return checkType(fType) || checkType(fPType);
                    });
                }
            }

            if (sourceZone === 'grave' || sourceZone === 'exile') {
                menuItems = [
                    { label: isBatch ? `Move / Remove (${targetIds.length})` : 'Move / Remove', action: 'DELETE_CARD' }
                ];
            } else {
                menuItems = [
                    { label: isBatch ? `Tap / Untap (${targetIds.length})` : 'Tap / Untap', action: 'TOGGLE_TAP' },
                    { label: isBatch ? `Copy Card (${targetIds.length})` : 'Copy Card', action: 'CREATE_EVIL_TWIN' },
                    { label: isBatch ? `Manage Counters (${targetIds.length})` : 'Manage Counters', action: 'OPEN_COUNTER_MODAL' },
                    { label: `Modify Status${isBatch ? ' (Single)' : ''}`, action: 'OPEN_STATUS_MODAL' },
                    { label: isBatch ? `Delete (${targetIds.length})` : 'Delete', action: 'DELETE_CARD' }
                ];

                if (isEquipOrAura) {
                    menuItems.splice(1, 0, { label: 'Equip / Aura', action: 'EQUIP_OR_AURA', card: card });
                }

                if (!isBatch) {
                    // Add Control Change Option (Single Target Only)
                    menuItems.splice(menuItems.length - 1, 0, { label: 'Control', action: 'CHANGE_CONTROL', card: card });
                }
            }

        } else if (type === 'commander') {
            menuItems = [
                { label: 'Cast to Battlefield', action: 'CAST_COMMANDER' }
            ];
        } else if (type === 'board') {
            menuItems = [
                { label: 'Create Token', action: 'OPEN_TOKEN_MODAL' },
                { label: 'Player Counters', action: 'OPEN_PLAYER_COUNTER_MODAL' }
            ];
        }

        menuItems.forEach(item => {
            const btn = document.createElement('button');
            btn.textContent = item.label;
            btn.className = 'hud-context-item';

            btn.onclick = () => {
                if (item.action === 'OPEN_COUNTER_MODAL') {
                    import('./CounterModal.js?v=' + Date.now()).then(({ CounterModal }) => {
                        // Pass Array if batch, or assume CounterModal logic will be updated
                        const modal = new CounterModal(this.store, playerId, isBatch ? targetIds : primaryTargetId);
                        document.body.appendChild(modal.render());
                    });
                } else if (item.action === 'CHANGE_CONTROL') {
                    import('./ControlSelectModal.js?v=' + Date.now()).then(({ ControlSelectModal }) => {
                        const modal = new ControlSelectModal(this.store, item.card, playerId);
                        document.body.appendChild(modal.render());
                    });
                } else if (item.action === 'OPEN_TOKEN_MODAL') {
                    import('./TokenModal.js?v=' + Date.now()).then(({ TokenModal }) => {
                        const modal = new TokenModal(this.store, playerId);
                        document.body.appendChild(modal.render());
                    });
                } else if (item.action === 'OPEN_PLAYER_COUNTER_MODAL') {
                    import('./PlayerCounterModal.js?v=' + Date.now()).then(({ PlayerCounterModal }) => {
                        const modal = new PlayerCounterModal(this.store, playerId);
                        document.body.appendChild(modal.render());
                    });
                } else if (item.action === 'OPEN_STATUS_MODAL') {
                    import('./CardStatusModal.js?v=' + Date.now()).then(({ CardStatusModal }) => {
                        const target = isBatch ? targetIds[0] : primaryTargetId;
                        const modal = new CardStatusModal(this.store, playerId, target);
                        document.body.appendChild(modal.render());
                    });
                } else if (item.action === 'CREATE_EVIL_TWIN') {
                    targetIds.forEach(id => {
                        this.store.dispatch('CLONE_CARD', { playerId, cardId: id });
                    });
                } else if (item.action === 'CAST_COMMANDER') {
                    this.store.dispatch('CAST_COMMANDER', { playerId, cardIndex: data.index });
                } else if (item.action === 'EQUIP_OR_AURA') {
                    // Logic handles single target (primaryTargetId)
                    // ... (Existing Equip/Aura Logic, Copy paste to ensure safety or just rely on replacement covering it)
                    // I need to include the Logic here because I'm replacing the whole block.
                    // The original block lines 108-154.
                    const card = item.card;
                    const typeLine = (card.type_line || '').toLowerCase();
                    const printedType = (card.printed_type_line || '').toLowerCase();
                    const isEquip = typeLine.includes('equipment') || printedType.includes('装備品');

                    let candidates = [];
                    const state = this.store.getState();

                    if (isEquip) {
                        const myPlayer = state.players.find(p => p.id === playerId);
                        const myZone = state.zones[playerId];
                        candidates = myZone.battlefield.filter(c => {
                            if (c.instanceId === primaryTargetId) return false;
                            const t = (c.type_line || '').toLowerCase();
                            const pt = (c.printed_type_line || '').toLowerCase();
                            const isCreature = t.includes('creature') || pt.includes('クリーチャー');
                            return isCreature || c.isCommander;
                        }).map(c => ({ ...c, _ownerName: myPlayer.name, _ownerId: playerId }));
                    } else {
                        state.players.forEach(p => {
                            candidates.push({
                                instanceId: p.id,
                                name: `Player: ${p.name}`,
                                image_url: null,
                                type_line: 'Player',
                                _ownerName: p.name,
                                _ownerId: p.id,
                                _isPlayer: true
                            });
                            const pZone = state.zones[p.id];
                            if (pZone && pZone.battlefield) {
                                const pCards = pZone.battlefield.map(c => ({ ...c, _ownerName: p.name, _ownerId: p.id }));
                                candidates = candidates.concat(pCards);
                            }
                        });
                        candidates = candidates.filter(c => c.instanceId !== primaryTargetId);
                    }

                    import('./TargetSelectModal.js?v=' + Date.now()).then(({ TargetSelectModal }) => {
                        const modal = new TargetSelectModal(
                            candidates,
                            (selectedTargetId) => {
                                this.store.dispatch('ATTACH_CARD', { playerId, sourceId: primaryTargetId, targetId: selectedTargetId });
                            },
                            () => console.log('Selection cancelled')
                        );
                        document.body.appendChild(modal.render());
                    });

                } else if (item.action === 'DELETE_CARD') {
                    // 1. Resolve Targets across ALL players
                    const state = this.store.getState();
                    const allTargets = [];
                    const sourceZone = data.sourceZone || 'battlefield';

                    state.players.forEach(p => {
                        const zone = state.zones[p.id];
                        if (zone && zone[sourceZone]) {
                            zone[sourceZone].forEach(c => {
                                if (targetIds.includes(c.instanceId) || targetIds.includes(c.id)) { // support both ID types if needed
                                    allTargets.push({ card: c, ownerId: p.id, ownerName: p.name });
                                }
                            });
                        }
                    });

                    if (allTargets.length === 0) return;

                    import('./ZoneSelectModal.js?v=' + Date.now()).then(async ({ ZoneSelectModal }) => {
                        // Separate Commanders and Others
                        const commanders = allTargets.filter(t => t.card.isCommander);
                        const others = allTargets.filter(t => !t.card.isCommander);

                        // 1. Batch Process Others
                        if (others.length > 0) {
                            await new Promise((resolve) => {
                                const modal = new ZoneSelectModal(
                                    others.length > 1 ? `${others.length} Cards` : `${others[0].card.name}`,
                                    (destination) => {
                                        others.forEach(t => {
                                            this.store.dispatch('MOVE_CARD', { playerId: t.ownerId, cardId: t.card.instanceId, destination, sourceZone });
                                        });
                                        setTimeout(resolve, 200);
                                    },
                                    () => {
                                        console.log('Batch delete cancelled');
                                        setTimeout(resolve, 200);
                                    },
                                    { isCommander: false }
                                );
                                document.body.appendChild(modal.render());
                            });
                        }

                        // 2. Individual Process for Commanders
                        for (const t of commanders) {
                            await new Promise((resolve) => {
                                const modal = new ZoneSelectModal(
                                    t.card.name,
                                    (destination) => {
                                        this.store.dispatch('MOVE_CARD', { playerId: t.ownerId, cardId: t.card.instanceId, destination, sourceZone });
                                        setTimeout(resolve, 200);
                                    },
                                    () => {
                                        console.log('Commander delete cancelled', t.card.name);
                                        setTimeout(resolve, 200);
                                    },
                                    { isCommander: true }
                                );
                                document.body.appendChild(modal.render());
                            });
                        }

                        this.store.dispatch('CLEAR_SELECTION');

                        // Close parent modal if requested (e.g. UsedListModal)
                        if (data.onActionCompleted) {
                            data.onActionCompleted();
                        }
                    });

                } else {
                    // TOGGLE_TAP etc
                    targetIds.forEach(id => {
                        this.store.dispatch(item.action, { playerId, cardId: id });
                    });
                }
                this.close();
            };
            this.element.appendChild(btn);
        });


        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick);
            document.addEventListener('contextmenu', this.handleOutsideClick);
        }, 0);

        document.body.appendChild(this.element);

        // Boundary Check
        const rect = this.element.getBoundingClientRect();
        const winH = window.innerHeight;
        const winW = window.innerWidth;

        if (rect.bottom > winH) {
            // Flip to top if it goes off bottom
            const newTop = y - rect.height;
            this.element.style.top = `${Math.max(0, newTop)}px`;
        }

        if (rect.right > winW) {
            const newLeft = x - rect.width;
            this.element.style.left = `${Math.max(0, newLeft)}px`;
        }
    }

    handleOutsideClick = (e) => {
        if (!this.element || this.element.contains(e.target)) return;
        this.close();
    }

    close() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('contextmenu', this.handleOutsideClick);
    }
}
