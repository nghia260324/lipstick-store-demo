export function initToast() {
    let container = null;
    const STORAGE_KEY = '__APP_TOAST_AFTER_LOAD__';

    function init() {
        if (!document.querySelector('.admin.toast-container')) {
            container = document.createElement('div');
            container.className = 'admin toast-container';
            document.body.appendChild(container);
        } else {
            container = document.querySelector('.admin.toast-container');
        }

        showAfterLoad();
    }

    function show(message, type = 'info', duration = 3000) {
        if (!container) init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };

        const titles = {
            success: 'Thành công',
            error: 'Lỗi',
            warning: 'Cảnh báo',
            info: 'Thông báo'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="bi ${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <h4 class="toast-title">${titles[type]}</h4>
                <p class="toast-message">${message}</p>
            </div>
            <div class="toast-close">
                <i class="bi bi-x"></i>
            </div>
        `;

        toast.querySelector('.toast-close')
            .addEventListener('click', () => toast.remove());

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('hiding');
                toast.addEventListener('animationend', () => toast.remove());
            }, duration);
        }
    }

    function success(msg, duration) {
        show(msg, 'success', duration);
    }

    function error(msg, duration) {
        show(msg, 'error', duration);
    }

    function warning(msg, duration) {
        show(msg, 'warning', duration);
    }

    function info(msg, duration) {
        show(msg, 'info', duration);
    }

    function setAfterLoad(message, type = 'success', duration = 3000) {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ message, type, duration })
        );
    }

    function showAfterLoad() {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        try {
            const { message, type, duration } = JSON.parse(raw);
            show(message, type, duration);
        } catch (err) {
            console.warn('[Toast] Invalid after-load data');
        }

        sessionStorage.removeItem(STORAGE_KEY);
    }

    init();

    return {
        show,
        success,
        error,
        warning,
        info,
        setAfterLoad
    };
}

