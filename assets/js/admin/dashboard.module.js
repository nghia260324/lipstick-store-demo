class Dashboard {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        this.fetchStats();
        this.fetchRecentOrders();
        this.fetchTopSellingProducts();
        this.bindEvents();
    }

    bindEvents() {
        const tbody = document.getElementById('recentOrdersTableBody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('.view-btn');
                if (btn) {
                    const code = btn.dataset.code;
                    window.location.href = `orders.php?order_code=${code}&auto_show=1`;
                }
            });
        }
    }

    async fetchStats() {
        try {
            const response = await fetch('api/dashboard/get_stats.php');
            const result = await response.json();

            if (result.success) {
                this.renderStats(result.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    }

    renderStats(data) {
        // 1. Revenue
        const rev = data.revenue;
        const revValue = document.getElementById('statRevenue');
        if (revValue) {
            revValue.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rev.current_month_revenue || 0);
        }
        this.renderTrend('statRevenueTrend', rev.current_month_revenue, rev.last_month_revenue);

        // 2. Orders
        const ord = data.orders;
        const ordValue = document.getElementById('statNewOrders');
        if (ordValue) {
            ordValue.textContent = (ord.current_month_orders || 0).toLocaleString('vi-VN');
        }
        this.renderTrend('statOrdersTrend', ord.current_month_orders, ord.last_month_orders);

        // 3. Products
        const prod = data.products;
        const prodValue = document.getElementById('statTotalProducts');
        if (prodValue) {
            prodValue.textContent = (prod.total_products || 0).toLocaleString('vi-VN');
        }
        const lowStock = document.getElementById('statLowStock');
        if (lowStock) {
            lowStock.innerHTML = `<i class="bi bi-dash"></i> ${(prod.low_stock_count || 0).toLocaleString('vi-VN')} sản phẩm sắp hết hàng`;
        }

        // 4. Customers
        const cust = data.customers;
        const custValue = document.getElementById('statTotalCustomers');
        if (custValue) {
            custValue.textContent = (cust.total_customers || 0).toLocaleString('vi-VN');
        }
        const newCust = document.getElementById('statNewCustomers');
        if (newCust) {
            newCust.innerHTML = `<i class="bi bi-arrow-up-short"></i> ${(cust.new_customers_this_month || 0).toLocaleString('vi-VN')} khách hàng mới`;
        }
    }

    renderTrend(elementId, current, last) {
        const el = document.getElementById(elementId);
        if (!el) return;

        current = parseFloat(current) || 0;
        last = parseFloat(last) || 0;

        if (last === 0) {
            el.innerHTML = `<i class="bi bi-arrow-up-short"></i> Mới (Tháng đầu)`;
            el.className = 'admin-stat-card__trend positive';
            return;
        }

        const percent = ((current - last) / last) * 100;
        const isPositive = percent >= 0;
        
        el.innerHTML = `
            <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}-short"></i> 
            ${isPositive ? '+' : ''}${percent.toFixed(1)}% so với tháng trước
        `;
        el.className = `admin-stat-card__trend ${isPositive ? 'positive' : 'negative'}`;
    }

    async fetchRecentOrders() {
        const tbody = document.getElementById('recentOrdersTableBody');
        if (!tbody) return;

        try {
            const response = await fetch('api/dashboard/get_recent_orders.php');
            const result = await response.json();

            if (result.success) {
                this.renderRecentOrders(result.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--color-error);">${result.message || 'Lỗi khi tải dữ liệu'}</td></tr>`;
            }
        } catch (error) {
            console.error('Error fetching recent orders:', error);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--color-error);">Lỗi kết nối server</td></tr>`;
        }
    }

    async fetchTopSellingProducts() {
        const container = document.getElementById('topSellingProductsList');
        if (!container) return;

        try {
            const response = await fetch('api/dashboard/get_top_selling.php');
            const result = await response.json();

            if (result.success) {
                this.renderTopSellingProducts(result.data);
            } else {
                container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--color-error);">${result.message || 'Lỗi khi tải dữ liệu'}</div>`;
            }
        } catch (error) {
            console.error('Error fetching top selling products:', error);
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--color-error);">Lỗi kết nối server</div>`;
        }
    }

    renderTopSellingProducts(products) {
        const container = document.getElementById('topSellingProductsList');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px;">Chưa có dữ liệu bán hàng</div>';
            return;
        }

        container.innerHTML = products.map(product => {
            const imageUrl = product.image_url ? `../${product.image_url}` : '../assets/images/placeholder.jpg';
            return `
                <div class="top-product-item">
                    <img src="${imageUrl}" alt="${product.product_name}" class="top-product-img">
                    <div class="top-product-info">
                        <div class="top-product-name">${product.product_name}</div>
                        <div class="top-product-brand">${product.brand_name}</div>
                    </div>
                    <div class="top-product-sales">
                        <div class="sales-count">${product.total_sold}</div>
                        <div class="sales-label">Đã bán</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRecentOrders(orders) {
        const tbody = document.getElementById('recentOrdersTableBody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Chưa có đơn hàng nào</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const totalFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);
            const dateFormatted = new Date(order.created_at).toLocaleDateString('vi-VN');
            const statusInfo = this.getStatusInfo(order.status);
            
            const avatarHtml = order.customer_avatar 
                ? `<img src="../${order.customer_avatar}" alt="${order.customer_name}">`
                : `<div class="user-avatar-placeholder">${order.customer_name ? order.customer_name.charAt(0).toUpperCase() : '?'}</div>`;

            return `
                <tr>
                    <td><span class="order-id">#${order.order_code}</span></td>
                    <td>
                        <div class="user-cell">
                            ${avatarHtml}
                            <span>${order.customer_name || 'Khách vãng lai'}</span>
                        </div>
                    </td>
                    <td>${dateFormatted}</td>
                    <td>${totalFormatted}</td>
                    <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                    <td>
                        <div class="table-actions">
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
        // Match with orders.module.js status codes
        switch (parseInt(status)) {
            case 0: return { text: 'Chờ xác nhận', class: 'status-badge--pending' };
            case 1: return { text: 'Đã xác nhận', class: 'status-badge--confirmed' };
            case 2: return { text: 'Đang giao', class: 'status-badge--shipping' };
            case 3: return { text: 'Hoàn thành', class: 'status-badge--completed' };
            case 4: return { text: 'Đã hủy', class: 'status-badge--cancelled' };
            default: return { text: 'Không xác định', class: 'status-badge--unknown' };
        }
    }
}

export default new Dashboard;
