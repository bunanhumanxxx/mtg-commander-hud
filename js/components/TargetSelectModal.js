export class TargetSelectModal {
    constructor(candidates, onSelect, onCancel) {
        this.candidates = candidates; // Array of { id, name, image_url, ... }
        this.onSelect = onSelect;
        this.onCancel = onCancel;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #050a14; padding: 2rem; border-radius: 8px; width: 80%; max-width: 800px;
            max-height: 80vh; display: flex; flex-direction: column; gap: 1rem; color: white; border: 1px solid cyan; box-shadow: 0 0 20px cyan;
        `;

        content.innerHTML = `
            <h3 style="margin: 0; text-align: center; color: cyan; text-shadow: 0 0 5px cyan;">対象を選択 (Select Target)</h3>
            <div class="target-list" style="
                display: flex; flex-wrap: wrap; gap: 1rem; overflow-y: auto; padding: 1rem;
                justify-content: center; background: #222; border-radius: 4px; min-height: 200px;
            "></div>
            <button id="btn-cancel" style="padding: 0.5rem; background: transparent; color: #888; border: 1px solid #555; cursor: pointer; border-radius: 4px; align-self: center;">キャンセル</button>
        `;

        const listContainer = content.querySelector('.target-list');

        if (this.candidates.length === 0) {
            listContainer.innerHTML = '<p style="color: #666;">対象となるカードがありません。</p>';
        } else {
            // Group by Owner
            const groups = {};
            this.candidates.forEach(c => {
                const owner = c._ownerName || 'Unknown';
                if (!groups[owner]) groups[owner] = [];
                groups[owner].push(c);
            });

            Object.keys(groups).forEach(owner => {
                // Header
                const header = document.createElement('div');
                header.textContent = owner;
                header.style.cssText = 'width: 100%; color: #aaa; border-bottom: 1px solid #444; margin: 10px 0 5px 0; font-size: 0.9rem; padding-left: 5px;';
                listContainer.appendChild(header);

                // Container for this group
                const groupContainer = document.createElement('div');
                groupContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem;';

                groups[owner].forEach(card => {
                    const cardEl = document.createElement('div');

                    if (card._isPlayer) {
                        // Player Target Style
                        cardEl.className = 'target-player-item';
                        cardEl.innerHTML = `<span style="font-size: 1.5rem; margin-right: 10px;">👤</span> <span>${card.name}</span>`;
                        cardEl.style.cssText = `
                            width: 100%; background: #334; border: 1px solid #558; border-radius: 4px;
                            padding: 10px; cursor: pointer; display: flex; align-items: center; justify-content: flex-start;
                            margin-bottom: 5px;
                        `;
                    } else {
                        // Card Target Style
                        cardEl.className = 'target-card-item';
                        cardEl.style.cssText = `
                            width: 80px; height: 112px; background: #333; position: relative;
                            border-radius: 4px; cursor: pointer; border: 1px solid #000;
                            background-image: url(${card.image_url}); background-size: cover; background-position: center;
                        `;

                        // Fallback text if no image
                        if (!card.image_url) {
                            cardEl.innerHTML = `<div style="padding:5px; color:white; font-size:0.7rem; text-align:center;">${card.name}</div>`;
                        }

                        // Add Name Overlay
                        const nameOv = document.createElement('div');
                        nameOv.textContent = card.name;
                        nameOv.style.cssText = 'position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.6); color: white; font-size: 0.6rem; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none;';
                        cardEl.appendChild(nameOv);
                    }

                    cardEl.onmouseenter = () => cardEl.style.borderColor = 'gold';
                    cardEl.onmouseleave = () => cardEl.style.borderColor = card._isPlayer ? '#558' : 'transparent';

                    cardEl.onclick = () => {
                        if (this.onSelect) this.onSelect(card.instanceId);
                        this.close();
                    };

                    groupContainer.appendChild(cardEl);
                });
                listContainer.appendChild(groupContainer);
            });
        }

        content.querySelector('#btn-cancel').onclick = () => {
            if (this.onCancel) this.onCancel();
            this.close();
        };

        this.element.onclick = (e) => {
            if (e.target === this.element) {
                if (this.onCancel) this.onCancel();
                this.close();
            }
        };

        this.element.appendChild(content);
        return this.element;
    }

    close() {
        if (this.element) this.element.remove();
    }
}
