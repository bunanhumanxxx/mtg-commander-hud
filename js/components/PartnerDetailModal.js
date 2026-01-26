export class PartnerDetailModal {
    constructor(store, playerId, type, data) {
        this.store = store;
        this.playerId = playerId;
        this.type = type; // 'tax' or 'damage'
        this.data = data;
        /* 
           data structure:
           If type === 'tax': { commanders: [{ name, tax, image_url }] }
           If type === 'damage': { opponentName, opponentId, commanders: [{ id, name, damage, image_url }] }
        */
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9200;
        `;

        const title = this.type === 'tax' ? 'Commander Tax Details' : `Commander Damage from ${this.data.opponentName}`;

        let contentHtml = '';

        if (this.type === 'tax') {
            contentHtml = this.data.commanders.map(cmd => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #333; padding: 1rem; border-radius: 4px; border: 1px solid #555;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <img src="${cmd.image_url}" style="height: 60px; border-radius: 4px;">
                        <div style="font-weight: bold;">${cmd.name}</div>
                    </div>
                    <div style="font-size: 1.5rem; color: var(--neon-blue); font-family: monospace;">
                        +${cmd.tax}
                    </div>
                </div>
            `).join('');
        } else if (this.type === 'damage') {
            contentHtml = this.data.commanders.map(cmd => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #333; padding: 1rem; border-radius: 4px; border: 1px solid ${cmd.damage >= 21 ? 'var(--neon-pink)' : '#555'};">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <img src="${cmd.image_url}" style="height: 60px; border-radius: 4px;">
                        <div style="font-weight: bold;">${cmd.name}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 1.5rem; color: ${cmd.damage >= 21 ? 'var(--neon-pink)' : '#ccc'}; font-family: monospace; width: 50px; text-align: center;">
                            ${cmd.damage}
                        </div>
                        <button class="edit-dmg-btn" data-id="${cmd.id}" data-name="${cmd.name}" style="padding: 0.5rem 1rem; cursor: pointer; background: #444; color: white; border: 1px solid #666; border-radius: 4px;">Edit</button>
                    </div>
                </div>
            `).join('');
        }

        this.element.innerHTML = `
            <div class="partner-modal-content" style="background: #050a14; padding: 2rem; border-radius: 8px; width: 500px; display: flex; flex-direction: column; gap: 1.5rem; color: white; border: 1px solid cyan; box-shadow: 0 0 20px cyan;">
                <h3 style="margin: 0; text-align: center; color: cyan; text-shadow: 0 0 10px cyan;">${title}</h3>
                
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${contentHtml}
                </div>

                <button id="btn-close" style="padding: 0.8rem; background: #444; color: white; border: 1px solid #666; cursor: pointer; border-radius: 4px; width: 100%; font-weight: bold;">Close</button>
            </div>
        `;

        // Event Listeners
        this.element.querySelector('#btn-close').addEventListener('click', () => {
            this.close();
        });

        if (this.type === 'damage') {
            this.element.querySelectorAll('.edit-dmg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const cmdId = btn.dataset.id;
                    const cmdName = btn.dataset.name;
                    const currentDmg = this.data.commanders.find(c => c.id === cmdId).damage;

                    // Open existing StatusModal for editing, but maybe stick to this modal?
                    // The requirement says "check details", but usually you want to edit too.
                    // Let's open the StatusModal on top (z-index should handle it).
                    import('./StatusModal.js').then(({ StatusModal }) => {
                        const modal = new StatusModal(this.store, this.playerId, 'commanderDamage', currentDmg, cmdId, `${cmdName}`);
                        document.body.appendChild(modal.render());
                        // We might want to refresh this modal when StatusModal closes, but Store subscription handles global UI.
                        // However, this modal instance won't auto-update unless subscribed.
                        // Simple solution: Close this modal when opening the edit modal?
                        // Or just let user manage it.
                        // User asked "confirm details".
                        this.close(); // Close detailed view to switch to edit view
                    });
                });
            });
        }

        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
