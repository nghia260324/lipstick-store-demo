import toast from '../utils/toast.js';

class Profile {
    constructor() {
        this.infoForm = document.querySelector('.profile-panel--info form');
        this.passForm = document.querySelector('.profile-panel--pass form');

        if (this.infoForm || this.passForm) {
            this.init();
        }
    }

    init() {
        if (this.infoForm) {
            this.infoForm.addEventListener('submit', (e) => this.handleUpdateInfo(e));
            
            // Avatar preview
            const avatarInput = document.getElementById('profileAvatar');
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarInput && avatarPreview) {
                avatarInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                            avatarPreview.src = re.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        }
        if (this.passForm) {
            this.passForm.addEventListener('submit', (e) => this.handleUpdatePassword(e));
        }
    }

    async handleUpdateInfo(e) {
        e.preventDefault();
        const submitBtn = this.infoForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        const fullName = document.getElementById('profileName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const avatarFile = document.getElementById('profileAvatar').files[0];

        if (!fullName || !phone) {
            toast.warning('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner loading-spinner--sm"></span> Đang lưu...';

            const formData = new FormData();
            formData.append('full_name', fullName);
            formData.append('phone', phone);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await fetch('./api/profile_update.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                
                // Cập nhật lại tên trên header
                const headerUserName = document.querySelector('.profile-menu__name');
                if (headerUserName) headerUserName.textContent = fullName;
                
                // Cập nhật lại avatar trên header
                if (result.avatar_url) {
                    const headerAvatars = document.querySelectorAll('.profile-menu__avatar img, .admin-profile-img');
                    headerAvatars.forEach(img => {
                        img.src = result.avatar_url;
                    });
                }
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Update info error:', error);
            toast.error('Có lỗi xảy ra khi cập nhật thông tin');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    async handleUpdatePassword(e) {
        e.preventDefault();
        const submitBtn = this.passForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            toast.warning('Mật khẩu nhập lại không khớp');
            return;
        }

        if (newPassword.length < 8) {
            toast.warning('Mật khẩu mới phải từ 8 ký tự trở lên');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner loading-spinner--sm"></span> Đang xử lý...';

            const formData = new FormData();
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);
            formData.append('confirm_password', confirmPassword);

            const response = await fetch('./api/password_update.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                this.passForm.reset();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Update password error:', error);
            toast.error('Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

export default new Profile();
