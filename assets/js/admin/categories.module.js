import Pagination from './ui/pagination.js';

class Categories {
    constructor() {
        this.pagination = null;
        this.categories = [];
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
        console.log('Categories module initialized');
        this.initPagination();
        this.bindEvents();
        this.fetchList();
    }

    initPagination() {
        const container = document.getElementById('categoryPagination');
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
        const btnCreate = document.getElementById('btnCreateCategory');
        const btnUpdate = document.getElementById('btnUpdateCategory');
        const tableBody = document.getElementById('categoryTableBody');

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
                const category = this.categories[index];
                if (!category) return;

                const actionBtn = e.target.closest('.action-btn');
                const statusSwitch = e.target.closest('.status-switch');

                if (actionBtn) {
                    if (actionBtn.classList.contains('edit-btn')) {
                        this.edit(category);
                    } else if (actionBtn.classList.contains('delete-btn')) {
                        if (!category.can_delete) {
                            App.toast.warning('Không thể xóa danh mục này vì đang có sản phẩm sử dụng');
                            return;
                        }
                        this.delete(category);
                    }
                } else if (statusSwitch) {
                    // Prevent default checkbox behavior to handle via API
                    e.preventDefault();
                    this.toggleStatus(category);
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
            const response = await fetch(`api/categories/list.php?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                this.categories = result.data;
                this.render(this.categories);
                if (this.pagination && result.pagination) {
                    this.pagination.update(result.pagination);
                }
            } else {
                App.toast.error(result.message || 'Không thể tải danh sách danh mục');
            }
        } catch (error) {
            console.error('Error:', error);
            App.toast.error('Lỗi kết nối server khi tải danh sách');
        }
    }

    render(categories) {
        const tbody = document.getElementById('categoryTableBody');
        if (!tbody) return;

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Chưa có danh mục nào</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map((cat, index) => `
            <tr>
                <td>${(this.state.page - 1) * this.state.limit + index + 1}</td>
                <td><strong style="color: var(--color-dark);">${cat.category_name}</strong></td>
                <td style="color: var(--color-text-secondary);">${cat.description || '<em style="color: #ccc;">Không có mô tả</em>'}</td>
                <td style="text-align: center;">
                    <span class="status-badge" style="background-color: var(--color-bg-alt); color: var(--color-text);">
                        ${cat.product_count}
                    </span>
                </td>
                <td style="text-align: center;">
                    <label class="switch status-switch">
                        <input type="checkbox" ${cat.status == 1 ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </td>
                <td>
                    <div class="table-actions" style="justify-content: flex-end; display: flex; gap: 8px;">
                        <button class="action-btn edit-btn" title="Chỉnh sửa" data-modal-open="updateCategoryModal"
                            style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer;">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete-btn" title="${cat.can_delete ? 'Xóa' : 'Không thể xóa vì đã có sản phẩm'}"
                            ${!cat.can_delete ? 'disabled' : ''}
                            style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: ${cat.can_delete ? 'pointer' : 'not-allowed'}; color: ${cat.can_delete ? '#F44336' : '#ccc'};">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async create() {
        const form = document.getElementById('createCategoryForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('api/categories/create.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                App.toast.success(result.message);
                App.modal.close('createCategoryModal');
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

    edit(category) {
        const form = document.getElementById('updateCategoryForm');
        if (form) {
            form.querySelector('[name="id"]').value = category.id;
            form.querySelector('[name="category_name"]').value = category.category_name;
            form.querySelector('[name="description"]').value = category.description || '';

            App.modal.open('updateCategoryModal');
        }
    }

    delete(category) {
        App.confirm.show({
            title: 'Xác nhận xóa',
            message: `Bạn có chắc chắn muốn xóa danh mục "${category.category_name}"?`,
            confirmText: 'Xóa ngay',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const response = await fetch('api/categories/delete.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: category.id })
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
        const form = document.getElementById('updateCategoryForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('api/categories/update.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                App.toast.success(result.message);
                App.modal.close('updateCategoryModal');
                this.fetchList(); // Refresh list
            } else {
                App.toast.error(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error:', error);
            App.toast.error('Lỗi kết nối server');
        }
    }

    async toggleStatus(category) {
        const action = category.status == 1 ? 'ẩn' : 'hiện';
        
        App.confirm.show({
            title: 'Xác nhận thay đổi',
            message: `Bạn có chắc chắn muốn ${action} danh mục "${category.category_name}"?`,
            confirmText: 'Xác nhận',
            type: category.status == 1 ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    const response = await fetch('api/categories/toggle_status.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: category.id })
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

export default new Categories();
