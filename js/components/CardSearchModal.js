import { ScryfallAPI } from '../api.js';
import { debounce, generateId } from '../utils.js';

export class CardSearchModal {
    constructor(store, playerId, onSelect = null) {
        this.store = store;
        this.playerId = playerId;
        this.onSelect = onSelect;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-search-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: flex-start; 
            padding-top: 50px; z-index: 2000;
        `;

        this.element.innerHTML = `
            <div class="search-modal-content" style="
                background: #050a14; 
                border: 1px solid var(--neon-blue); 
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); 
                backdrop-filter: blur(10px); 
                color: white; 
                padding: 1rem; 
                border-radius: 8px; 
                width: 95%; 
                max-width: 900px; 
                display: flex; 
                flex-direction: column; 
                height: auto;
                max-height: 95vh;
                min-height: 300px;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; flex-shrink: 0; align-items: center;">
                    <h3 style="margin: 0; color: var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); text-transform: uppercase; letter-spacing: 2px; font-size: 1.2rem;">Add Card</h3>
                    <button class="close-btn" style="
                        padding: 0.5rem 1rem; cursor: pointer; background: transparent; color: #888; 
                        border: 1px solid #555; border-radius: 4px; font-weight: bold; transition: all 0.2s;
                    " onmouseover="this.style.borderColor='var(--neon-blue)'; this.style.color='var(--neon-blue)';" onmouseout="this.style.borderColor='#555'; this.style.color='#888';">CLOSE</button>
                </div>
                <input type="text" placeholder="Search Card (Japanese/English)..." id="card-search-input" style="
                    padding: 0.8rem; font-size: 1rem; margin-bottom: 1rem; background: #222; 
                    color: white; border: 1px solid #555; border-radius: 4px; flex-shrink: 0;
                ">
                
                <div class="search-body" style="display: flex; gap: 1rem; flex: 1; overflow: hidden; min-height: 0; flex-wrap: wrap;">
                    <!-- Results List -->
                    <div id="search-results-list" style="
                        flex: 1; 
                        min-width: 250px;
                        overflow-y: auto; 
                        background: rgba(255,255,255,0.05); 
                        border: 1px solid #444; 
                        border-radius: 4px; 
                        display: flex; 
                        flex-direction: column;
                        height: 100%;
                    ">
                        <p style="padding: 1rem; color: #888; text-align: center;">Type to search...</p>
                    </div>
                    
                    <!-- Preview Area -->
                    <div id="search-preview-area" style="
                        width: 100%; max-width: 300px; 
                        flex: 0 0 auto;
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: flex-start; 
                        background: rgba(0,0,0,0.3); 
                        padding: 1rem; 
                        border-radius: 4px; 
                        border: 1px solid #444; 
                        overflow-y: auto; 
                        display: none; /* Hidden by default on small screens if empty? Or managed via JS? Let's keep it visible but responsive */
                    ">
                        <!-- We will let JS manage display or just let it stack via wrap -->
                        <!-- Actually, if we use flex-wrap, 300px might take full width below. That's fine. -->
                        <div id="preview-image-container" style="
                            width: 100%; aspect-ratio: 2.5/3.5; background: rgba(255,255,255,0.05); 
                            display: flex; align-items: center; justify-content: center; 
                            border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px dashed #555;
                        ">
                            <span style="color: #666;">Preview</span>
                        </div>
                        <div id="preview-details" style="margin-top: 1rem; text-align: center; color: var(--neon-blue); font-size: 0.9rem; text-shadow: 0 0 5px rgba(0, 243, 255, 0.5);"></div>
                    </div>
                </div>
            </div>
        `;

        // Listeners
        const input = this.element.querySelector('#card-search-input');
        const listContainer = this.element.querySelector('#search-results-list');
        const previewImageContainer = this.element.querySelector('#preview-image-container');
        const previewDetails = this.element.querySelector('#preview-details');
        const closeBtn = this.element.querySelector('.close-btn');

        closeBtn.addEventListener('click', () => this.close());
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        input.focus();

        input.addEventListener('input', debounce(async (e) => {
            const query = e.target.value;
            if (!query || query.trim().length === 0) return;

            listContainer.innerHTML = '<p style="padding: 1rem; text-align: center;">Searching...</p>';

            const cards = await ScryfallAPI.searchCards(query);
            listContainer.innerHTML = '';

            if (cards.length === 0) {
                listContainer.innerHTML = '<p style="padding: 1rem; text-align: center;">No results found.</p>';
                return;
            }

            // Auto-select first for preview
            if (cards[0].image_url) {
                previewImageContainer.innerHTML = `<img src="${cards[0].image_url}" style="width: 100%; height: 100%; object-fit: contain;">`;
                previewDetails.textContent = `${cards[0].name} (${cards[0].set})`;
                // Ensure visible even on small screen if populated?
                const previewArea = this.element.querySelector('#search-preview-area');
                previewArea.style.display = 'flex';
            }

            cards.forEach(card => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.style.cssText = `
                    padding: 0.5rem 1rem; cursor: pointer; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;
                `;
                item.innerHTML = `
                    <div style="flex:1;">
                        <div style="font-weight:bold; color: ${card.lang === 'ja' ? '#ff9999' : '#ccc'};">${card.name}</div>
                        <div style="font-size: 0.8rem; color: #888;">${card.set} #${card.collector_number} ${card.lang === 'ja' ? '[JP]' : '[EN]'}</div>
                    </div>
                `;

                // Hover Preview
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#333';
                    if (card.image_url) {
                        previewImageContainer.innerHTML = `<img src="${card.image_url}" style="width: 100%; height: 100%; object-fit: contain;">`;
                    } else {
                        previewImageContainer.innerHTML = '<span style="color: #666;">No Image</span>';
                    }
                    previewDetails.textContent = `${card.name} (${card.set})`;
                });

                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                });

                // Click Add
                item.addEventListener('click', () => {
                    this.addCard(card);
                });

                listContainer.appendChild(item);
            });
        }, 300));

        return this.element;
    }

    addCard(cardData) {
        if (this.onSelect) {
            this.onSelect(cardData);
            this.close();
            return;
        }

        // Dispatch action to add card
        this.store.dispatch('ADD_CARD_TO_BATTLEFIELD', {
            playerId: this.playerId,
            card: {
                ...cardData,
                id: generateId(),
                instanceId: generateId(),
                tapped: false,
                counters: {},
                x: 0, y: 0 // Position if we did canvas, but here we do flow layout usually
            }
        });

        this.close();
    }

    close() {
        this.element.remove();
    }
}
