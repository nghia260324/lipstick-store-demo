import toast from '../utils/toast.js';

class Register {
    constructor() {
        this.form = document.querySelector('.auth-form');
        this.init();
    }

    init() {
        console.log('Register module loaded');
        if (!this.form) return;
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    /**
     * Xử lý gửi form đăng ký
     */
    async handleSubmit(e) {
        e.preventDefault();

        // 1. Thu thập dữ liệu
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        // 2. Kiểm tra mật khẩu khớp nhau
        if (data.password !== data.passwordConfirm) {
            toast.error('Mật khẩu nhập lại không khớp!');
            const confirmInput = this.form.querySelector('#regPasswordConfirm');
            confirmInput.focus();
            return;
        }

        // 3. Kiểm tra checkbox điều khoản
        if (!data.agree) {
            toast.warning('Bạn phải đồng ý với Điều khoản và Chính sách!');
            return;
        }

        // 4. Chuẩn bị payload cho API
        const payload = {
            full_name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone || ''
        };

        // 5. Gửi request
        try {
            const btn = this.form.querySelector('button[type="submit"]');
            const originalBtnHtml = btn.innerHTML;

            // Trạng thái loading
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Đang xử lý...';

            const response = await fetch('api/auth/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                toast.setFlash(result.message, 'success');
                window.location.href = 'login.php';
            } else {
                toast.error(result.message || 'Đã có lỗi xảy ra!');
                btn.disabled = false;
                btn.innerHTML = originalBtnHtml;
            }
        } catch (error) {
            console.error('Register error:', error);
            toast.error('Lỗi kết nối máy chủ!');

            const btn = this.form.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-person-check"></i> Tạo tài khoản';
        }
    }
}

// Khởi tạo module
export default new Register();