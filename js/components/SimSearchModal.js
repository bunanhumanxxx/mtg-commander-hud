import { renderCard } from './Card.js';

export class SimSearchModal {
    constructor(store, playerId, destination, onComplete) {
        this.store = store;
        this.playerId = playerId;
        this.destination = destination || 'hand'; // Default to Hand if none selected? User said "Target Destination".
        // If Target Destination is empty (None), maybe we assume Hand or just "Remove"?
        // Previous step: None = Remove to void.
        // But for Search, usually we search TO somewhere.
        // Let's pass the raw destination.
        this.onComplete = onComplete;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-search-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9300; display: flex; justify-content: center; align-items: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #111; width: 80%; height: 80%; border: 1px solid #444; border-radius: 8px;
            display: flex; flex-direction: column; overflow: hidden;
        `;

        const destName = this.destination ? (this.destination === 'grave' ? 'Graveyard' : (this.destination === 'hand' ? 'Hand' : 'Exile')) : 'Removal (Void)';
        const header = document.createElement('div');
        header.innerHTML = `<h3 style="margin:0; padding: 1rem; color:var(--neon-green); background:#222;">Search Deck -> Target: ${destName}</h3>`;
        header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE';
        closeBtn.style.padding = '0.5rem 1rem';
        closeBtn.style.background = '#333';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => this.element.remove();
        header.appendChild(closeBtn);
        content.appendChild(header);

        const list = document.createElement('div');
        list.style.cssText = 'flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;';

        const zone = this.store.getState().zones[this.playerId];
        const library = zone.simLibrary || [];

        // Sort by name
        const sortedLib = [...library].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        sortedLib.forEach(card => {
            // Render simplified card or image?
            // Use Image for better recognition
            const item = document.createElement('div');
            item.style.cssText = `
                width: 120px; aspect-ratio: 2.5/3.5; 
                background-image: url(${card.image_url}); background-size: cover; background-position: center;
                border-radius: 6px; cursor: pointer; transition: transform 0.2s;
                position: relative; border: 1px solid #444;
            `;
            item.title = card.name;

            item.onmouseenter = () => item.style.transform = 'scale(1.1)';
            item.onmouseleave = () => item.style.transform = 'scale(1)';

            item.onclick = () => {
                if (confirm(`Move ${card.name} to ${destName}?`)) {
                    this.store.dispatch('SEARCH_SIM_DECK', {
                        playerId: this.playerId,
                        cardId: card.instanceId,
                        destination: this.destination
                    });
                    this.element.remove();
                    if (this.onComplete) this.onComplete();
                }
            };
            list.appendChild(item);
        });

        content.appendChild(list);

        // Footer hint
        const footer = document.createElement('div');
        footer.textContent = `Click a card to move it to [${destName}]. Deck will be shuffled.`;
        footer.style.padding = '0.5rem';
        footer.style.textAlign = 'center';
        footer.style.color = '#666';
        footer.style.background = '#222';
        content.appendChild(footer);

        this.element.appendChild(content);
        return this.element;
    }
}
