export class LifeCounterApp {
    constructor(store) {
        this.store = store;
        this.container = null;
        this.element = null;
        this.sidebarOpen = false;

        // Cache references for updates
        this.refs = {
            players: {}, // Map playerId -> { lifeEl, nameEl, cmdContainer }
            sidebar: null
        };
    }

    mount(container) {
        this.container = container;
        this.container.innerHTML = '';
        const state = this.store.getState();

        this.element = document.createElement('div');
        this.element.className = 'life-counter-app';
        this.element.style.cssText = `
            width: 100%; height: 100%; position: relative;
            background: #050505; 
            display: flex; overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-width: 320px;
        `;

        // Main Layout
        const mainContent = document.createElement('div');
        mainContent.className = 'lc-main-content';
        mainContent.style.cssText = `
            flex: 1; display: flex; flex-direction: column; position: relative;
            transition: margin-right 0.3s ease;
            overflow: hidden; 
            height: 100%;
        `;

        // Sidebar
        const sidebar = this._renderSidebar();
        this.refs.sidebar = sidebar;

        // Grid Layout Calculation
        const pCount = state.players.length;
        let gridCols = pCount <= 2 ? 1 : pCount <= 4 ? 2 : 3;
        let gridRows = pCount <= 2 ? 2 : pCount <= 6 ? 2 : 3;

        if (pCount === 1) { gridCols = 1; gridRows = 1; }
        if (pCount === 2) { gridCols = 1; gridRows = 2; }
        if (pCount === 3) { gridCols = 3; gridRows = 1; }
        if (pCount === 4) { gridCols = 2; gridRows = 2; }
        if (pCount >= 5) { gridCols = 3; gridRows = 2; }

        const grid = document.createElement('div');
        grid.style.cssText = `
            flex: 1; display: grid; 
            grid-template-columns: repeat(${gridCols}, 1fr);
            grid-template-rows: repeat(${gridRows}, 1fr);
            gap: 8px; padding: 8px; /* Slightly increased gap for borders */
            overflow: auto; 
            height: 100%;
        `;

        state.players.forEach((player) => {
            const pDiv = this._createPlayerPanel(player, state);
            grid.appendChild(pDiv);
        });

        mainContent.appendChild(grid);
        this.element.appendChild(mainContent);
        this.element.appendChild(sidebar);

        // Toggle Button
        const toggleBtn = this._createToggleBtn();
        this.element.appendChild(toggleBtn);

        this.container.appendChild(this.element);
    }

    update(state) {
        if (!this.element) return; // Not mounted

        state.players.forEach(player => {
            const refs = this.refs.players[player.id];
            if (!refs) return;

            // Update Life
            if (refs.lifeEl.textContent != player.life) {
                refs.lifeEl.textContent = player.life;
                refs.lifeEl.style.transform = 'scale(1.1)';
                refs.lifeEl.style.color = '#fff';
                refs.lifeEl.style.textShadow = '0 0 20px #fff';
                setTimeout(() => {
                    refs.lifeEl.style.transform = 'scale(1)';
                    refs.lifeEl.style.color = '#fff';
                    refs.lifeEl.style.textShadow = '0 0 10px var(--neon-blue)';
                }, 150);
            }

            // Update ELIMINATED status if changed
            if (player.eliminated && !refs.panel.classList.contains('eliminated')) {
                refs.panel.classList.add('eliminated');
                refs.panel.innerHTML = `
                    <div style="flex:1; display:flex; justify-content:center; align-items:center;">
                        <h1 style="color:red; transform:rotate(-15deg); border:4px solid red; padding: 10% 0; font-size: 5vmin; white-space: nowrap; font-family: 'Orbitron', sans-serif;">ELIMINATED</h1>
                    </div>
                `;
                // Remove Styles
                refs.panel.style.border = '2px solid red';
                refs.panel.style.background = '#0a0000';
            }

            // Update CMD Damage List
            if (!player.eliminated) {
                this._updateCmdList(player, state, refs.cmdContainer);

                // Update Commander Tax
                if (player.commanders && refs.taxEls && refs.taxEls.length > 0) {
                    player.commanders.forEach((cmd, idx) => {
                        if (refs.taxEls[idx]) {
                            refs.taxEls[idx].textContent = cmd.commanderTax || 0;
                        }
                    });
                }
            }
        });
    }

    _createPlayerPanel(player, state) {
        const div = document.createElement('div');
        div.className = 'lc-player-panel';

        // --- CYBERPUNK HUD STYLE ---
        const isEliminated = player.eliminated;
        div.style.cssText = `
            position: relative; display: flex; flex-direction: column; 
            /* Desaturated Colors: Navy Background, Dim Cyan Border */
            background: #0b101a; 
            border: 1px solid #008888; /* Dim Cyan */
            border-radius: 12px; 
            overflow: hidden; opacity: ${isEliminated ? '0.5' : '1'};
            height: 100%; width: 100%;
            min-height: 250px; 
            padding: 1vmin;
            box-shadow: 0 0 10px rgba(0, 100, 100, 0.1), inset 0 0 20px rgba(0, 10, 20, 0.8);
        `;

        this.refs.players[player.id] = { panel: div, taxEls: [] };

        if (isEliminated) {
            div.classList.add('eliminated');
            div.innerHTML = `
                <div style="flex:1; display:flex; justify-content:center; align-items:center;">
                    <h1 style="color:#aa3333; transform:rotate(-15deg); border:4px solid #aa3333; padding: 10% 0; font-size: 5vmin; white-space: nowrap; font-family: 'Orbitron', sans-serif;">ELIMINATED</h1>
                </div>
            `;
            return div;
        }

        const colors = ['#cc4444', '#44cc44', '#6666cc', '#cccc44', '#cc44cc', '#44cccc']; // Desaturated Palette
        const pIndex = state.players.findIndex(p => p.id === player.id);
        const pColor = colors[pIndex % colors.length];

        // Top Section: Life & Main Controls
        const topSection = document.createElement('div');
        topSection.style.cssText = `
            display: flex; flex-direction: column; 
            align-items: center; justify-content: center;
            border-bottom: 1px solid rgba(0, 255, 255, 0.3);
            width: 100%;
            padding-bottom: 1vmin;
            margin-bottom: 1vmin;
            flex-grow: 1.5;
            flex-shrink: 0;
            min-height: 150px;
        `;

        const nameEl = document.createElement('div');
        nameEl.style.cssText = `
            font-size: clamp(1.2rem, 3.5vmin, 3rem); font-weight: 800; color: ${pColor}; 
            text-shadow: 0 0 10px ${pColor}; margin-bottom: 0.5vmin;
            text-transform: uppercase; letter-spacing: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%;
            font-family: 'Orbitron', sans-serif;
        `;
        nameEl.textContent = player.name;

        const labelEl = document.createElement('div');
        labelEl.textContent = 'LIFE TOTAL';
        labelEl.style.cssText = `
            font-family: 'Orbitron', sans-serif; font-size: 0.8rem; letter-spacing: 3px;
            color: #008888; text-shadow: 0 0 5px #005555; margin-bottom: -1vmin; opacity: 0.8;
        `;

        const lifeEl = document.createElement('div');
        lifeEl.className = 'life-value';
        lifeEl.style.cssText = `
            font-family: 'Orbitron', monospace; /* Digital Font */
            font-size: clamp(4rem, 15vmin, 16rem); font-weight: 900; color: #eeeeee; 
            line-height: 0.9; margin: 1vmin 0; transition: transform 0.1s;
            text-shadow: 0 0 10px rgba(0, 100, 100, 0.5); /* Reduced glow */
        `;
        lifeEl.textContent = player.life;

        this.refs.players[player.id].lifeEl = lifeEl;
        this.refs.players[player.id].nameEl = nameEl;

        // Buttons
        const btnsDiv = document.createElement('div');
        btnsDiv.style.cssText = 'display: flex; gap: 1vmin; width: 95%; justify-content: center; flex-wrap: wrap; margin-top: auto;';

        const createBtn = (amt, type) => {
            const btn = document.createElement('button');
            const isPlus = amt > 0;
            const bgColor = isPlus ? 'rgba(20, 60, 20, 0.7)' : 'rgba(60, 20, 20, 0.7)'; // Less pure
            const borderColor = isPlus ? '#44cc44' : '#cc4444'; // Desaturated Neon

            btn.textContent = (isPlus ? '+' : '') + amt;
            btn.className = 'lc-btn';
            btn.style.cssText = `
                flex: 1 1 0; min-width: 50px; height: clamp(40px, 6vmin, 80px);
                background: ${bgColor}; border: 1px solid ${borderColor}; color: white;
                font-family: 'Orbitron', sans-serif; font-size: clamp(1rem, 2vmin, 2rem); 
                font-weight: bold; cursor: pointer; border-radius: 6px;
                transition: all 0.1s; white-space: nowrap;
                box-shadow: 0 0 5px ${borderColor};
                text-shadow: 0 0 2px black;
            `;
            btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
            btn.onmouseup = () => btn.style.transform = 'scale(1)';
            btn.onmouseover = () => btn.style.background = isPlus ? 'rgba(0, 100, 0, 0.9)' : 'rgba(100, 0, 0, 0.9)';
            btn.onmouseout = () => btn.style.background = bgColor;

            btn.onclick = () => this.store.dispatch('UPDATE_LIFE', { playerId: player.id, amount: amt });
            return btn;
        };

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display: flex; gap: 0.5vmin; flex: 1 1 auto; justify-content: flex-end;';
        leftGroup.appendChild(createBtn(-5));
        leftGroup.appendChild(createBtn(-1));

        const rightGroup = document.createElement('div');
        rightGroup.style.cssText = 'display: flex; gap: 0.5vmin; flex: 1 1 auto; justify-content: flex-start;';
        rightGroup.appendChild(createBtn(1));
        rightGroup.appendChild(createBtn(5));

        btnsDiv.appendChild(leftGroup);
        btnsDiv.appendChild(rightGroup);

        topSection.appendChild(nameEl);
        topSection.appendChild(labelEl);
        topSection.appendChild(lifeEl);
        topSection.appendChild(btnsDiv);

        topSection.appendChild(btnsDiv);

        // --- COMMANDER TAX (Compact Top-Left) ---
        if (player.commanders && player.commanders.length > 0) {
            const taxContainer = document.createElement('div');
            taxContainer.style.cssText = `
                position: absolute; top: 0; left: 0; 
                display: flex; flex-direction: column; gap: 4px;
                padding: 6px 8px; z-index: 10;
                background: rgba(0, 0, 0, 0.85); 
                border-bottom-right-radius: 8px;
                border-right: 1px solid var(--neon-blue);
                border-bottom: 1px solid var(--neon-blue);
                box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            `;

            player.commanders.forEach((cmd, idx) => {
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; align-items: center; gap: 6px;';

                // Label (Icon or Short Text)
                const label = document.createElement('span');
                label.textContent = `T${idx + 1}`;
                label.title = `Commander Tax (CMD ${idx + 1})`;
                label.style.cssText = 'font-size: 0.8rem; color: var(--neon-blue); font-family: "Orbitron", sans-serif; min-width: 20px; font-weight: bold; text-shadow: 0 0 5px var(--neon-blue);';

                // Value
                const valDisplay = document.createElement('span');
                valDisplay.textContent = cmd.commanderTax || 0;
                valDisplay.style.cssText = 'font-family: "Orbitron", monospace; font-size: 1.1rem; font-weight: bold; color: white; min-width: 1.5em; text-align: center; text-shadow: 0 0 5px white;';

                // Store Ref
                this.refs.players[player.id].taxEls.push(valDisplay);

                const createTaxBtn = (amt, text) => {
                    const btn = document.createElement('button');
                    btn.textContent = text;
                    btn.style.cssText = `
                        background: rgba(255, 255, 255, 0.1); border: 1px solid #666; color: #eee;
                        cursor: pointer; font-size: 0.9rem; padding: 0; border-radius: 4px;
                        font-family: monospace; display: flex; align-items: center; justify-content: center;
                        height: 24px; min-width: 24px; font-weight: bold;
                        transition: all 0.2s;
                    `;
                    btn.onmouseover = () => { btn.style.borderColor = 'white'; btn.style.background = 'rgba(255, 255, 255, 0.3)'; btn.style.boxShadow = '0 0 5px white'; };
                    btn.onmouseout = () => { btn.style.borderColor = '#666'; btn.style.background = 'rgba(255, 255, 255, 0.1)'; btn.style.boxShadow = 'none'; };
                    btn.onclick = () => {
                        this.store.dispatch('UPDATE_COMMANDER_TAX', {
                            playerId: player.id,
                            commanderIndex: idx,
                            amount: amt
                        });
                    };
                    return btn;
                };

                row.appendChild(label);
                row.appendChild(createTaxBtn(-2, '-'));
                row.appendChild(valDisplay);
                row.appendChild(createTaxBtn(2, '+'));
                taxContainer.appendChild(row);
            });
            div.appendChild(taxContainer);
        }

        // Bottom Section (CMD List)
        const btmSection = document.createElement('div');
        btmSection.style.cssText = `
            flex-grow: 1; flex-shrink: 1; min-height: 80px;
            overflow-y: auto; background: rgba(0, 20, 40, 0.3);
            width: 100%; padding: 0.5vmin; display: flex; flex-direction: column; gap: 0.5vmin;
            border-top: 1px solid rgba(0, 255, 255, 0.2);
        `;
        this.refs.players[player.id].cmdContainer = btmSection;

        this._updateCmdList(player, state, btmSection);

        div.appendChild(topSection);

        div.appendChild(btmSection);
        return div;
    }

    _updateCmdList(player, state, container) {
        container.innerHTML = '';

        state.players.forEach(attacker => {
            if (attacker.id === player.id) return;

            attacker.commanders.forEach((cmd, idx) => {
                const cmdId = `CMD-${attacker.id}-${idx}`;
                const currentDmg = player.commanderDamage[cmdId] || 0;
                const isLethal = currentDmg >= 21;

                const row = document.createElement('div');
                row.style.cssText = `
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0.5vmin 1vmin; 
                    background: ${isLethal ? 'rgba(80, 0, 0, 0.3)' : 'rgba(0, 40, 80, 0.3)'}; 
                    border: 1px solid ${isLethal ? 'red' : 'rgba(0, 255, 255, 0.2)'};
                    border-radius: 4px;
                    min-height: 40px; flex: 1 0 auto; 
                    max-height: 80px; 
                `;

                row.innerHTML = `
                    <div style="display:flex; flex-direction:column; min-width: 80px; max-width: 50%;">
                        <span style="font-family:'Orbitron',sans-serif; font-size:clamp(0.8rem, 1.5vmin, 1.5rem); font-weight:bold; color:${isLethal ? '#ffaaaa' : '#ccffff'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-shadow:0 0 5px ${isLethal ? 'red' : '#00aaaa'}">${attacker.name}</span>
                        <span style="font-size:clamp(0.6rem, 1.2vmin, 1rem); color:#00aaaa;">CMD ${idx + 1}</span>
                    </div>
                `;

                const controls = document.createElement('div');
                controls.style.cssText = 'display:flex; align-items: center; gap: 1vmin; height: 100%;';

                const valDisplay = document.createElement('div');
                valDisplay.style.cssText = `
                    font-family: 'Orbitron', monospace;
                    font-size: clamp(1.2rem, 2.5vmin, 2.5rem); font-weight: bold; 
                    color: ${isLethal ? '#ff4444' : 'white'}; 
                    min-width: 2.5em; text-align: center;
                    text-shadow: 0 0 5px ${isLethal ? '#ff0000' : 'rgba(255,255,255,0.5)'};
                `;
                valDisplay.textContent = currentDmg;

                const createCmdBtn = (val, label) => {
                    const btn = document.createElement('button');
                    const isPlus = val > 0;
                    // Smaller buttons for CMD, using similar scheme but simpler
                    btn.textContent = label;
                    btn.style.cssText = `
                        width: clamp(30px, 5vmin, 60px); height: clamp(30px, 5vmin, 60px); 
                        background: ${isPlus ? 'rgba(20,60,20,0.6)' : 'rgba(60,20,20,0.6)'}; 
                        color: white; border: 1px solid ${isPlus ? '#33aa33' : '#aa3333'}; 
                        border-radius: 4px; cursor: pointer; font-size: clamp(1rem, 2vmin, 1.5rem);
                        display: flex; align-items: center; justify-content: center;
                        font-family: 'Orbitron', sans-serif;
                    `;
                    btn.onclick = () => {
                        this.store.dispatch('UPDATE_COMMANDER_DAMAGE', {
                            playerId: player.id,
                            sourceId: cmdId,
                            amount: val,
                            sourceName: `${attacker.name}'s CMD ${idx + 1}`
                        });
                    };
                    return btn;
                };

                controls.appendChild(createCmdBtn(-1, '-'));
                controls.appendChild(valDisplay);
                controls.appendChild(createCmdBtn(1, '+'));

                row.appendChild(controls);
                container.appendChild(row);
            });
        });
    }

    _createToggleBtn() {
        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'lc-sidebar-toggle';
        toggleBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        `;
        toggleBtn.style.cssText = `
            position: absolute; top: 20px; right: 20px; z-index: 200;
            width: 50px; height: 50px; 
            background: rgba(0,0,0,0.8); border: 2px solid var(--neon-blue);
            color: var(--neon-blue); display: flex; justify-content: center; align-items: center;
            cursor: pointer; transition: all 0.3s;
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        `;
        toggleBtn.onclick = () => {
            this.sidebarOpen = !this.sidebarOpen;
            const sb = this.refs.sidebar;
            if (this.sidebarOpen) {
                sb.style.transform = 'translateX(0)';
                toggleBtn.style.right = '270px';
                toggleBtn.style.transform = 'rotate(180deg)';
                toggleBtn.style.background = 'var(--neon-blue)';
                toggleBtn.style.color = 'black';
            } else {
                sb.style.transform = 'translateX(100%)';
                toggleBtn.style.right = '20px';
                toggleBtn.style.transform = 'rotate(0deg)';
                toggleBtn.style.background = 'rgba(0,0,0,0.8)';
                toggleBtn.style.color = 'var(--neon-blue)';
            }
        };
        return toggleBtn;
    }

    _renderSidebar() {
        const div = document.createElement('div');
        div.className = 'lc-sidebar';
        div.style.cssText = `
            position: absolute; top: 0; right: 0; width: 250px; height: 100%;
            background: rgba(5, 10, 15, 0.98); border-left: 2px solid var(--neon-blue);
            transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            display: flex; flex-direction: column; gap: 20px; padding: 100px 20px 20px 20px;
            z-index: 100; box-shadow: -10px 0 30px rgba(0, 243, 255, 0.1);
        `;

        const tools = [
            { label: 'ROLL D20', action: () => this._rollDice(20), icon: '🎲', color: '--neon-blue' },
            { label: 'FLIP COIN', action: () => this._flipCoin(), icon: '🪙', color: '--neon-yellow' },
            { label: 'REBOOT', action: () => this._reboot(), icon: '⚠️', color: '--neon-pink' }
        ];

        tools.forEach(t => {
            const btn = document.createElement('button');
            const colorVar = `var(${t.color}, #ccc)`;
            btn.innerHTML = `
                <span style="font-size:1.8rem; filter: drop-shadow(0 0 5px ${colorVar});">${t.icon}</span> 
                <span style="font-size:1.2rem; letter-spacing:1px; font-family: 'Orbitron', sans-serif;">${t.label}</span>
            `;
            btn.style.cssText = `
                padding: 20px; background: rgba(255, 255, 255, 0.03); 
                color: ${colorVar}; border: 1px solid ${colorVar};
                border-radius: 4px; cursor: pointer; font-weight: bold; 
                display: flex; align-items: center; gap: 15px;
                transition: all 0.2s; position: relative; overflow: hidden;
            `;

            btn.onmouseover = () => {
                btn.style.background = `rgba(255, 255, 255, 0.1)`;
                btn.style.boxShadow = `0 0 15px ${colorVar}`;
                btn.style.transform = 'translateX(-5px)';
            };
            btn.onmouseout = () => {
                btn.style.background = 'rgba(255, 255, 255, 0.03)';
                btn.style.boxShadow = 'none';
                btn.style.transform = 'translateX(0)';
            };

            btn.onclick = t.action;
            div.appendChild(btn);
        });

        // Add "CANCEL" style example (optional, but requested implicitly)
        // I will add a "CLOSE MENU" button at bottom to show "CANCEL" style
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE MENU';
        closeBtn.style.cssText = `
            margin-top: auto; padding: 15px; 
            background: transparent; border: 1px solid #666; color: #888;
            border-radius: 4px; cursor: pointer; font-family: 'Orbitron', sans-serif;
            text-align: center;
        `;
        closeBtn.onmouseover = () => { closeBtn.style.borderColor = '#aaa'; closeBtn.style.color = '#fff'; };
        closeBtn.onmouseout = () => { closeBtn.style.borderColor = '#666'; closeBtn.style.color = '#888'; };
        closeBtn.onclick = () => {
            const toggle = this.element.querySelector('.lc-sidebar-toggle');
            toggle.click(); // Trigger close
        };
        div.appendChild(closeBtn);

        return div;
    }

    _rollDice(sides) {
        const result = Math.floor(Math.random() * sides) + 1;
        this._showOverlay(`🎲 ${result}`);
    }

    _flipCoin() {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        this._showOverlay(`🪙 ${result}`);
    }

    _reboot() {
        if (confirm('Return to Title Screen?')) {
            this.store.dispatch('RESTART_GAME');
            location.reload();
        }
    }

    _showOverlay(text) {
        const el = document.createElement('div');
        el.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9); color: white; padding: 2rem 4rem;
            border: 4px solid var(--neon-blue); border-radius: 20px;
            font-size: 4rem; font-weight: 900; z-index: 10000;
            animation: popIn 0.3s ease-out; box-shadow: 0 0 80px rgba(0, 243, 255, 0.6);
            pointer-events: none; text-transform: uppercase; letter-spacing: 2px;
            text-shadow: 0 0 20px var(--neon-blue); font-family: 'Orbitron', sans-serif;
        `;
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.5s';
            setTimeout(() => el.remove(), 500);
        }, 1500);
    }
}
