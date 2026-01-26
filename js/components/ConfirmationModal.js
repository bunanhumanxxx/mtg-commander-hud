export class ConfirmationModal {
    constructor(message, onConfirm, onCancel) {
        this.message = message;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 7000;
        `;

        this.element.innerHTML = `
            <div class="confirm-modal-content" style="
                background: #050a14; 
                padding: 2rem; 
                border-radius: 8px; 
                width: 300px; 
                display: flex; 
                flex-direction: column; 
                gap: 1rem; 
                color: white; 
                border: 1px solid cyan; 
                box-shadow: 0 0 15px cyan, 0 0 30px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.1);
                backdrop-filter: blur(5px);
            ">
                <h3 style="margin: 0; text-align: center; font-size:1.1rem; color: cyan; text-shadow: 0 0 5px cyan;">${this.message}</h3>
                
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button id="btn-yes" style="flex: 1; padding: 0.8rem; background: #0088AA; color: white; border: 1px solid cyan; cursor: pointer; border-radius: 4px; font-weight:bold; box-shadow: 0 0 5px cyan;">Yes</button>
                    <button id="btn-no" style="flex: 1; padding: 0.8rem; background: transparent; color: #888; border: 1px solid #555; cursor: pointer; border-radius: 4px; font-weight:bold;">No</button>
                </div>
            </div>
        `;

        this.element.querySelector('#btn-yes').addEventListener('click', () => {
            if (this.onConfirm) this.onConfirm();
            this.close();
        });

        this.element.querySelector('#btn-no').addEventListener('click', () => {
            if (this.onCancel) this.onCancel();
            this.close();
        });

        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                if (this.onCancel) this.onCancel();
                this.close();
            }
        });

        return this.element;
    }

    close() {
        this.element.remove();
    }
}
