import { Store } from './store.js';
import { renderApp } from './components/App.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('MTG Commander App Initializing...');

    // Initialize Store
    const store = new Store();

    // Initial Render
    renderApp(document.getElementById('app'), store);
});
