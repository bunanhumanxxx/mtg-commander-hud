import { generateId, shuffle } from './utils.js';

export class Store {
    constructor() {
        this.state = {
            players: [], // { id, name, life, handCount, commanderDamage: {}, commanders: [], mulliganCount: 0 }
            zones: {}, // { playerId: { battlefield: [], grave: [], exile: [], command: [], hand: [] } }
            turn: {
                count: 1,
                activePlayerId: null,
                phase: 'main'
            },
            logs: [],
            gameStarted: false,
            settings: {
                playerCount: 4,
                startingLife: 40,
                gameMode: 'full' // 'full' or 'life_counter'
            },
            ui: {
                selectionMode: false,
                selectedIds: [],
                focusedPlayerId: null
            }
        };
        this.subscribers = [];
        this.history = []; // Undo stack
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    notify() {
        this.subscribers.forEach(cb => cb(this.state));
    }

    dispatch(action, payload) {
        console.log('Action:', action, payload);

        // History Management
        const NO_HISTORY = ['UNDO', 'INIT_GAME', 'RESTART_GAME'];
        if (!NO_HISTORY.includes(action) && this.state.gameStarted) {
            // Deep Copy State
            const stateSnapshot = JSON.parse(JSON.stringify(this.state));
            this.history.push(stateSnapshot);
            // Limit history
            if (this.history.length > 20) {
                this.history.shift();
            }
        }

        switch (action) {
            case 'UNDO':
                this._undo();
                break;
            // ... (rest of switch)

            case 'INIT_GAME':
                this._initGame(payload);
                document.body.classList.add('game-active');
                break;
            case 'UPDATE_LIFE':
                this._updateLife(payload);
                break;
            case 'UPDATE_HAND':
                this._updateHand(payload);
                break;
            case 'LOG_ACTION':
                this._log(payload);
                break;
            case 'UPDATE_COMMANDER_DAMAGE':
                this._updateCommanderDamage(payload);
                break;
            case 'ADD_CARD_TO_BATTLEFIELD':
                this._addCard(payload);
                break;
            case 'TOGGLE_TAP':
                this._toggleTap(payload);
                break;
            case 'ADD_COUNTER':
            case 'MODIFY_CARD_COUNTER':
                this._modifyCounter(payload);
                break;
            case 'DELETE_CARD':
                this._deleteCard(payload);
                break;
            case 'CLONE_CARD':
                this._cloneCard(payload);
                break;
            case 'UPDATE_CARD_PROPERTY':
                this._updateCardProperty(payload);
                break;
            case 'NEXT_TURN':
                this._nextTurn();
                break;
            case 'RESTART_GAME':
                this._restartGame();
                break;
            case 'CAST_COMMANDER':
                this._castCommander(payload);
                break;
            case 'TOGGLE_NO_MAX_HAND':
                this._toggleNoMaxHand(payload);
                break;
            case 'MOVE_CARD':
                this._moveCard(payload);
                break;
            case 'ATTACH_CARD':
                this._attachCard(payload);
                break;
            case 'ADD_TOKEN':
                this._addToken(payload);
                break;
            case 'UPDATE_PLAYER_COUNTER':
                this._updatePlayerCounter(payload);
                break;
            case 'TOGGLE_SELECTION_MODE':
                this._toggleSelectionMode();
                break;
            case 'TOGGLE_CARD_SELECTION':
                this._toggleCardSelection(payload);
                break;
            case 'CLEAR_SELECTION':
                this._clearSelection();
                break;
            case 'SELECT_MULTIPLE_CARDS':
                this._selectMultipleCards(payload);
                break;
            case 'ADD_MEMO':
                this._addMemo(payload);
                break;
            case 'UPDATE_CARD_STATUS':
                this._updateCardStatus(payload);
                break;
            case 'ADJUST_LIBRARY':
                this._adjustLibrary(payload);
                break;
            case 'ADJUST_HAND_COMPLEX':
                this._adjustHandComplex(payload);
                break;
            case 'CHANGE_CONTROL':
                this._changeControl(payload);
                break;
            case 'TOGGLE_PLAYER_FOCUS':
                this._togglePlayerFocus(payload);
                break;
            case 'LOAD_DECK_DATA':
                this._loadDeckData(payload);
                break;
            case 'ADD_CARD_TO_DECK':
                this._addCardToDeck(payload);
                break;
            case 'TEST_INIT_HAND':
                this._testInitHand(payload);
                break;
            case 'TEST_MULLIGAN':
                this._testMulligan(payload);
                break;
            case 'TEST_DRAW':
                this._testDraw(payload);
                break;
            case 'TEST_SEARCH':
                this._testSearch(payload);
                break;
            case 'TEST_USE':
                this._testUse(payload);
                break;
            // Add more actions as needed
        }

        this.notify();
    }

    _undo() {
        if (this.history.length > 0) {
            const prevState = this.history.pop();
            this.state = prevState;
            this._log('🔄 Undid last action.');
        } else {
            console.log('No history to undo');
            // Show Popup
            const popup = document.createElement('div');
            popup.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9); color: #ff5555; padding: 1rem 2rem;
                border: 2px solid #ff5555; border-radius: 8px; z-index: 99999;
                font-size: 1.2rem; font-weight: bold; box-shadow: 0 0 20px rgba(255, 0, 0, 0.4);
                text-align: center;
            `;
            popup.innerHTML = `
                <div>⚠️ UNDO LIMIT REACHED</div>
                <div style="font-size: 0.8rem; color: #ccc; margin-top: 0.5rem;">Cannot undo further (Max 20 steps).</div>
            `;
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 2000);
        }
    }

    _updateCardStatus({ playerId, cardId, power, toughness, type, isReset }) {
        const zone = this.state.zones[playerId];
        const card = zone.battlefield.find(c => c.instanceId === cardId);
        if (!card) return;

        if (!card.original_stats) {
            // Save initial stats if not saved yet
            card.original_stats = {
                power: card.power,
                toughness: card.toughness,
                type_line: card.type_line
            };
        }

        if (isReset) {
            card.power = card.original_stats.power;
            card.toughness = card.original_stats.toughness;
            card.type_line = card.original_stats.type_line;
            delete card.original_stats; // Remove backup so next edit saves new baseline? Or keep? Usually reset implies going back to base.
            this._log(`${this.state.players.find(p => p.id === playerId).name} reset status of ${card.name}.`);
        } else {
            if (power !== undefined && power !== '') card.power = power;
            if (toughness !== undefined && toughness !== '') card.toughness = toughness;

            if (type && type.trim()) {
                card.type_line = `${card.type_line} ${type.trim()}`;
            }

            this._log(`${this.state.players.find(p => p.id === playerId).name} updated status of {${card.name}}. P/T: ${card.power}/${card.toughness}, Type: ${card.type_line}`);
        }
    }

    _attachCard({ playerId, sourceId, targetId }) {
        // Find source card (should be on battlefield)
        const state = this.state;
        const sourceZone = state.zones[playerId].battlefield;
        const sourceCard = sourceZone.find(c => c.instanceId === sourceId);

        if (!sourceCard) {
            console.error('Attach source not found:', sourceId);
            return;
        }

        // Find target card (could be any player's battlefield)
        let targetCard = null;
        let targetPlayerName = '';
        let targetName = '';

        // Try to find target as a Card
        for (const p of state.players) {
            const z = state.zones[p.id].battlefield;
            const found = z.find(c => c.instanceId === targetId);
            if (found) {
                targetCard = found;
                targetPlayerName = p.name;
                targetName = targetCard.name;
                break;
            }
        }

        // If not a card, check if it's a Player
        if (!targetCard) {
            const targetPlayer = state.players.find(p => p.id === targetId);
            if (targetPlayer) {
                targetName = targetPlayer.name;
                targetPlayerName = targetPlayer.name; // Owner is self
            } else {
                console.error('Attach target not found (Card or Player):', targetId);
                return;
            }
        }

        // Update state (Toggle / Unequip logic)
        if (sourceCard.attachedTo === targetId) {
            // Unequip
            delete sourceCard.attachedTo;
            this._log(`${state.players.find(p => p.id === playerId).name}'s {${sourceCard.name}} unequipped from ${targetName}.`);
        } else {
            // Equip
            sourceCard.attachedTo = targetId;
            this._log(`${state.players.find(p => p.id === playerId).name}'s {${sourceCard.name}} attached to ${targetName} (${targetPlayerName}).`);
        }
    }

    _addToken({ playerId, tokenData }) {
        const zone = this.state.zones[playerId];
        const { name, color, type_line, power, toughness, count } = tokenData;

        // Use a placeholder image or generic style
        const imageUrl = `https://via.placeholder.com/223x310/${this._getColorHex(color)}/ffffff?text=${encodeURIComponent(name)}`;

        for (let i = 0; i < count; i++) {
            const token = {
                id: (Math.random().toString(36).substr(2, 9)), // Simple ID gen if generateId not imported in context, but class has imports
                instanceId: (Math.random().toString(36).substr(2, 9)),
                // Wait, generateId is imported at top of store.js. I should use it.
                // But replace_file_content might not see import if I don't change top.
                // Assuming generateId is available as it was in file view.
                name: name,
                type_line: type_line,
                power: power,
                toughness: toughness,
                image_url: imageUrl,
                isToken: true,
                tapped: false,
                counters: {},
                color_identity: [color]
            };
            // Use local generateId wrapper if available or assume global from import?
            // "import { generateId, shuffle } from './utils.js';" is at line 1.
            // So I can use generateId().
            token.id = generateId();
            token.instanceId = generateId();

            zone.battlefield.push(token);
        }

        this._log(`${this.state.players.find(p => p.id === playerId).name} created ${count} {${name}} token(s).`);
    }

    _updatePlayerCounter({ playerId, counterName, count }) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return;

        if (!player.counters) player.counters = {};

        const current = player.counters[counterName] || 0;
        player.counters[counterName] = current + count;

        // Clean up checking
        if (player.counters[counterName] <= 0) {
            delete player.counters[counterName];
        }

        this._log(`${player.name} got ${count > 0 ? '+' : ''}${count} ${counterName} counter(s) (Total: ${player.counters[counterName] || 0}).`);
        this.notify(); // Ensure UI updates
    }

    _getColorHex(code) {
        const colors = {
            'W': 'F8F6D8', 'U': 'C1D7E9', 'B': 'BAB1AB',
            'R': 'E49977', 'G': '9EA48D', 'C': 'D8D8D8', 'M': 'D8BC7E'
        };
        return colors[code] || 'CCCCCC';
    }

    _toggleSelectionMode() {
        this.state.ui.selectionMode = !this.state.ui.selectionMode;
        if (!this.state.ui.selectionMode) {
            this.state.ui.selectedIds = [];
        }
        // Log removed
    }

    _toggleCardSelection({ cardId }) {
        const idx = this.state.ui.selectedIds.indexOf(cardId);
        if (idx > -1) {
            this.state.ui.selectedIds.splice(idx, 1);
        } else {
            this.state.ui.selectedIds.push(cardId);
        }
    }

    _selectMultipleCards({ cardIds }) {
        this.state.ui.selectionMode = true;
        this.state.ui.selectedIds = [...cardIds];
        // Log removed
    }

    _clearSelection() {
        this.state.ui.selectedIds = [];
    }

    // ... (existing code) ...

    _moveCard({ playerId, cardId, destination, sourceZone }) {
        console.log(`_moveCard called: Player ${playerId}, Card ${cardId}, Dest ${destination}, Source ${sourceZone}`);
        const zone = this.state.zones[playerId];
        let card = null;
        let removeStrategy = null;

        // Determine source and find card
        if (sourceZone) {
            if (zone[sourceZone]) {
                const idx = zone[sourceZone].findIndex(c => (c.instanceId === cardId || c.id === cardId));
                if (idx > -1) {
                    card = zone[sourceZone][idx];
                    removeStrategy = () => zone[sourceZone].splice(idx, 1);
                } else {
                    console.error(`Card ${cardId} not found in source zone ${sourceZone}`);
                }
            }
        } else {
            // Default to battlefield (backward compatibility for delete action)
            const idx = zone.battlefield.findIndex(c => c.instanceId === cardId);
            if (idx > -1) {
                card = zone.battlefield[idx];
                removeStrategy = () => zone.battlefield.splice(idx, 1);
            }
        }

        if (card && removeStrategy) {
            console.log('Card found, executing move...');
            removeStrategy(); // Remove from source

            // Decrement Hand Count if moving FROM hand
            if (sourceZone === 'hand') {
                const player = this.state.players.find(p => p.id === playerId);
                if (player) {
                    player.handCount = Math.max(0, player.handCount - 1);
                }
            }

            // Add to destination
            // Add to destination

            // TOKEN/COPY HANDLING: Tokens and Copies cease to exist if they leave the battlefield
            if (card.isToken || card.isCopy) {
                const typeLabel = card.isToken ? 'Token' : 'Copy';
                this._log(`${this.state.players.find(p => p.id === playerId).name}'s ${typeLabel} {${card.name}} was removed from the game.`);
                // Do NOT add to destination, do NOT increment library/hand counts.
                return;
            }

            if (card.isCommander && (destination === 'library')) {
                // Special handling for Commander to Library
                // Do NOT delete for library (so we can track it)
                // Move to 'command' zone but mark with status for special display

                if (destination === 'library') {
                    const player = this.state.players.find(p => p.id === playerId);
                    player.libraryCount++;
                    this._log(`${player.name} moved Commander {${card.name}} to Library. (Deck: ${player.libraryCount})`);
                }

                card.commanderStatus = destination; // 'library'
                card.tapped = false; // Reset state
                zone.command.push(card);
                return;
            }

            if (destination === 'library') {
                const player = this.state.players.find(p => p.id === playerId);
                player.libraryCount++;
                if (zone.library) zone.library.push(card); // Actually add to deck list
                this._log(`${player.name} moved {${card.name}} to Library (Bottom). (Deck: ${player.libraryCount})`);
            } else {
                // Ownership Logic: If leaving battlefield (and not to battlefield), return to OWNER's zone
                let targetZone = zone;
                let targetPlayerId = playerId;

                if (destination !== 'battlefield' && card.ownerId && card.ownerId !== playerId) {
                    targetZone = this.state.zones[card.ownerId];
                    targetPlayerId = card.ownerId;
                    console.log(`Return to owner triggered: ${card.name} -> ${targetPlayerId}'s ${destination}`);
                }

                if (targetZone[destination]) {
                    if (destination === 'hand') {
                        const tPlayer = this.state.players.find(p => p.id === targetPlayerId);
                        tPlayer.handCount++;
                    }

                    // Commander Tax Logic
                    if (destination === 'command' && card.isCommander) {
                        card.commanderTax = (card.commanderTax || 0) + 2;
                        delete card.commanderStatus;
                    }

                    if (destination === 'battlefield') {
                        card.tapped = false;
                        delete card.commanderStatus;
                    }

                    targetZone[destination].push(card);

                    const destName = {
                        'command': 'Command Zone',
                        'grave': 'Graveyard',
                        'exile': 'Exile',
                        'hand': 'Hand',
                        'battlefield': 'Battlefield'
                    }[destination] || destination;

                    let suffix = '';
                    if (destination === 'command' && card.isCommander) {
                        suffix += ` (TAX{${card.name}}：${card.commanderTax})`;
                    }
                    if (destination === 'hand') {
                        const tPlayer = this.state.players.find(p => p.id === targetPlayerId);
                        suffix += ` (Hand:${tPlayer.name}:${tPlayer.handCount})`;
                    }

                    const actPlayer = this.state.players.find(p => p.id === playerId).name;
                    const ownerName = (targetPlayerId !== playerId) ? this.state.players.find(p => p.id === targetPlayerId).name : '';

                    if (targetPlayerId !== playerId) {
                        this._log(`${actPlayer} returned {${card.name}} to ${ownerName}'s ${destName}.${suffix}`);
                    } else {
                        this._log(`${actPlayer} moved {${card.name}} to ${destName}.${suffix}`);
                    }
                } else {
                    console.error(`Invalid destination zone: ${destination}`);
                    zone.grave.push(card); // Fallback to controller's grave if error
                }
            }
        }
    }

    _initGame({ players, options }) {
        try {
            // Options default
            const randomize = options?.randomizeTurnOrder !== false; // Default true

            // Set Game Mode
            if (options?.gameMode) {
                this.state.settings.gameMode = options.gameMode;
            } else {
                this.state.settings.gameMode = 'full';
            }

            // Sci-Fi / Cyberpunk Icons
            const ICONS = [
                'images/emblem_dragon.png?v=2',
                'images/emblem_wolf.png?v=2',
                'images/emblem_skull.png?v=2',
                'images/emblem_eye.png?v=2'
            ];

            // Initialize Players objects
            // We map them first to ensure objects are formed
            let processedPlayers = players.map((p, index) => {
                const mulliganCount = p.mulliganCount || 0;
                const reduction = Math.max(0, mulliganCount - 1);
                const initialHand = Math.max(0, 7 - reduction);

                // Process Commanders
                const commanders = (p.commanders || []).map(c => ({
                    ...c,
                    id: c.id || generateId(),
                    isCommander: true,
                    commanderTax: 0,
                    ownerId: null
                }));

                const isPartner = p.isPartner || (commanders.length > 1);
                const deckSize = isPartner ? 98 : 99;
                const currentLibrary = deckSize - initialHand; // Subtract initial hand

                return {
                    id: generateId(),
                    name: p.name || `Player ${index + 1}`,
                    icon: ICONS[index % ICONS.length], // This might need to shuffle with player or stay fixed?
                    // Usually icon belongs to the seat or the player?
                    // If we shuffle players, the name gets shuffled.
                    // Let's keep icon assigned by index for now so unique icons exist.
                    // Actually, if we shuffle, we want to assign icons *after* or *before*?
                    // If 'Player 1' becomes 3rd, they should probably keep their identity if they had one.
                    // But here we are creating new players.
                    // Let's assign icons based on the final order for visual consistency (TL=Dragon), or assign to player?
                    // User said: "1番手プレイヤーを左上...".
                    // Layout is determined by array index.
                    // So if we shuffle, the array changes.
                    // So we should shuffle `processedPlayers` array.
                    life: p.life || 40,
                    handCount: initialHand,
                    libraryCount: currentLibrary,
                    mulliganCount: mulliganCount,
                    commanderDamage: {},
                    commanders: commanders,
                    eliminated: false,
                    isPartner: isPartner,
                    noMaxHandSize: false // Default: Limit 7
                };
            });

            // Randomize Order if requested
            if (randomize) {
                processedPlayers = shuffle(processedPlayers);
            }

            // Assign Icons after shuffle? Or before?
            // If before, "Player 1" might end up in BR with Dragon icon.
            // If after, TL is always Dragon.
            // Let's assign icons AFTER to ensure TL=Icon1, TR=Icon2... for aesthetic consistency if names are generic.
            // But if names are "Alice", "Bob"...
            // Let's stick to assigning icons by their resulting index to ensure the board looks balanced (TL->TR->BL->BR colors/icons).
            processedPlayers.forEach((p, index) => {
                p.icon = ICONS[index % ICONS.length];
            });

            this.state.players = processedPlayers;

            // Set ownerId on commanders
            this.state.players.forEach(p => {
                p.commanders.forEach(c => c.ownerId = p.id);
            });

            // Initialize Zones
            this.state.players.forEach(p => {
                const commandZoneCards = p.commanders.map(c => ({
                    ...c,
                    tapped: false,
                    counters: {}
                }));

                this.state.zones[p.id] = {
                    battlefield: [],
                    grave: [],
                    exile: [],
                    command: commandZoneCards,
                    hand: [],
                    sideboard: [] // New zone for Deck Builder Candidates
                };
            });

            // Set Active Player (Index 0 is 1st player, TL)
            // Explicitly reset turn counters
            this.state.turn = {
                count: 0,
                activePlayerId: null,
                phase: 'main'
            };
            this.state.gameStarted = true;

            // Log Mulligan Info
            this.state.players.forEach(p => {
                if (p.mulliganCount > 0) {
                    this._log(`${p.name} started with ${p.mulliganCount} mulligan(s) (${p.name}:${p.handCount}).`);
                } else {
                    this._log(`${p.name} kept starting hand (Mulligan: 0, ${p.name}:${p.handCount}).`);
                }
            });

            // Start the first turn properly (Trigger Untap/Draw/Deck-1)
            this._nextTurn();
        } catch (e) {
            console.error('Error initializing game:', e);
            alert('Error starting game. See console.');
        }
    }

    _updateLife({ playerId, amount, source }) {
        const player = this.state.players.find(p => p.id === playerId);
        if (player && !player.eliminated) {
            player.life += amount;
            this._log(`${player.name}'s life changed by ${amount > 0 ? '+' + amount : amount}. Current: ${player.life}`);

            if (player.life <= 0) {
                player.eliminated = true;
                this._log(`${player.name} has been eliminated (Life 0).`);
                this._checkWinner();
            }
        }
    }

    _updateCommanderDamage({ playerId, sourceId, amount, sourceName }) {
        const player = this.state.players.find(p => p.id === playerId);

        if (player && !player.eliminated) {
            // Update commander damage
            if (!player.commanderDamage[sourceId]) player.commanderDamage[sourceId] = 0;
            player.commanderDamage[sourceId] += amount;

            // Also reduce life
            player.life -= amount; // Damage reduces life

            // Find Attacker Name (Owner of the source)
            // We can find ownerId from the card ID or from players' commanders list
            let attackerName = "Unknown";
            const owner = this.state.players.find(p => p.commanders && p.commanders.some(c => c.id === sourceId));
            if (owner) attackerName = owner.name;

            this._log(`(CMDdmg：${attackerName}｛${sourceName}}→${player.name}：${player.commanderDamage[sourceId]})`);

            let eliminated = false;
            // Check Elimination (21 damage rule)
            if (player.commanderDamage[sourceId] >= 21) {
                player.eliminated = true;
                eliminated = true;
                this._log(`${player.name} has been eliminated (21+ Commander Damage from ${sourceName}).`);
            }

            // Check Life Elimination
            if (player.life <= 0 && !player.eliminated) { // Avoid double log
                player.eliminated = true;
                eliminated = true;
                this._log(`${player.name} has been eliminated (Life 0).`);
            }

            if (eliminated) this._checkWinner();
        }
    }

    _updateHand({ playerId, amount }) {
        const player = this.state.players.find(p => p.id === playerId);
        if (player && !player.eliminated) {
            player.handCount += amount;
            if (player.handCount < 0) player.handCount = 0;
            // New Format: (Hand:PlayerName:Count)
            // Also keep the delta explanation for clarity or just replace? 
            // User asked to CHANGE the format. 
            // "handボタンにて...ログの取得を(Hand:プレイヤー名:手札枚数)と変更してください"
            this._log(`(Hand:${player.name}:${player.handCount})`);
        }
    }

    _addCard({ playerId, card }) {
        const zone = this.state.zones[playerId];
        if (zone) {
            // Assign instance ID for tracking
            card.instanceId = generateId();
            card.tapped = false;
            card.counters = {};

            // Check if land
            const isLand = card.type_line && card.type_line.toLowerCase().includes('land');
            card.isLand = isLand;

            // Check for Instant/Sorcery
            const lowerType = (card.type_line || '').toLowerCase();
            const isSpell = lowerType.includes('instant') || lowerType.includes('sorcery') ||
                lowerType.includes('インスタント') || lowerType.includes('ソーサリー');

            // User Request: Decrement hand count when adding card via +Card
            const player = this.state.players.find(p => p.id === playerId);
            let suffix = '';
            if (player) {
                const oldHand = player.handCount;
                player.handCount = Math.max(0, player.handCount - 1);
                if (oldHand !== player.handCount) {
                    suffix = ` (Hand:${player.name}:${player.handCount})`;
                }
            }

            if (isSpell && !isLand) {
                zone.grave.push(card);
                this._log(`${this.state.players.find(p => p.id === playerId).name} used {${card.name}}.${suffix}`);
            } else {
                zone.battlefield.push(card);
                this._log(`${this.state.players.find(p => p.id === playerId).name} added {${card.name}} to battlefield.${suffix}`);
            }
        }
    }

    _toggleTap({ playerId, cardId }) {
        const zone = this.state.zones[playerId];
        if (zone) {
            const card = zone.battlefield.find(c => c.instanceId === cardId);
            if (card) {
                card.tapped = !card.tapped;
                this._log(`${this.state.players.find(p => p.id === playerId).name} ${card.tapped ? 'tapped' : 'untapped'} {${card.name}}.`);
            }
        }
    }

    _modifyCounter({ playerId, cardId, counterType, value }) {
        const zone = this.state.zones[playerId];
        const card = zone.battlefield.find(c => c.instanceId === cardId);
        if (card) {
            if (!card.counters) card.counters = {};
            if (!card.counters[counterType]) card.counters[counterType] = 0;
            card.counters[counterType] += value;
            if (card.counters[counterType] <= 0) delete card.counters[counterType]; // Remove if 0

            this._log(`${this.state.players.find(p => p.id === playerId).name} ${value > 0 ? 'added' : 'removed'} ${Math.abs(value)} ${counterType} counter(s) on {${card.name}}.`);
        }
    }

    _deleteCard({ playerId, cardId }) {
        const zone = this.state.zones[playerId];
        const idx = zone.battlefield.findIndex(c => c.instanceId === cardId);
        if (idx > -1) {
            const card = zone.battlefield[idx];
            zone.battlefield.splice(idx, 1);

            if (card.isCommander) {
                // Return to Command Zone
                card.commanderTax = (card.commanderTax || 0) + 2;
                zone.command.push(card);
                this._log(`${this.state.players.find(p => p.id === playerId).name}'s Commander {${card.name}} returned to Command Zone.`);
                this._log(`(TAX{${card.name}}：${card.commanderTax})`);
            } else {
                // Ownership Check
                if (card.ownerId && card.ownerId !== playerId) {
                    this.state.zones[card.ownerId].grave.push(card);
                    const ownerName = this.state.players.find(p => p.id === card.ownerId).name;
                    this._log(`${this.state.players.find(p => p.id === playerId).name}'s {${card.name}} was returned to ${ownerName}'s graveyard.`);
                } else {
                    zone.grave.push(card);
                    this._log(`${this.state.players.find(p => p.id === playerId).name}'s {${card.name}} was moved to graveyard.`);
                }
            }
        }
    }

    _cloneCard({ playerId, cardId }) {
        const zone = this.state.zones[playerId];
        const card = zone.battlefield.find(c => c.instanceId === cardId);
        if (card) {
            const clone = JSON.parse(JSON.stringify(card));
            clone.instanceId = generateId();
            clone.tapped = false;
            clone.counters = {};
            clone.name = `${card.name} (Copy)`;
            // Copies are NOT commanders
            clone.isCommander = false;
            clone.isCopy = true;
            clone.commanderTax = 0;
            // Keep image and other data
            zone.battlefield.push(clone);
            this._log(`${this.state.players.find(p => p.id === playerId).name} created a copy of {${card.name}}.`);
        }
    }

    _updateCardProperty({ playerId, cardId, property, value, zoneName }) {
        // Helper to update specific prop
        const zone = this.state.zones[playerId];
        if (!zone) return;

        // Search specified zone or fallback to common ones
        const targetZone = zoneName ? zone[zoneName] : null;
        let card;

        if (targetZone) {
            card = targetZone.find(c => c.instanceId === cardId);
        } else {
            // Default search order: Battlefield -> Hand -> Library -> Grave
            card = zone.battlefield.find(c => c.instanceId === cardId) ||
                zone.hand.find(c => c.instanceId === cardId) ||
                (zone.library || []).find(c => c.instanceId === cardId) ||
                zone.grave.find(c => c.instanceId === cardId);
        }

        if (card) {
            card[property] = value;
            // No Log for property updates usually to avoid spam, unless requested?
        }
    }

    _nextTurn() {
        // --- END OF TURN CLEANUP (Current Player) ---
        if (this.state.turn.activePlayerId) {
            const currentPlayer = this.state.players.find(p => p.id === this.state.turn.activePlayerId);
            if (currentPlayer && !currentPlayer.eliminated) {
                // Check Hand Limit
                if (!currentPlayer.noMaxHandSize && currentPlayer.handCount > 7) {
                    const excess = currentPlayer.handCount - 7;
                    // Auto-discard to Graveyard
                    // Auto-discard to Graveyard
                    this._adjustHandComplex({
                        playerId: currentPlayer.id,
                        amount: -excess,
                        destination: 'grave', // Explicitly move to grave
                        silent: true // Custom log below
                    });
                    this._log(`[End Phase] ${currentPlayer.name} discarded ${excess} cards to Graveyard (Hand Limit > 7) (Hand:${currentPlayer.name}:${currentPlayer.handCount}).`);
                }
            }
        }

        // Find next non-eliminated player
        const playerIds = this.state.players.map(p => p.id);
        let currentIndex = playerIds.indexOf(this.state.turn.activePlayerId);
        let nextIndex, nextPlayer;

        // Loop to skip eliminated players
        let attempts = 0;
        do {
            currentIndex = (currentIndex + 1) % playerIds.length;
            nextPlayer = this.state.players.find(p => p.id === playerIds[currentIndex]);
            attempts++;
            // Safety break if everyone eliminated? (Should assume 1 winner left)
            if (attempts > playerIds.length) break;
        } while (nextPlayer.eliminated);

        this.state.turn.activePlayerId = nextPlayer.id;
        this.state.turn.count++;

        // UNTAP STEP: Untap all cards controlled by active player
        const activeZone = this.state.zones[nextPlayer.id];
        if (activeZone && activeZone.battlefield) {
            activeZone.battlefield.forEach(c => c.tapped = false);
        }

        // DRAW STEP
        nextPlayer.handCount++;
        nextPlayer.libraryCount--; // Draw from library

        this._log(`Turn ${this.state.turn.count}: ${nextPlayer.name}'s turn. Untap & Draw. (Hand:${nextPlayer.name}:${nextPlayer.handCount})`);
    }

    _log(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.state.logs.unshift(`[${timestamp}] ${message}`);
    }

    getState() {
        return this.state;
    }

    _checkWinner() {
        if (!this.state.gameStarted) return;

        const alivePlayers = this.state.players.filter(p => !p.eliminated);
        if (alivePlayers.length === 1) {
            const winner = alivePlayers[0];
            this.state.winner = winner;
            this._log(`GAME OVER! Winner: ${winner.name}`);
        }
    }

    _castCommander({ playerId, cardId }) {
        const zone = this.state.zones[playerId];
        const cmdIndex = zone.command.findIndex(c => c.id === cardId);

        if (cmdIndex > -1) {
            const card = zone.command[cmdIndex];

            // Remove from command zone
            zone.command.splice(cmdIndex, 1);

            // Prepare for battlefield
            card.instanceId = generateId(); // Assign new instance ID for board tracking
            card.tapped = false;
            card.counters = {};

            // Check if land (unlikely for commander but possible if DFC flip land?)
            // Usually usage is casting, so it goes to stack then battlefield, but we skip stack.
            const isLand = card.type_line && card.type_line.toLowerCase().includes('land');
            card.isLand = isLand;

            // Tax is now handled when returning to Command Zone.
            // card.commanderTax = (card.commanderTax || 0) + 2;

            zone.battlefield.push(card);
            this._log(`${this.state.players.find(p => p.id === playerId).name} cast Commander {${card.name}} from Command Zone.`);
        }
    }

    _addMemo({ text }) {
        this._log(`[Memo] ${text}`);
    }

    _adjustLibrary({ playerId, amount, destination, silent }) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return;

        player.libraryCount = (player.libraryCount || 0) + amount;
        if (player.libraryCount < 0) player.libraryCount = 0;

        if (destination && amount < 0) {
            const count = Math.abs(amount);
            const zone = this.state.zones[playerId];

            if (destination === 'hand') {
                player.handCount = (player.handCount || 0) + count;
            } else if (destination === 'grave' || destination === 'exile') {
                for (let i = 0; i < count; i++) {
                    const dummy = {
                        id: generateId(),
                        instanceId: generateId(),
                        name: `Library -> ${destination === 'grave' ? 'Graveyard' : 'Exile'}`,
                        type_line: 'Card',
                        image_url: null, // No image
                        isDummy: true
                    };
                    if (destination === 'grave') zone.grave.push(dummy);
                    else zone.exile.push(dummy);
                }
            }
        }

        if (!silent) {
            this._log(`${player.name} adjusted Library by ${amount > 0 ? '+' : ''}${amount}. (Total: ${player.libraryCount})`);
        }
    }



    _adjustHandComplex({ playerId, amount, destination, silent }) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return;

        player.handCount = (player.handCount || 0) + amount;
        if (player.handCount < 0) player.handCount = 0;

        if (destination && amount < 0) {
            const count = Math.abs(amount);
            const zone = this.state.zones[playerId];

            if (destination === 'library') {
                player.libraryCount = (player.libraryCount || 0) + count;
            } else if (destination === 'grave' || destination === 'exile') {
                for (let i = 0; i < count; i++) {
                    const dummy = {
                        id: generateId(),
                        instanceId: generateId(),
                        name: `Hand -> ${destination === 'grave' ? 'Graveyard' : 'Exile'}`,
                        type_line: 'Card',
                        image_url: null, // No image
                        isDummy: true
                    };
                    if (destination === 'grave') zone.grave.push(dummy);
                    else zone.exile.push(dummy);
                }
            }
        }

        if (!silent) {
            this._log(`${player.name} adjusted Hand by ${amount > 0 ? '+' : ''}${amount}. (Hand:${player.name}:${player.handCount})`);
        }
    }

    _toggleNoMaxHand({ playerId, value }) {
        const player = this.state.players.find(p => p.id === playerId);
        if (player) {
            player.noMaxHandSize = value;
            this._log(`${player.name} ${value ? 'enabled' : 'disabled'} "No Max Hand Size".`);
        }
    }

    _restartGame() {
        // Reset state but keep generic structure? Or full reset?
        // Let's do a soft reset to initial state but keep settings
        this.state = {
            players: [],
            zones: {},
            turn: {
                count: 1,
                activePlayerId: null,
                phase: 'main'
            },
            logs: [],
            gameStarted: false,
            winner: null,
            settings: {
                ...this.state.settings, // Preserve mode and other settings
            },
            ui: {
                selectionMode: false,
                selectedIds: []
            }
        };
        document.body.classList.remove('game-active'); // Revert to detailed background
        this._log('Game has been restarted.');
    }
    _changeControl({ cardId, currentControllerId, newControllerId }) {
        const state = this.state;
        const sourceZone = state.zones[currentControllerId].battlefield;
        const targetZone = state.zones[newControllerId].battlefield;

        const idx = sourceZone.findIndex(c => c.instanceId === cardId || c.id === cardId);
        if (idx > -1) {
            const card = sourceZone[idx];

            if (!card.ownerId) {
                card.ownerId = currentControllerId;
            }

            sourceZone.splice(idx, 1);
            card.tapped = false; // Optional reset

            targetZone.push(card);

            const newControllerName = state.players.find(p => p.id === newControllerId).name;
            const cardName = card.name;
            this._log(`${state.players.find(p => p.id === currentControllerId).name} gave control of {${cardName}} to ${newControllerName}.`);
        }
    }

    _togglePlayerFocus({ playerId }) {
        if (this.state.ui.focusedPlayerId === playerId) {
            this.state.ui.focusedPlayerId = null; // Unfocus
        } else {
            this.state.ui.focusedPlayerId = playerId; // Focus new
        }
    }

    _loadDeckData({ playerId, library, sideboard, commanders }) {
        // Ensure library zone exists
        if (!this.state.zones[playerId].library) {
            this.state.zones[playerId].library = [];
        }

        // Commanders need to be added to library for Deck Builder View
        // (Even though they are technically in 'command' zone for valid game state, Builder UI relies on library list)
        // We add them first.
        const cmdCards = (commanders || []).map(c => ({
            ...c,
            id: c.id || generateId(),
            instanceId: generateId(),
            tapped: false,
            isCommander: true // Ensure flag
        }));

        const libCards = (library || []).map(c => ({
            ...c,
            id: c.id || generateId(),
            instanceId: generateId(),
            tapped: false,
            isCommander: false
        }));

        this.state.zones[playerId].library = [...cmdCards, ...libCards];

        // Also populate sideboard if needed
        if (sideboard) {
            this.state.zones[playerId].sideboard = sideboard.map(c => ({
                ...c,
                id: c.id || generateId(),
                instanceId: generateId(),
                tapped: false
            }));
        }

        // Update count
        const player = this.state.players.find(p => p.id === playerId);
        if (player) {
            player.libraryCount = this.state.zones[playerId].library.length;
        }

        this._log('Deck loaded.');
    }

    _addCardToDeck({ playerId, card }) {
        if (!this.state.zones[playerId].library) {
            this.state.zones[playerId].library = [];
        }
        const newCard = {
            ...card,
            id: card.id || generateId(),
            instanceId: generateId(),
            filters: card.filters || [] // Keep filters if any
        };
        this.state.zones[playerId].library.push(newCard);

        // Update count
        const player = this.state.players.find(p => p.id === playerId);
        if (player) {
            player.libraryCount = this.state.zones[playerId].library.length;
        }
    }

    // --- Hand Simulator Actions ---

    // --- Hand Simulator Actions (Sandbox) ---

    _testInitHand({ playerId }) {
        const zone = this.state.zones[playerId];
        const mainLibrary = zone.library || [];

        // 1. Clone Main Library (Exclude Commanders, though in Builder they are mixed? 
        // We flagged them isCommander=true in LOAD_DECK_DATA.
        // We filter them out for the Sim Deck.)

        // Deep copy to ensure sandbox doesn't mutate main instances
        const simDeck = mainLibrary
            .filter(c => !c.isCommander)
            .map(c => ({
                ...c,
                instanceId: generateId(), // New Instance IDs for sim
                tapped: false,
                counters: {}
            }));

        // 2. Initialize Sim Zones
        zone.simLibrary = shuffle(simDeck);
        zone.simHand = [];
        zone.simGrave = [];

        // 3. Draw 7
        for (let i = 0; i < 7; i++) {
            const card = zone.simLibrary.pop();
            if (card) zone.simHand.push(card);
        }

        this._log(`${this.state.players.find(p => p.id === playerId).name} started Hand Simulation (Sandbox).`);
        this.notify();
    }

    _testMulligan({ playerId }) {
        const zone = this.state.zones[playerId];
        if (!zone.simHand || !zone.simLibrary) return;

        // 1. Hand -> Bottom of Library
        // In our stack logic, Top is End (pop). Bottom is Start (unshift).
        const hand = [...zone.simHand];
        zone.simHand = [];

        // "Move all to bottom"
        zone.simLibrary.unshift(...hand);

        // 2. Draw 7
        for (let i = 0; i < 7; i++) {
            const card = zone.simLibrary.pop();
            if (card) zone.simHand.push(card);
        }

        this._log(`Sim: Mulligan (Hand -> Bottom, Draw 7).`);
    }

    _testDraw({ playerId, count = 1 }) {
        const zone = this.state.zones[playerId];
        if (!zone.simHand || !zone.simLibrary) return;

        let actual = 0;
        for (let i = 0; i < count; i++) {
            const card = zone.simLibrary.pop();
            if (card) {
                zone.simHand.push(card);
                actual++;
            }
        }
        this._log(`Sim: Drew ${actual} card(s).`);
    }

    _testSearch({ playerId, cardId }) {
        const zone = this.state.zones[playerId];
        if (!zone.simHand || !zone.simLibrary) return;

        // Find card in Library
        const idx = zone.simLibrary.findIndex(c => c.instanceId === cardId);
        if (idx > -1) {
            const card = zone.simLibrary[idx];
            zone.simLibrary.splice(idx, 1);
            zone.simHand.push(card);

            // Shuffle after search
            zone.simLibrary = shuffle(zone.simLibrary);

            this._log(`Sim: Searched {${card.name}} and shuffled.`);
        }
    }

    _testUse({ playerId, cardId }) {
        const zone = this.state.zones[playerId];
        if (!zone.simHand) return;

        const idx = zone.simHand.findIndex(c => c.instanceId === cardId);
        if (idx > -1) {
            const card = zone.simHand[idx];
            zone.simHand.splice(idx, 1);

            if (!zone.simGrave) zone.simGrave = [];
            zone.simGrave.push(card);

            this._log(`Sim: Used {${card.name}}.`);
        }
    }
}
