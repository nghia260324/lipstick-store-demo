/**
 * Toast Notification Module
 * Dùng để hiển thị thông báo nhanh cho người dùng
 */
class Toast {
    constructor() {
        this.container = document.getElementById('toastContainer');
        
        // Nếu chưa có container trong DOM, tự tạo mới
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }

        // Kiểm tra xem có thông báo nào được lưu từ trang trước không
        this.checkFlash();
    }

    /**
     * Lưu thông báo vào localStorage để hiển thị sau khi load trang
     */
    setFlash(message, type = 'success') {
        localStorage.setItem('toast_flash', JSON.stringify({ message, type }));
    }

    /**
     * Kiểm tra và hiển thị thông báo flash
     */
    checkFlash() {
        const flash = localStorage.getItem('toast_flash');
        if (flash) {
            const { message, type } = JSON.parse(flash);
            this.show(message, type);
            localStorage.removeItem('toast_flash');
        }
    }

    /**
     * Hiển thị thông báo
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        // Xác định icon dựa trên loại thông báo
        let icon = 'bi-info-circle';
        if (type === 'success') icon = 'bi-check-circle';
        if (type === 'error') icon = 'bi-exclamation-circle';
        if (type === 'warning') icon = 'bi-exclamation-triangle';

        toast.innerHTML = `
            <i class="bi ${icon}"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Tự động xóa sau thời gian chỉ định
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease both';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Các phương thức viết tắt
    success(message, duration) { this.show(message, 'success', duration); }
    error(message, duration) { this.show(message, 'error', duration); }
    info(message, duration) { this.show(message, 'info', duration); }
    warning(message, duration) { this.show(message, 'warning', duration); }
}

// Xuất bản thể duy nhất (Singleton)
const toast = new Toast();
export default toast;
