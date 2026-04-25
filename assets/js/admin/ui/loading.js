const Loading = {
    show(text = 'Đang xử lý...') {
        let overlay = document.querySelector('.loading-overlay');

        if (overlay) {
            overlay.querySelector('.loading-text').textContent = text;
            return;
        }

        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">${text}</div>
        `;

        document.body.appendChild(overlay);
    },

    hide() {
        const overlay = document.querySelector('.loading-overlay');
        if (!overlay) return;

        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
};

export function initLoading() {
    return Loading;
}
