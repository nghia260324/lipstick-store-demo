import Toast from '../utils/toast.js';

class CartPage {
    constructor() {
        this.items = [];
        this.discount = 0;
        this.shippingFee = 30000;
        this.freeShipThreshold = 500000;

        this.init();
    }

    async init() {
        await this.fetchCart();
        this.setupEventListeners();
    }

    async fetchCart() {
        try {
            const response = await fetch('api/cart_get.php');
            const result = await response.json();

            if (result.success) {
                this.items = result.data.map(item => ({ 
                    ...item, 
                    selected: item.purchase_status === 'available' 
                }));
                this.render();
            } else {
                if (response.status === 401) {
                    window.location.href = 'login.php';
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải giỏ hàng:', error);
            Toast.error('Không thể tải dữ liệu giỏ hàng');
        }
    }

    render() {
        const layout = document.getElementById('cartLayout');
        const empty = document.getElementById('cartEmpty');
        const list = document.getElementById('cartItemsList');

        if (!this.items || this.items.length === 0) {
            if (layout) layout.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (layout) layout.style.display = 'grid';
        if (empty) empty.style.display = 'none';

        if (list) {
            list.innerHTML = this.items.map(item => this.createItemHTML(item)).join('');
        }

        this.updateSummary();
    }

    createItemHTML(item) {
        const isAvailable = item.purchase_status === 'available';
        const unitPrice = parseFloat(item.current_price);
        const total = unitPrice * item.quantity;
        const image = item.image || 'assets/images/placeholder-product.png';

        let checkHTML = `
            <label class="cart-check cart-item__check">
                <input type="checkbox" class="item-check" ${item.selected ? 'checked' : ''}>
                <span class="cart-check__box"></span>
            </label>`;
        
        let actionsHTML = `
            <div class="cart-item__unit-price">${this.formatPrice(unitPrice)}</div>
            <div class="qty-input" style="transform:scale(0.9);transform-origin:left">
                <div class="qty-input__btn" data-action="minus">−</div>
                <div class="qty-input__value">${item.quantity}</div>
                <div class="qty-input__btn" data-action="plus">+</div>
            </div>
            <div class="cart-item__total">${this.formatPrice(total)}</div>`;

        if (!isAvailable) {
            checkHTML = `<div class="cart-item__check"></div>`; // Bỏ trống cột chọn
            actionsHTML = `
                <div class="cart-item__status-msg" style="grid-column: span 3; color: var(--color-danger); font-size: var(--text-sm); font-weight: var(--font-medium);">
                    <i class="bi bi-exclamation-triangle"></i> Sản phẩm này hiện ${item.purchase_status.toLowerCase()}
                </div>`;
        }

        return `
            <div class="cart-item ${!isAvailable ? 'cart-item--unavailable' : ''}" data-id="${item.cart_item_id}">
                ${checkHTML}
                <div class="cart-item__product">
                    <img class="cart-item__img" src="${image}" alt="${item.product_name}"
                         onclick="location.href='product-detail.php?id=${item.product_id}'" style="cursor:pointer; ${!isAvailable ? 'filter: grayscale(1); opacity: 0.6;' : ''}">
                    <div style="${!isAvailable ? 'opacity: 0.6;' : ''}">
                        <div class="cart-item__brand">${item.brand_name}</div>
                        <div class="cart-item__name">${item.product_name}</div>
                        <div class="cart-item__color">
                            <span class="cart-item__color-dot" style="background:${item.hex_code}"></span>
                            <span>Màu: ${item.color_name}</span>
                        </div>
                    </div>
                </div>
                ${actionsHTML}
                <div class="cart-item__remove" title="Xóa sản phẩm"><i class="bi bi-trash3"></i></div>
            </div>`;
    }

    formatPrice(num) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }

    updateSummary() {
        let subtotal = 0;
        let selectedCount = 0;

        this.items.forEach(item => {
            if (item.selected) {
                subtotal += parseFloat(item.current_price) * item.quantity;
                selectedCount++;
            }
        });

        // const ship = subtotal >= this.freeShipThreshold ? 0 : this.shippingFee;
        const grandTotal = subtotal; // Tạm thời bỏ qua phí ship và mã giảm giá

        document.getElementById('subtotal').textContent = this.formatPrice(subtotal);
        /*
        const shipEl = document.getElementById('shipping');
        if (ship === 0) {
            shipEl.textContent = 'Miễn phí 🎉';
            shipEl.classList.add('free');
        } else {
            shipEl.textContent = this.formatPrice(ship);
            shipEl.classList.remove('free');
        }
        */
        document.getElementById('grandTotal').textContent = this.formatPrice(grandTotal);

        // Update Select All checkbox state
        const selectAll = document.getElementById('selectAllItems');
        if (selectAll) {
            const purchasableItems = this.items.filter(item => item.purchase_status === 'available');
            selectAll.checked = selectedCount === purchasableItems.length && purchasableItems.length > 0;
        }

        // Disable checkout button if no items selected
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            if (selectedCount === 0) {
                checkoutBtn.classList.add('btn--disabled');
                checkoutBtn.style.pointerEvents = 'none';
                checkoutBtn.style.opacity = '0.5';
            } else {
                checkoutBtn.classList.remove('btn--disabled');
                checkoutBtn.style.pointerEvents = 'auto';
                checkoutBtn.style.opacity = '1';
            }
        }
        /*
        if (this.discount > 0) {
            document.getElementById('discountRow').style.display = 'flex';
            document.getElementById('discountAmt').textContent = '-' + this.formatPrice(this.discount);
        } else {
            document.getElementById('discountRow').style.display = 'none';
        }
        */
    }

    setupEventListeners() {
        const list = document.getElementById('cartItemsList');
        if (!list) return;

        list.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.cart-item');
            if (!itemEl) return;

            const cartItemId = itemEl.dataset.id;

            // 0. Toggle selection
            const check = e.target.closest('.item-check');
            if (check) {
                const item = this.items.find(i => i.cart_item_id == cartItemId);
                if (item) {
                    item.selected = check.checked;
                    this.updateSummary();
                }
                return;
            }

            // 1. Xóa item
            if (e.target.closest('.cart-item__remove')) {
                this.removeItem(cartItemId);
                return;
            }

            // Thay đổi số lượng
            const qtyBtn = e.target.closest('.qty-input__btn');
            if (qtyBtn) {
                const action = qtyBtn.dataset.action;
                const currentQty = parseInt(itemEl.querySelector('.qty-input__value').textContent);
                let newQty = currentQty;

                if (action === 'minus') newQty = Math.max(1, currentQty - 1);
                if (action === 'plus') newQty = Math.min(20, currentQty + 1);

                if (newQty !== currentQty) {
                    this.updateQuantity(cartItemId, newQty);
                }
            }
        });

        // Chọn tất cả
        document.getElementById('selectAllItems')?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            this.items.forEach(item => {
                if (item.purchase_status === 'available') {
                    item.selected = isChecked;
                }
            });
            this.render(); // Re-render to update item checkboxes
        });

        // Xóa toàn bộ
        document.getElementById('clearCartBtn')?.addEventListener('click', () => {
            this.clearCart();
        });

        // Thanh toán
        document.getElementById('checkoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();

            const selectedIds = this.items
                .filter(item => item.selected)
                .map(item => item.cart_item_id);

            if (selectedIds.length === 0) {
                Toast.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
                return;
            }

            // Chuyển hướng sang trang checkout kèm danh sách ID sản phẩm đã chọn
            const idsParam = selectedIds.join(',');
            window.location.href = `checkout.php?ids=${idsParam}`;
        });
    }

    async updateQuantity(cartItemId, quantity) {
        try {
            const formData = new FormData();
            formData.append('cart_item_id', cartItemId);
            formData.append('quantity', quantity);

            const response = await fetch('api/cart_update.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                const item = this.items.find(i => i.cart_item_id == cartItemId);
                if (item) item.quantity = quantity;
                this.render();

                // Cập nhật badge ở header
                this.updateHeaderBadge();
            } else {
                Toast.error(result.message);
            }
        } catch (error) {
            Toast.error('Không thể cập nhật số lượng');
        }
    }

    async removeItem(cartItemId) {
        try {
            const formData = new FormData();
            formData.append('cart_item_id', cartItemId);

            const response = await fetch('api/cart_remove.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                this.items = this.items.filter(i => i.cart_item_id != cartItemId);
                this.render();
                Toast.info(result.message);
                this.updateHeaderBadge();
            } else {
                Toast.error(result.message);
            }
        } catch (error) {
            Toast.error('Không thể xóa sản phẩm');
        }
    }

    async clearCart() {
        try {
            const formData = new FormData();
            formData.append('clear_all', '1');

            const response = await fetch('api/cart_remove.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                this.items = [];
                this.render();
                Toast.info(result.message);
                this.updateHeaderBadge();
            }
        } catch (error) {
            Toast.error('Không thể xóa giỏ hàng');
        }
    }

    applyCoupon() {
        const input = document.getElementById('couponInput');
        const code = input.value.trim().toUpperCase();

        if (code === 'LIPLUX20') {
            let total = 0;
            this.items.forEach(i => total += parseFloat(i.current_price) * i.quantity);
            this.discount = Math.round(total * 0.2);
            Toast.success('Áp dụng mã thành công! Giảm 20% 🎉');
            this.updateSummary();
        } else {
            Toast.error('Mã giảm giá không hợp lệ');
        }
    }

    updateHeaderBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const total = this.items.reduce((sum, item) => sum + parseInt(item.quantity), 0);
            badge.textContent = total;
        }
    }
}

new CartPage();
