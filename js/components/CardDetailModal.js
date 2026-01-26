export class CardDetailModal {
    constructor(card) {
        this.card = card;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 2147483647;
        `;

        this.element.innerHTML = `
            <div class="detail-modal-content" style="background: #050a14; padding: 20px; border-radius: 8px; width: 90%; max-width: 800px; display: flex; gap: 20px; max-height: 90vh; overflow-y: auto; border: 1px solid cyan; box-shadow: 0 0 20px cyan; color: white;">
                <div class="detail-image" style="flex: 1; display:flex; justify-content:center; align-items:center;">
                    ${this.card.image_url ? `<img src="${this.card.image_url}" style="max-width: 100%; border-radius: 10px; box-shadow: 0 0 15px cyan;">` : '<div style="width:300px; height:420px; background:rgba(0, 255, 255, 0.1); display:flex; justify-content:center; align-items:center; border-radius:10px; border: 1px dashed cyan; color: cyan;">No Image</div>'}
                </div>
                <div class="detail-info" style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                    <div style="border-bottom: 1px solid cyan; padding-bottom: 10px;">
                        <h2 style="margin: 0; font-size: 1.5rem; color: cyan; text-shadow: 0 0 5px cyan;">${this.card.name}</h2>
                        ${this.card.original_name && this.card.original_name !== this.card.name ? `<div style="color: #4dd; font-size: 0.9rem;">${this.card.original_name}</div>` : ''}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; font-size: 1.1rem; color: white;">${this.card.mana_cost || ''}</span>
                        <span style="background: rgba(0, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.9rem; color: cyan; border: 1px solid cyan;">${this.card.set || ''} #${this.card.collector_number || ''}</span>
                    </div>

                    <div style="font-style: italic; color: #aee;">${this.card.type_line || ''}</div>
                    
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 4px; border: 1px solid #335; white-space: pre-wrap; font-family: sans-serif; line-height: 1.4; color: #ddd;">${this.card.oracle_text || ''}</div>

                    ${(this.card.power !== undefined && this.card.toughness !== undefined) ?
                `<div style="align-self: flex-end; font-size: 1.2rem; font-weight: bold; background: rgba(0, 255, 255, 0.1); padding: 4px 8px; border-radius: 4px; border: 1px solid cyan; color: cyan;">${this.card.power}/${this.card.toughness}</div>` : ''}
                    
                    <button class="close-btn" style="margin-top: auto; padding: 10px; cursor: pointer; background: transparent; color: cyan; border: 1px solid cyan; border-radius: 4px; font-size: 1rem; transition: all 0.2s; box-shadow: 0 0 5px cyan;">Close</button>
                </div>
            </div>
        `;

        const closeBtn = this.element.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.close());
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
