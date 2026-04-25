import Toast from './toast.js';

class Cart {
    constructor() {
        this.cartBadge = document.getElementById('cartBadge');
    }

    /**
     * Thêm sản phẩm vào giỏ hàng qua API
     * @param {number|string} colorId - ID của phân loại màu
     * @param {number} quantity - Số lượng
     */
    async add(colorId, quantity = 1) {
        try {
            const formData = new FormData();
            formData.append('color_id', colorId);
            formData.append('quantity', quantity);

            const response = await fetch('api/cart_add.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Cập nhật số lượng trên badge ở header
                this.updateBadge(result.totalCart);

                // Hiển thị thông báo thành công
                Toast.success(result.message);

                return result;
            } else {
                // Xử lý lỗi từ server (VD: chưa đăng nhập, hết hàng, quá số lượng)
                Toast.error(result.message);

                if (response.status === 401) {
                    // Có thể chuyển hướng đến trang login nếu muốn
                    // window.location.href = 'login.php';
                }
                return null;
            }
        } catch (error) {
            console.error('Cart Error:', error);
            Toast.error('Đã xảy ra lỗi khi kết nối đến máy chủ');
            return null;
        }
    }

    /**
     * Cập nhật số lượng trên icon giỏ hàng ở header
     * @param {number} count 
     */
    updateBadge(count) {
        if (this.cartBadge) {
            this.cartBadge.textContent = count;
            this.cartBadge.classList.add('pulse');
            setTimeout(() => this.cartBadge.classList.remove('pulse'), 500);
        }
    }

    /**
     * Lấy số lượng mới nhất từ server và cập nhật badge
     */
    async refreshBadge() {
        try {
            const response = await fetch('api/cart_get_count.php');
            const result = await response.json();
            if (result.success) {
                this.updateBadge(result.totalCart);
            }
        } catch (error) {
            console.error('Refresh Badge Error:', error);
        }
    }
}

const cart = new Cart();
export default cart;
