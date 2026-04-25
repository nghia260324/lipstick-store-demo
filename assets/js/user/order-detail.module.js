class OrderDetail {
    constructor() {
        this.container = document.getElementById('orderDetailContent');
        this.orderId = new URLSearchParams(window.location.search).get('id');

        if (this.container && this.orderId) {
            this.init();
        } else if (!this.orderId) {
            this.renderError('ID đơn hàng không hợp lệ');
        }
    }

    async init() {
        this.renderLoading();
        try {
            const response = await fetch(`./api/order_detail_get.php?id=${this.orderId}`);
            const result = await response.json();

            if (result.success) {
                this.renderContent(result.data);
                this.initEvents();
            } else {
                this.renderError(result.message);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            this.renderError('Không thể kết nối đến máy chủ');
        }
    }

    initEvents() {
        this.container.addEventListener('click', async (e) => {
            const cancelBtn = e.target.closest('.btn-cancel-order');
            if (cancelBtn) {
                const id = cancelBtn.dataset.id;
                if (confirm('Bạn có chắc chắn muốn huỷ đơn hàng này không?')) {
                    await this.cancelOrder(id);
                }
            }
        });
    }

    async cancelOrder(id) {
        try {
            const formData = new FormData();
            formData.append('order_id', id);

            const response = await fetch('./api/order_cancel.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                alert('Đã huỷ đơn hàng thành công');
                location.reload();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Cancel error:', error);
            alert('Có lỗi xảy ra khi huỷ đơn hàng');
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    getPaymentMethodLabel(method) {
        const methods = {
            0: 'COD (Thanh toán khi nhận hàng)',
            1: 'VNPAY',
            2: 'MOMO'
        };
        return methods[method] || 'Không xác định';
    }

    renderContent(data) {
        const { order, items, timeline } = data;

        const statusMap = {
            0: { label: 'Chờ xác nhận', class: 'pending' },
            1: { label: 'Đã xác nhận', class: 'pending' },
            2: { label: 'Đang giao', class: 'ship' },
            3: { label: 'Đã giao', class: 'done' },
            4: { label: 'Đã hủy', class: 'cancel' }
        };
        const status = statusMap[order.status] || { label: 'Không xác định', class: 'unknown' };

        this.container.innerHTML = `
            <div class="order-detail__header">
                <div class="container order-detail__header-inner">
                    <h1 class="order-detail__title">Chi tiết đơn hàng #${order.order_code}</h1>
                    <p class="order-detail__subtitle">Trạng thái hiện tại: <strong>${status.label}</strong></p>
                </div>
            </div>

            <div class="order-detail-page">
                <div class="container">
                    <nav class="breadcrumb">
                        <div class="breadcrumb__item"><a href="index.php">Trang chủ</a><span class="breadcrumb__sep">›</span></div>
                        <div class="breadcrumb__item"><a href="orders.php">Đơn hàng</a><span class="breadcrumb__sep">›</span></div>
                        <div class="breadcrumb__item">#${order.order_code}</div>
                    </nav>

                    <div class="order-detail-layout">
                        <!-- LEFT -->
                        <div>
                            <div class="od-card page-enter">
                                <div class="od-card__head">
                                    <div class="od-card__title"><i class="bi bi-activity"></i> Trạng thái đơn hàng</div>
                                    <div class="od-status od-status--${status.class}"><span class="od-status__dot"></span> ${status.label}</div>
                                </div>
                                <div class="od-card__body">
                                    <div class="od-timeline">
                                        ${timeline.map(step => `
                                            <div class="od-step ${step.status}">
                                                <div class="od-step__dot">
                                                    ${step.status === 'done' ? '<i class="bi bi-check2"></i>' :
                (step.status === 'active' ? '<i class="bi bi-hourglass-split"></i>' : '')}
                                                </div>
                                                <div class="od-step__content">
                                                    <div class="od-step__title">${step.title}</div>
                                                    <div class="od-step__desc">${step.desc}</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <div class="od-card">
                                <div class="od-card__head">
                                    <div class="od-card__title"><i class="bi bi-bag-check"></i> Sản phẩm</div>
                                </div>
                                <div class="od-card__body">
                                    <div class="od-items">
                                        ${items.map(item => `
                                            <div class="od-item">
                                                <img class="od-item__img" src="${item.image || 'assets/images/no-image.jpg'}" alt="${item.product_name}">
                                                <div>
                                                    <div class="od-item__name">${item.product_name}</div>
                                                    <div class="od-item__meta">${item.brand_name} · Màu: ${item.color_name} · SL: ${item.quantity}</div>
                                                </div>
                                                <div class="od-item__price">${this.formatCurrency(item.price)}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT -->
                        <div>
                            <div class="od-card" style="position:sticky;top:calc(var(--header-h) + 1rem)">
                                <div class="od-card__head">
                                    <div class="od-card__title"><i class="bi bi-receipt"></i> Tóm tắt đơn hàng</div>
                                    <a class="btn btn--outline btn--sm" href="orders.php">← Danh sách</a>
                                </div>
                                <div class="od-card__body">
                                    <div class="od-summary-row">
                                        <span class="od-summary-label">Tạm tính</span>
                                        <span class="od-summary-value">${this.formatCurrency(order.total_amount)}</span>
                                    </div>
                                  
                                    <div class="od-divider"></div>
                                    <div class="od-total">
                                        <span class="od-total__label">Tổng cộng</span>
                                        <span class="od-total__value">${this.formatCurrency(order.total_amount)}</span>
                                    </div>

                                    <div class="od-actions">
                                        ${order.status <= 1 ? `
                                            <button class="btn btn--primary btn--lg btn-cancel-order" data-id="${order.id}">
                                                <i class="bi bi-x-circle"></i> Huỷ đơn hàng
                                            </button>
                                        ` : `
                                            <button class="btn btn--ghost btn--lg" disabled>
                                                <i class="bi bi-info-circle"></i> Không thể huỷ
                                            </button>
                                        `}
                                        <p class="od-actions__note mt-3 text-center opacity-70" style="font-size: 0.8rem;">
                                            * Bạn chỉ có thể huỷ đơn hàng khi đang ở trạng thái <strong>Chờ xác nhận</strong> hoặc <strong>Đã xác nhận</strong>.
                                        </p>
                                    </div>

                                    <div class="od-divider"></div>

                                    <div class="od-info">
                                        <div class="od-info__row">
                                            <div class="od-info__label">Người nhận</div>
                                            <div class="od-info__value"><strong>${order.to_name}</strong></div>
                                        </div>
                                        <div class="od-info__row">
                                            <div class="od-info__label">SĐT</div>
                                            <div class="od-info__value">${order.to_phone}</div>
                                        </div>
                                        <div class="od-info__row">
                                            <div class="od-info__label">Địa chỉ</div>
                                            <div class="od-info__value">${order.to_address}</div>
                                        </div>
                                        <div class="od-info__row">
                                            <div class="od-info__label">Thanh toán</div>
                                            <div class="od-info__value">${this.getPaymentMethodLabel(order.payment_method)}</div>
                                        </div>
                                        ${order.note ? `
                                            <div class="od-info__row">
                                                <div class="od-info__label">Ghi chú</div>
                                                <div class="od-info__value">${order.note}</div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderLoading() {
        this.container.innerHTML = `
            <div class="text-center py-20">
                <div class="loading-spinner"></div>
                <p class="mt-4 opacity-50">Đang tải thông tin đơn hàng...</p>
            </div>
        `;
    }

    renderError(message) {
        this.container.innerHTML = `
            <div class="container py-20 text-center">
                <div class="text-danger mb-4" style="font-size: 3rem;"><i class="bi bi-exclamation-octagon"></i></div>
                <h2 class="mb-2">Oops! Có lỗi xảy ra</h2>
                <p class="text-secondary mb-6">${message}</p>
                <a href="orders.php" class="btn btn--primary">Quay lại danh sách</a>
            </div>
        `;
    }
}

export default new OrderDetail();
