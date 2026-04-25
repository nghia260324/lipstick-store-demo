class Orders {
    constructor() {
        this.container = document.getElementById('ordersList');
        this.filterInputs = document.querySelectorAll('input[name="orderFilter"]');

        if (this.container) {
            this.init();
        }
    }

    init() {
        this.loadOrders();
        this.initEvents();
    }

    initEvents() {
        this.filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                const status = input.value;
                this.loadOrders(status);
            });
        });
    }

    async loadOrders(status = 'all') {
        this.renderLoading();
        try {
            const response = await fetch(`./api/orders_get.php?status=${status}`);
            const result = await response.json();

            if (result.success) {
                this.renderOrders(result.data);
                this.updateCounts(result.counts);
            } else {
                this.renderError(result.message);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            this.renderError('Không thể kết nối đến máy chủ');
        }
    }

    renderOrders(orders) {
        if (orders.length === 0) {
            this.container.innerHTML = `
                <div class="text-center py-16 opacity-50">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <p>Bạn chưa có đơn hàng nào trong trạng thái này.</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = orders.map(order => this.createOrderHTML(order)).join('');
    }

    updateCounts(counts) {
        if (!counts) return;
        document.querySelectorAll('.orders-filter__count').forEach(el => {
            const key = el.dataset.count;
            if (counts[key] !== undefined) {
                el.textContent = counts[key];
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    createOrderHTML(order) {
        const statusMap = {
            0: { label: 'Chờ xác nhận', class: 'pending' },
            1: { label: 'Đã xác nhận', class: 'pending' },
            2: { label: 'Đang giao', class: 'ship' },
            3: { label: 'Đã giao', class: 'done' },
            4: { label: 'Đã hủy', class: 'cancel' }
        };

        const status = statusMap[order.status] || { label: 'Không xác định', class: 'unknown' };
        const date = new Date(order.created_at).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const itemsHTML = order.items.map(item => `
            <div class="order-item">
                <img class="order-item__img" src="${item.image || 'assets/images/no-image.jpg'}" alt="${item.product_name}">
                <div>
                    <div class="order-item__name">${item.product_name}</div>
                    <div class="order-item__meta">${item.brand_name} · Màu: ${item.color_name} · SL: ${item.quantity}</div>
                </div>
                <div class="order-item__price">${this.formatCurrency(item.price)}</div>
            </div>
        `).join('');

        return `
            <article class="order-card page-enter">
                <div class="order-card__head">
                    <div class="order-meta">
                        <div class="order-code">#${order.order_code}</div>
                        <div class="order-date">Đặt lúc ${date} · ${order.item_count} sản phẩm</div>
                    </div>
                    <div class="order-status order-status--${status.class}">
                        <span class="order-status__dot"></span> ${status.label}
                    </div>
                </div>
                <div class="order-card__body">
                    <div class="order-items">
                        ${itemsHTML}
                    </div>
                    <div class="order-summary">
                        <div class="order-total">
                            <span class="order-total__label">Tổng tiền:</span>
                            <span class="order-total__value">${this.formatCurrency(order.total_amount)}</span>
                        </div>
                        <div class="order-actions">
                            <a class="btn btn--outline btn--sm" href="order-detail.php?id=${order.id}">
                                <i class="bi bi-receipt"></i> Xem chi tiết
                            </a>
                            ${order.status <= 1 ? `
                                <button class="btn btn--ghost btn--sm btn-cancel-order" data-id="${order.id}">
                                    <i class="bi bi-x-circle"></i> Huỷ đơn
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    renderLoading() {
        this.container.innerHTML = `
            <div class="text-center py-12">
                <div class="loading-spinner"></div>
                <p class="mt-4 opacity-50">Đang tải danh sách đơn hàng...</p>
            </div>
        `;
    }

    renderError(message) {
        this.container.innerHTML = `
            <div class="text-center py-12 text-danger">
                <i class="bi bi-exclamation-circle" style="font-size: 2rem;"></i>
                <p class="mt-2">${message}</p>
                <button class="btn btn--outline btn--sm mt-4" onclick="location.reload()"> Thử lại </button>
            </div>
        `;
    }
}

export default new Orders();
