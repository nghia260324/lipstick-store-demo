import Pagination from './ui/pagination.js';

class Orders {
    constructor() {
        this.pagination = null;
        this.orders = [];
        this.state = {
            page: 1,
            limit: 10,
            search: '',
            status: '',
            date_start: '',
            date_end: ''
        };

        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    async init() {
        console.log('Orders module initialized');
        this.initPagination();
        this.bindEvents();

        const urlParams = new URLSearchParams(window.location.search);
        const autoShow = urlParams.get('auto_show');
        const autoOrderCode = urlParams.get('order_code');

        if (autoShow === '1' && autoOrderCode) {
            this.state.search = autoOrderCode;
            const filterSearch = document.getElementById('filterSearch');
            if (filterSearch) filterSearch.value = autoOrderCode;
        }

        await this.fetchList();
        this.fetchStats();

        if (autoShow === '1' && autoOrderCode) {
            // Trigger click on the view button of the searched order
            setTimeout(() => {
                const viewBtn = document.querySelector(`.view-btn[data-code="${autoOrderCode}"]`);
                if (viewBtn) {
                    viewBtn.click();
                } else {
                    // Fallback to the first view button if search worked
                    const firstBtn = document.querySelector('.view-btn');
                    if (firstBtn) firstBtn.click();
                }
            }, 200);
        }
    }

    async fetchStats() {
        try {
            const response = await fetch('api/orders/get_stats.php');
            const result = await response.json();

            if (result.success) {
                const { pending, shipping, completed, cancelled } = result.data;
                const elPending = document.getElementById('statPending');
                const elShipping = document.getElementById('statShipping');
                const elCompleted = document.getElementById('statCompleted');
                const elCancelled = document.getElementById('statCancelled');

                if (elPending) elPending.textContent = pending.toLocaleString('vi-VN');
                if (elShipping) elShipping.textContent = shipping.toLocaleString('vi-VN');
                if (elCompleted) elCompleted.textContent = completed.toLocaleString('vi-VN');
                if (elCancelled) elCancelled.textContent = cancelled.toLocaleString('vi-VN');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    initPagination() {
        const container = document.getElementById('orderPagination');
        if (container) {
            this.pagination = new Pagination({
                container: container,
                onChange: (page) => {
                    this.state.page = page;
                    this.fetchList();
                }
            });
        }
    }

    bindEvents() {
        const tableBody = document.getElementById('orderTableBody');

        // Event delegation for actions
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const tr = btn.closest('tr');
                const index = Array.from(tableBody.children).indexOf(tr);
                const order = this.orders[index];

                if (!order) return;

                // if (btn.classList.contains('view-btn')) {
                //     this.viewDetail(order.id);
                if (btn.classList.contains('status-btn')) {
                    this.updateStatus(order.id);
                }
            });
        }

        // Filter events
        const filterSearch = document.getElementById('filterSearch');
        const filterStatus = document.getElementById('filterStatus');
        const filterDateStart = document.getElementById('filterDateStart');
        const filterDateEnd = document.getElementById('filterDateEnd');
        const btnFilter = document.getElementById('btnFilter');
        const btnReset = document.getElementById('btnResetFilter');

        if (btnFilter) {
            btnFilter.addEventListener('click', () => {
                this.state.search = filterSearch ? filterSearch.value : '';
                this.state.status = filterStatus ? filterStatus.value : '';
                this.state.date_start = filterDateStart ? filterDateStart.value : '';
                this.state.date_end = filterDateEnd ? filterDateEnd.value : '';
                this.state.page = 1;
                this.fetchList();
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (filterSearch) filterSearch.value = '';
                if (filterStatus) filterStatus.value = '';
                if (filterDateStart) filterDateStart.value = '';
                if (filterDateEnd) filterDateEnd.value = '';

                this.state = {
                    page: 1,
                    limit: 10,
                    search: '',
                    status: '',
                    date_start: '',
                    date_end: ''
                };
                this.fetchList();
            });
        }

        if (filterSearch) {
            filterSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.state.search = filterSearch.value;
                    this.state.page = 1;
                    this.fetchList();
                }
            });
        }

        // Action buttons delegation
        const tbody = document.getElementById('orderTableBody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const viewBtn = e.target.closest('.view-btn');
                if (viewBtn) {
                    const id = viewBtn.dataset.id;
                    this.showOrderDetail(id);
                }
            });
        }

        // Modal events
        const btnSaveStatus = document.getElementById('btnSaveOrderStatus');
        if (btnSaveStatus) {
            btnSaveStatus.addEventListener('click', () => this.saveOrderStatus());
        }

        const btnCloseModal = document.querySelector('#orderModal .modal-close');
        if (btnCloseModal) {
            btnCloseModal.onclick = () => this.closeOrderModal();
        }
    }

    async fetchList() {
        try {
            const { page, limit, search, status, date_start, date_end } = this.state;
            const params = new URLSearchParams({
                page,
                limit,
                search,
                status,
                date_start,
                date_end
            });

            const response = await fetch(`api/orders/list.php?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                this.orders = result.data;
                this.render(this.orders);
                if (this.pagination && result.pagination) {
                    this.pagination.update(result.pagination);
                }
            } else {
                if (typeof App !== 'undefined' && App.toast) {
                    console.log(result.message);
                    App.toast.error(result.message || 'Không thể tải danh sách đơn hàng');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (typeof App !== 'undefined' && App.toast) {
                App.toast.error('Lỗi kết nối server khi tải danh sách');
            }
        }
    }

    render(orders) {
        const tbody = document.getElementById('orderTableBody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Không tìm thấy đơn hàng nào</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map((order) => {
            const totalAmountFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);

            const statusInfo = this.getStatusInfo(order.status);
            const paymentMethodText = this.getPaymentMethodText(order.payment_method);
            const dateFormatted = new Date(order.created_at).toLocaleString('vi-VN');

            return `
                <tr>
                    <td><span class="order-code">#${order.order_code}</span></td>
                    <td>
                        <div class="customer-info">
                            <div class="customer-name">${order.to_name}</div>
                            <div class="customer-phone">${order.to_phone}</div>
                        </div>
                    </td>
                    <td>${dateFormatted}</td>
                    <td><strong>${totalAmountFormatted}</strong></td>
                    <td>${paymentMethodText}</td>
                    <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                    <td>
                        <div class="table-actions" style="justify-content: flex-end;">
                            <button class="action-btn view-btn" title="Xem chi tiết" data-id="${order.id}" data-code="${order.order_code}">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusInfo(status) {
        // 0: Pending, 1: Confirmed, 2: Shipping, 3: Completed, 4: Cancelled
        switch (parseInt(status)) {
            case 0: return { text: 'Chờ xác nhận', class: 'status-badge--pending' };
            case 1: return { text: 'Đã xác nhận', class: 'status-badge--confirmed' };
            case 2: return { text: 'Đang giao', class: 'status-badge--shipping' };
            case 3: return { text: 'Hoàn thành', class: 'status-badge--completed' };
            case 4: return { text: 'Đã hủy', class: 'status-badge--cancelled' };
            default: return { text: 'Không xác định', class: 'status-badge--unknown' };
        }
    }

    getPaymentMethodText(method) {
        // 0: COD, 1: VNPAY, 2: MOMO
        switch (parseInt(method)) {
            case 0: return 'COD';
            case 1: return 'VNPAY';
            case 2: return 'MOMO';
            default: return 'Khác';
        }
    }

    async showOrderDetail(id) {
        try {
            const response = await fetch(`api/orders/get_detail.php?id=${id}`);
            const result = await response.json();

            if (result.success) {
                this.renderOrderDetail(result.data);
                document.getElementById('orderModal').classList.add('active');
            } else {
                if (typeof App !== 'undefined' && App.toast) {
                    App.toast.error(result.message || 'Không thể tải chi tiết đơn hàng');
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    renderOrderDetail(order) {
        document.getElementById('orderDetailTitle').textContent = `Chi tiết đơn hàng #${order.order_code}`;
        document.getElementById('detailToName').textContent = order.to_name;
        document.getElementById('detailToPhone').textContent = order.to_phone;
        document.getElementById('detailToAddress').textContent = order.to_address;
        document.getElementById('detailNote').textContent = order.note || 'Không có ghi chú';
        document.getElementById('detailDate').textContent = new Date(order.created_at).toLocaleString('vi-VN');
        document.getElementById('detailPaymentMethod').textContent = this.getPaymentMethodText(order.payment_method);

        const statusInfo = this.getStatusInfo(order.status);
        document.getElementById('detailStatus').innerHTML = `<span class="status-badge ${statusInfo.class}" style="margin: 0">${statusInfo.text}</span>`;

        // Products
        const tbody = document.getElementById('detailOrderItems');
        if (tbody) {
            tbody.innerHTML = order.items.map(item => {
                const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price);
                const total = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity);
                const imageUrl = item.image_url || 'assets/images/placeholder.jpg';

                return `
                    <tr>
                        <td>
                            <div class="product-cell">
                                <img src="../${imageUrl}" alt="${item.product_name}">
                                <div>
                                    <div style="font-weight: var(--font-bold); color: var(--color-dark); font-size: 13px;">${item.product_name}</div>
                                    <div style="font-size: 12px; color: var(--color-text-secondary);">Màu: ${item.color_name}</div>
                                </div>
                            </div>
                        </td>
                        <td style="text-align: center">${item.quantity}</td>
                        <td style="text-align: right">${price}</td>
                        <td style="text-align: right; font-weight: var(--font-bold)">${total}</td>
                    </tr>
                `;
            }).join('');
        }

        document.getElementById('detailTotalAmount').textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);

        // Update status select based on allowed transitions
        const statusSelect = document.getElementById('updateStatusSelect');
        const btnSave = document.getElementById('btnSaveOrderStatus');

        if (statusSelect && order.allowed_next) {
            statusSelect.innerHTML = order.allowed_next.map(item =>
                `<option value="${item.value}" ${item.value == order.status ? 'selected' : ''}>${item.label}</option>`
            ).join('');
            statusSelect.dataset.orderId = order.id;

            // Nếu trạng thái là Completed (3) hoặc Cancelled (4) thì khóa select và ẩn nút lưu
            const isFinal = (parseInt(order.status) === 3 || parseInt(order.status) === 4);
            statusSelect.disabled = isFinal;
            if (btnSave) {
                btnSave.style.display = isFinal ? 'none' : 'block';
            }
        }
    }

    closeOrderModal() {
        document.getElementById('orderModal').classList.remove('active');
    }

    async saveOrderStatus() {
        const select = document.getElementById('updateStatusSelect');
        if (!select) return;

        const id = select.dataset.orderId;
        const status = select.value;

        try {
            const response = await fetch('api/orders/update_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const result = await response.json();

            if (result.success) {
                if (typeof App !== 'undefined' && App.toast) {
                    App.toast.success('Cập nhật trạng thái thành công');
                }
                this.closeOrderModal();
                this.fetchList();
                this.fetchStats();
                if (typeof App !== 'undefined' && App.updateSidebarBadge) {
                    App.updateSidebarBadge();
                }
            } else {
                if (typeof App !== 'undefined' && App.toast) {
                    App.toast.error(result.message || 'Cập nhật thất bại');
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

const ordersModule = new Orders();
window.closeOrderModal = () => ordersModule.closeOrderModal();
window.saveOrderStatus = () => ordersModule.saveOrderStatus();

export default ordersModule;
