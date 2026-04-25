// ui/modal.js
export function initModal() {
    function open(id) {
        const modal = document.getElementById(id);
        if (!modal) {
            console.warn(`[Modal] Not found: ${id}`);
            return;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function close(id) {
        let modal = null;

        if (id) {
            modal = document.getElementById(id);
        } else {
            modal = document.querySelector('.modal-overlay.active');
        }

        if (!modal) return;

        modal.classList.remove('active');

        // nếu không còn modal nào mở thì trả lại scroll
        if (!document.querySelector('.modal-overlay.active')) {
            document.body.style.overflow = '';
        }
    };

    // event delegation
    document.addEventListener('click', e => {
        // Mở modal
        const openBtn = e.target.closest('[data-modal-open]');
        if (openBtn) {
            e.preventDefault();
            open(openBtn.dataset.modalOpen);
            return;
        }

        // Đóng modal bằng nút đóng
        const closeBtn = e.target.closest('[data-modal-close]');
        if (closeBtn) {
            e.preventDefault();
            close(closeBtn.dataset.modalClose || null);
            return;
        }

        // Đóng modal khi click ra ngoài (overlay)
        if (e.target.classList.contains('modal-overlay')) {
            close(e.target.id);
            return;
        }
    });

    console.log('[Modal] Initialized');

    return { open, close };
}
