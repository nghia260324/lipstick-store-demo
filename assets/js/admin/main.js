import { initModal } from './ui/modal.js';
import { initToast } from './ui/toast.js';
import { initConfirm } from './ui/confirm.js';
import { initLoading } from './ui/loading.js';

class Main {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {

            window.App = {
                toast: null,
                modal: null,
                confirm: null,
                loading: null
            };

            App.modal = initModal();
            App.toast = initToast();
            App.confirm = initConfirm();
            App.loading = initLoading();

            console.log('[App] Admin Core Initialized');
            
            // Initial dynamic update and polling
            this.updateSidebarBadge();
            setInterval(() => this.updateSidebarBadge(), 60000);
            
            // Expose globally to be called from other modules
            window.App.updateSidebarBadge = () => this.updateSidebarBadge();
        });
    }

    async updateSidebarBadge() {
        try {
            const response = await fetch('api/orders/get_active_count.php');
            const result = await response.json();
            if (result.success) {
                const badge = document.getElementById('adminOrderBadge');
                if (badge) {
                    badge.textContent = result.count;
                    badge.style.display = result.count > 0 ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('[Badge] Update failed:', error);
        }
    }
}

export default new Main();