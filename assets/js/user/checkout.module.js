import Toast from '../utils/toast.js';

class CheckoutPage {
    constructor() {
        this.params = new URLSearchParams(location.search);
        this.selectedIds = (this.params.get('ids') || '').split(',').filter(id => id).map(id => parseInt(id));
        this.items = [];

        this.init();
    }

    async init() {
        if (this.selectedIds.length === 0) {
            Toast.error('Không tìm thấy sản phẩm để thanh toán');
            setTimeout(() => window.location.href = 'cart.php', 2000);
            return;
        }

        await this.fetchItems();
        this.setupEventListeners();
    }

    async fetchItems() {
        try {
            const idsParam = this.selectedIds.join(',');
            const response = await fetch(`api/checkout_items.php?ids=${idsParam}`);
            const result = await response.json();

            if (result.success) {
                this.items = result.data;
                
                if (this.items.length === 0) {
                    Toast.error('Không tìm thấy sản phẩm hợp lệ để thanh toán');
                    setTimeout(() => window.location.href = 'cart.php', 2000);
                    return;
                }

                this.render();
            } else {
                if (response.status === 401) {
                    window.location.href = 'login.php';
                } else {
                    Toast.error(result.message);
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin thanh toán:', error);
            Toast.error('Không thể tải dữ liệu thanh toán');
        }
    }

    render() {
        const list = document.getElementById('reviewItems');
        const itemCountEl = document.getElementById('itemCount');
        const subtotalEl = document.getElementById('subtotal');
        const grandTotalEl = document.getElementById('grandTotal');
        const placeOrderBtn = document.getElementById('placeOrderBtn');

        if (!list) return;

        let subtotal = 0;
        let count = 0;
        let hasUnavailable = false;

        list.innerHTML = this.items.map(item => {
            const isAvailable = item.purchase_status === 'available';
            if (!isAvailable) hasUnavailable = true;

            const unitPrice = parseFloat(item.current_price);
            const total = unitPrice * item.quantity;
            
            if (isAvailable) {
                subtotal += total;
                count += parseInt(item.quantity);
            }

            const image = item.image || 'assets/images/placeholder-product.png';

            return `
                <div class="payment-review-item ${!isAvailable ? 'payment-review-item--unavailable' : ''}">
                    <img class="payment-review-img" src="${image}" alt="${item.product_name}" style="${!isAvailable ? 'filter:grayscale(1);opacity:0.5' : ''}">
                    <div style="flex:1; ${!isAvailable ? 'opacity:0.5' : ''}">
                        <div class="payment-review-name">${item.product_name}</div>
                        <div class="payment-review-qty">${item.brand_name} · Màu: ${item.color_name} · x${item.quantity}</div>
                    </div>
                    <span class="payment-review-price" style="${!isAvailable ? 'color:var(--color-danger);font-size:var(--text-xs)' : ''}">
                        ${isAvailable ? this.formatPrice(total) : `<i class="bi bi-exclamation-circle"></i> ${item.purchase_status}`}
                    </span>
                </div>`;
        }).join('');

        if (itemCountEl) itemCountEl.textContent = count;
        if (subtotalEl) subtotalEl.textContent = this.formatPrice(subtotal);
        if (grandTotalEl) grandTotalEl.textContent = this.formatPrice(subtotal);

        if (hasUnavailable && placeOrderBtn) {
            placeOrderBtn.disabled = true;
            placeOrderBtn.classList.add('btn--disabled');
            placeOrderBtn.innerHTML = '<i class="bi bi-x-circle"></i> Vui lòng kiểm tra lại giỏ hàng';
            
            if (!document.getElementById('checkoutWarning')) {
                const warning = document.createElement('div');
                warning.id = 'checkoutWarning';
                warning.style.cssText = 'color:var(--color-danger); background:rgba(200,54,90,0.1); padding:var(--space-3); border-radius:var(--radius-md); font-size:var(--text-sm); margin-top:var(--space-3); text-align:center';
                warning.innerHTML = 'Một số sản phẩm trong đơn hàng hiện không khả dụng. Vui lòng quay lại <a href="cart.php" style="text-decoration:underline;font-weight:bold">Giỏ hàng</a> để cập nhật.';
                placeOrderBtn.parentNode.insertBefore(warning, placeOrderBtn.nextSibling);
            }
        }
    }

    formatPrice(num) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }

    setupEventListeners() {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.handlePlaceOrder());
        }
    }

    async handlePlaceOrder() {
        // Validate form
        const requiredFields = [
            { id: 'fullName', name: 'Họ và tên' },
            { id: 'phone', name: 'Số điện thoại' },
            { id: 'address', name: 'Địa chỉ nhận hàng' }
        ];

        for (const field of requiredFields) {
            const el = document.getElementById(field.id);
            if (!el || !el.value.trim()) {
                Toast.warning(`Vui lòng nhập ${field.name}`);
                el?.focus();
                return;
            }
        }

        if (this.items.some(item => item.purchase_status !== 'available')) {
            Toast.error('Một số sản phẩm không khả dụng. Vui lòng kiểm tra lại đơn hàng.');
            return;
        }

        const data = {
            fullName: document.getElementById('fullName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            note: document.getElementById('note').value.trim(),
            paymentMethod: document.querySelector('input[name="payment"]:checked')?.value || 'cod',
            items: this.selectedIds
        };

        try {
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            const originalBtnHTML = placeOrderBtn.innerHTML;
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang xử lý...';

            const response = await fetch('api/order_create.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.order_code);
            } else {
                Toast.error(result.message || 'Có lỗi xảy ra khi đặt hàng');
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerHTML = originalBtnHTML;
            }
        } catch (error) {
            console.error('Lỗi đặt hàng:', error);
            Toast.error('Không thể kết nối tới máy chủ');
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = '<i class="bi bi-bag-check"></i> Đặt hàng ngay';
        }
    }

    showSuccess(orderCode) {
        const codeEl = document.getElementById('orderCode');
        if (codeEl) codeEl.textContent = '#' + orderCode;

        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
}

new CheckoutPage();
