import Pagination from './ui/pagination.js';

class Brands {
    constructor() {
        this.pagination = null;
        this.brands = [];
        this.state = {
            page: 1,
            limit: 10,
            search: '',
            sort: ''
        };

        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        console.log('Brands module initialized');
        this.initPagination();
        this.bindEvents();
        this.fetchList();
    }

    initPagination() {
        const container = document.getElementById('brandPagination');
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
        const btnCreate = document.getElementById('btnCreateBrand');
        const btnUpdate = document.getElementById('btnUpdateBrand');
        const tableBody = document.getElementById('brandTableBody');

        if (btnCreate) {
            btnCreate.addEventListener('click', () => this.create());
        }

        if (btnUpdate) {
            btnUpdate.addEventListener('click', () => this.update());
        }

        // Event delegation for Edit/Delete/Status
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const tr = e.target.closest('tr');
                if (!tr) return;
                
                const index = Array.from(tableBody.children).indexOf(tr);
                const brand = this.brands[index];
                if (!brand) return;

                const actionBtn = e.target.closest('.action-btn');
                const statusSwitch = e.target.closest('.status-switch');

                if (actionBtn) {
                    if (actionBtn.classList.contains('edit-btn')) {
                        this.edit(brand);
                    } else if (actionBtn.classList.contains('delete-btn')) {
                        if (!brand.can_delete) {
                            App.toast.warning('Không thể xóa thương hiệu này vì đang có sản phẩm sử dụng');
                            return;
                        }
                        this.delete(brand);
                    }
                } else if (statusSwitch) {
                    // Prevent default checkbox behavior to handle via API
                    e.preventDefault();
                    this.toggleStatus(brand);
                }
            });
        }

        // Filter events
        const filterSearch = document.getElementById('filterSearch');
        const filterSort = document.getElementById('filterSort');
        const btnFilter = document.getElementById('btnFilter');

        if (btnFilter) {
            btnFilter.addEventListener('click', () => {
                this.state.search = filterSearch.value;
                this.state.sort = filterSort.value;
                this.state.page = 1;
                this.fetchList();
            });
        }

        if (filterSearch) {
            filterSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.state.search = filterSearch.value;
                    this.state.sort = filterSort.value;
                    this.state.page = 1;
                    this.fetchList();
                }
            });
        }

        if (filterSort) {
            filterSort.addEventListener('change', () => {
                this.state.search = filterSearch.value;
                this.state.sort = filterSort.value;
                this.state.page = 1;
                this.fetchList();
            });
        }
    }

    async fetchList() {
        try {
            const { page, limit, search, sort } = this.state;
            const params = new URLSearchParams({
                page,
                limit,
                search,
                sort
            });
            const response = await fetch(`api/brands/list.php?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                this.brands = result.data;
                this.render(this.brands);
                if (this.pagination && result.pagination) {
                    this.pagination.update(result.pagination);
                }
            } else {
                App.toast.error(result.message || 'Không thể tải danh sách thương hiệu');
            }
        } catch (error) {
            console.error('Error:', error);
            App.toast.error('Lỗi kết nối server khi tải danh sách');
        }
    }

    render(brands) {
        const tbody = document.getElementById('brandTableBody');
        if (!tbody) return;

        if (brands.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Chưa có thương hiệu nào</td></tr>';
            return;
        }

        tbody.innerHTML = brands.map((brand, index) => `
            <tr>
                <td>${(this.state.page - 1) * this.state.limit + index + 1}</td>
                <td><strong style="color: var(--color-dark);">${brand.brand_name}</strong></td>
                <td style="color: var(--color-text-secondary);">${brand.description || '<em style="color: #ccc;">Không có mô tả</em>'}</td>
                <td style="text-align: center;">
                    <span class="status-badge" style="background-color: var(--color-bg-alt); color: var(--color-text);">
                        ${brand.product_count}
                    </span>
                </td>
                <td style="text-align: center;">
                    <label class="switch status-switch">
                        <input type="checkbox" ${brand.status == 1 ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </td>
                <td>
                    <div class="table-actions" style="justify-content: flex-end; display: flex; gap: 8px;">
                        <button class="action-btn edit-btn" title="Chỉnh sửa" data-modal-open="updateBrandModal"
                            style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer;">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete-btn" title="${brand.can_delete ? 'Xóa' : 'Không thể xóa vì đã có sản phẩm'}"
                            ${!brand.can_delete ? 'disabled' : ''}
                            style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: ${brand.can_delete ? 'pointer' : 'not-allowed'}; color: ${brand.can_delete ? '#F44336' : '#ccc'};">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async create() {
        const form = document.getElementById('createBrandForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('api/brands/create.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                App.toast.success(result.message);
                App.modal.close('createBrandModal');
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

    edit(brand) {
        console.log('Edit brand:', brand);
        const form = document.getElementById('updateBrandForm');
        if (form) {
            form.querySelector('[name="id"]').value = brand.id;
            form.querySelector('[name="brand_name"]').value = brand.brand_name;
            form.querySelector('[name="description"]').value = brand.description || '';

            App.modal.open('updateBrandModal');
        }
    }

    delete(brand) {
        App.confirm.show({
            title: 'Xác nhận xóa',
            message: `Bạn có chắc chắn muốn xóa thương hiệu "${brand.brand_name}"?`,
            confirmText: 'Xóa ngay',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const response = await fetch('api/brands/delete.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: brand.id })
                    });

                    const result = await response.json();

                    if (result.success) {
                        App.toast.success(result.message);
                        this.fetchList(); // Refresh list
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

    async update() {
        const form = document.getElementById('updateBrandForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('api/brands/update.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                App.toast.success(result.message);
                App.modal.close('updateBrandModal');
                this.fetchList(); // Refresh list
            } else {
                App.toast.error(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error:', error);
            App.toast.error('Lỗi kết nối server');
        }
    }

    async toggleStatus(brand) {
        const action = brand.status == 1 ? 'ẩn' : 'hiện';

        App.confirm.show({
            title: 'Xác nhận thay đổi',
            message: `Bạn có chắc chắn muốn ${action} thương hiệu "${brand.brand_name}"?`,
            confirmText: 'Xác nhận',
            type: brand.status == 1 ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    const response = await fetch('api/brands/toggle_status.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: brand.id })
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
}

export default new Brands();
