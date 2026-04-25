import toast from '../utils/toast.js';

class Login {
    constructor() {
        this.form = document.querySelector('.auth-form');
        this.init();
    }

    init() {
        console.log('Login module loaded');
        if (!this.form) return;
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        try {
            const btn = this.form.querySelector('button[type="submit"]');
            const originalBtnHtml = btn.innerHTML;

            // Trạng thái loading
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Đang đăng nhập...';

            const response = await fetch('api/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                toast.setFlash(result.message, 'success');
                window.location.href = result.redirect || 'home.php';
            } else {
                toast.error(result.message || 'Đăng nhập thất bại!');
                btn.disabled = false;
                btn.innerHTML = originalBtnHtml;
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Lỗi kết nối máy chủ!');
            
            const btn = this.form.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Đăng nhập';
        }
    }
}

export default new Login();