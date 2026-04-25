import Pagination from './ui/pagination.js';

class Products {
    constructor() {
        this.pagination = null;
        this.products = [];
        this.categories = [];
        this.brands = [];
        this.state = {
            page: 1,
            limit: 10,
            search: '',
            category_id: '',
            brand_id: '',
            status: '',
            sort: ''
        };

        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    async init() {
        console.log('Products module initialized');
        this.initPagination();
        await this.loadDependencies();
        this.bindEvents();
        this.fetchList();
    }

    initPagination() {
        const container = document.getElementById('productPagination');
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
        // Create product event
        const btnSave = document.getElementById('btnSaveProduct');
        const tableBody = document.getElementById('productTableBody');


        if (btnSave) {
            btnSave.addEventListener('click', () => this.create());
        }

        // Event delegation for Edit/Delete
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const tr = btn.closest('tr');
                const index = Array.from(tableBody.children).indexOf(tr);
                const product = this.products[index];

                if (!product) return;

                if (btn.classList.contains('edit-btn')) {
                    this.edit(product.id);
                } else if (btn.classList.contains('delete-btn')) {
                    this.delete(product.id);
                }
            });
        }

        // Filter events
        const filterSearch = document.getElementById('filterSearch');
        const filterCategory = document.getElementById('filterCategory');
        const filterBrand = document.getElementById('filterBrand');
        const btnFilter = document.getElementById('btnFilter');

        if (btnFilter) {
            btnFilter.addEventListener('click', () => {
                this.state.search = filterSearch.value;
                this.state.category_id = filterCategory.value;
                this.state.brand_id = filterBrand.value;
                this.state.page = 1;
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
    }

    async fetchList() {
        try {
            const { page, limit, search, category_id, brand_id, status, sort } = this.state;
            const params = new URLSearchParams({
                page,
                limit,
                search,
                category_id,
                brand_id,
                status,
                sort
            });

            const response = await fetch(`api/products/list.php?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                this.products = result.data;
                this.render(this.products);
                if (this.pagination && result.pagination) {
                    this.pagination.update(result.pagination);
                }
            } else {
                App.toast.error(result.message || 'Không thể tải danh sách sản phẩm');
            }
        } catch (error) {
            console.error('Error:', error);
            App.toast.error('Lỗi kết nối server khi tải danh sách');
        }
    }

    render(products) {
        const tbody = document.getElementById('productTableBody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Không tìm thấy sản phẩm nào</td></tr>';
            return;
        }

        tbody.innerHTML = products.map((prod) => {
            const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.min_price);
            const statusClass = prod.status == 1 ? 'status-badge--active' : 'status-badge--inactive';
            const statusText = prod.status == 1 ? 'Đang bán' : 'Ngừng bán';
            const stockWarning = prod.total_stock <= 5 ? 'style="color: var(--color-error); font-weight: bold;"' : '';

            // Render color hex dots
            const hexCodes = prod.color_hex_codes ? prod.color_hex_codes.split(',') : [];
            const colorsHtml = hexCodes.map(hex => `<span class="color-dot" style="background-color: ${hex}; display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 1px solid #ddd; margin-right: 4px;" title="${hex}"></span>`).join('');

            return `
                <tr>
                    <td>#${prod.id.toString().padStart(3, '0')}</td>
                    <td>
                        <div class="product-img-cell">
                            ${prod.main_image ? `<img src="../${prod.main_image}" alt="${prod.product_name}">` : ''}
                            <div>
                                <div class="product-name-txt">${prod.product_name}</div>
                                <div class="product-brand-txt">${prod.brand_name || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                            ${colorsHtml || '<span style="color: #ccc; font-size: 11px;">Chưa có màu</span>'}
                        </div>
                    </td>
                    <td>${prod.category_name || 'N/A'}</td>
                    <td>${priceFormatted}</td>
                    <td><span ${stockWarning}>${prod.total_stock}</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="table-actions" style="justify-content: flex-end;">
                            <button class="action-btn edit-btn" title="Chỉnh sửa">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Xóa">
                                <i class="bi bi-trash" style="color: var(--color-error)"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async create() {
        const form = document.getElementById('productForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        data.category_id = parseInt(data.category_id);
        data.brand_id = parseInt(data.brand_id);
        data.status = parseInt(data.status);

        try {
            const response = await fetch('api/products/create.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                App.toast.success(result.message);
                App.modal.close('createProductModal');
                form.reset();
                this.state.page = 1;
                this.fetchList();
            } else {
                App.toast.error(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error:', error);
            App.toast.error('Lỗi kết nối server');
        }
    }

    async delete(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        App.confirm.show({
            title: 'Xác nhận xóa',
            message: `Bạn có chắc chắn muốn xóa sản phẩm "${product.product_name}"?`,
            confirmText: 'Xóa ngay',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const response = await fetch('api/products/delete.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    const result = await response.json();
                    if (result.success) {
                        App.toast.success(result.message);
                        this.fetchList();
                    } else {
                        App.toast.error(result.message || 'Có lỗi xảy ra');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    App.toast.error('Lỗi kết nối server');
                }
            }
        });
    }

    edit(id) {
        window.location.href = `product-update.php?id=${id}`;
    }

    async loadDependencies() {
        try {
            const response = await fetch('api/products/get_form_data.php');
            const result = await response.json();

            if (result.success) {
                this.categories = result.categories;
                this.brands = result.brands;
                this.renderDropdowns();
            } else {
                console.error('Failed to load dependencies:', result.message);
            }
        } catch (error) {
            console.error('Error loading dependencies:', error);
        }
    }

    renderDropdowns() {
        // Modal dropdowns
        const categorySelect = document.getElementById('productCategory');
        const brandSelect = document.getElementById('productBrand');

        // Filter dropdowns
        const filterCategory = document.getElementById('filterCategory');
        const filterBrand = document.getElementById('filterBrand');

        const catOptions = this.categories.map(cat => `<option value="${cat.id}">${cat.category_name}</option>`).join('');
        const brandOptions = this.brands.map(brand => `<option value="${brand.id}">${brand.brand_name}</option>`).join('');

        if (categorySelect) categorySelect.innerHTML = '<option value="">Chọn danh mục</option>' + catOptions;
        if (brandSelect) brandSelect.innerHTML = '<option value="">Chọn thương hiệu</option>' + brandOptions;

        if (filterCategory) filterCategory.innerHTML = '<option value="">Tất cả danh mục</option>' + catOptions;
        if (filterBrand) filterBrand.innerHTML = '<option value="">Tất cả thương hiệu</option>' + brandOptions;
    }
}

export default new Products();
