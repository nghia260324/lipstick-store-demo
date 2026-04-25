const Confirm = {
    show({
        title = 'Xác nhận',
        message,
        confirmText = 'Đồng ý',
        cancelText = 'Hủy',
        type = 'warning',
        onConfirm,
        onCancel
    }) {
        // Remove existing if any
        const existing = document.querySelector('.global-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'global-modal';

        const icons = {
            warning: 'bi-exclamation-lg',
            danger: 'bi-trash',
            info: 'bi-question-lg'
        };

        let btnClass = 'btn-primary';
        if (type === 'danger') btnClass = 'btn-danger';

        modal.innerHTML = `
            <div class="modal-box">
                <div class="confirm-icon-wrapper">
                    <div class="confirm-icon ${type}">
                        <i class="bi ${icons[type] || icons.warning}"></i>
                    </div>
                </div>
                <div class="confirm-content">
                    <h3 class="confirm-title">${title}</h3>
                    <p class="confirm-message">${message}</p>
                </div>
                <div class="confirm-actions">
                    <button class="btn btn-outline" id="confirmCancelBtn">${cancelText}</button>
                    <button 
                        class="btn ${btnClass}" 
                        id="confirmOkBtn"
                        style="${type === 'danger'
                ? 'background: var(--color-error); border-color: var(--color-error);'
                : ''}">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        const close = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('#confirmOkBtn')
            .addEventListener('click', () => {
                if (typeof onConfirm === 'function') onConfirm();
                close();
            });

        modal.querySelector('#confirmCancelBtn')
            .addEventListener('click', () => {
                if (typeof onCancel === 'function') onCancel();
                close();
            });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (typeof onCancel === 'function') onCancel();
                close();
            }
        });
    }
};

export function initConfirm() {
    return Confirm;
}
