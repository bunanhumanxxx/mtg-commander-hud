export class MemoModal {
    constructor(store) {
        this.store = store;
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
            background: #2a2a2a; padding: 2rem; border-radius: 8px; width: 90%; max-width: 400px;
            display: flex; flex-direction: column; gap: 1rem; color: white; border: 1px solid #444;
        `;

        content.innerHTML = `
            <h3 style="margin: 0; text-align: center;">Memo</h3>
            <textarea id="memo-text" rows="4" placeholder="Enter note..." style="width: 100%; padding: 0.5rem; box-sizing: border-box; background: #333; color: white; border: 1px solid #555; resize: vertical;"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button id="btn-cancel" style="padding: 0.5rem 1rem; background: transparent; color: #888; border: 1px solid #555; cursor: pointer; border-radius: 4px;">Cancel</button>
                <button id="btn-save" style="padding: 0.5rem 1rem; background: #0088ff; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">Save</button>
            </div>
        `;

        content.querySelector('#btn-cancel').onclick = () => this.close();
        content.querySelector('#btn-save').onclick = () => {
            const text = content.querySelector('#memo-text').value;
            if (text.trim()) {
                this.store.dispatch('ADD_MEMO', { text });
            }
            this.close();
        };

        this.element.onclick = (e) => {
            if (e.target === this.element) this.close();
        };

        this.element.appendChild(content);
        return this.element;
    }

    close() {
        if (this.element) this.element.remove();
    }
}
