import Pagination from './ui/pagination.js';

class Users {
    constructor() {
        this.pagination = null;
        this.users = [];
        this.state = {
            page: 1,
            limit: 10,
            search: '',
            role: '',
            status: ''
        };

        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        console.log('Users module initialized');
        this.initPagination();
        this.bindEvents();
        this.fetchList();
    }

    initPagination() {
        const container = document.getElementById('userPagination');
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
        const tableBody = document.getElementById('userTableBody');
        const btnFilter = document.getElementById('btnFilter');
        const filterSearch = document.getElementById('filterSearch');
        const filterRole = document.getElementById('filterRole');
        const filterStatus = document.getElementById('filterStatus');

        if (btnFilter) {
            btnFilter.addEventListener('click', () => {
                this.state.search = filterSearch.value;
                this.state.role = filterRole.value;
                this.state.status = filterStatus.value;
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

        // Event delegation for toggle status
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const btn = e.target.closest('.status-btn');
                if (!btn) return;

                const id = btn.dataset.id;
                const currentStatus = btn.dataset.status;
                this.toggleStatus(id, currentStatus);
            });
        }
    }

    async fetchList() {
        try {
            const { page, limit, search, role, status } = this.state;
            const params = new URLSearchParams({
                page,
                limit,
                search,
                role,
                status
            });
            const response = await fetch(`api/users/list.php?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                this.users = result.data;
                this.render(this.users);
                if (this.pagination && result.pagination) {
                    this.pagination.update(result.pagination);
                }
            } else {
                if (typeof App !== 'undefined' && App.toast) {
                    App.toast.error(result.message || 'Không thể tải danh sách người dùng');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (typeof App !== 'undefined' && App.toast) {
                App.toast.error('Lỗi kết nối server khi tải danh sách');
            }
        }
    }

    render(users) {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Không tìm thấy người dùng nào</td></tr>';
            return;
        }

        tbody.innerHTML = users.map((user, index) => {
            const dateFormatted = new Date(user.created_at).toLocaleDateString('vi-VN');
            const roleBadge = user.role === 'admin' 
                ? '<span class="status-badge" style="background: rgba(200, 54, 90, 0.1); color: var(--color-primary);">Quản trị</span>'
                : '<span class="status-badge" style="background: rgba(33, 150, 243, 0.1); color: #2196F3;">Khách hàng</span>';
            
            const statusBadge = user.status == 1
                ? '<span class="status-badge status-badge--success">Hoạt động</span>'
                : '<span class="status-badge status-badge--error">Đã khóa</span>';

            const avatarHtml = user.avatar_url 
                ? `<img src="../${user.avatar_url}" alt="${user.full_name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 10px;">`
                : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; color: #999; font-size: 12px;">${user.full_name.charAt(0).toUpperCase()}</div>`;

            return `
                <tr>
                    <td>${(this.state.page - 1) * this.state.limit + index + 1}</td>
                    <td>
                        <div style="display: flex; align-items: center;">
                            ${avatarHtml}
                            <div>
                                <div style="font-weight: 600; color: var(--color-dark);">${user.full_name}</div>
                                <div style="font-size: 11px; color: var(--color-text-secondary);">Tham gia: ${dateFormatted}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${user.phone || '<em style="color: #ccc;">Chưa cập nhật</em>'}</td>
                    <td>${roleBadge}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="table-actions" style="justify-content: flex-end; display: flex; gap: 8px;">
                            <button class="action-btn status-btn" title="${user.status == 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}" 
                                data-id="${user.id}" data-status="${user.status}"
                                style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; color: ${user.status == 1 ? '#F44336' : '#4CAF50'};">
                                <i class="bi bi-${user.status == 1 ? 'lock' : 'unlock'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async toggleStatus(id, currentStatus) {
        const action = currentStatus == 1 ? 'khóa' : 'mở khóa';
        
        if (typeof App !== 'undefined' && App.confirm) {
            App.confirm.show({
                title: 'Xác nhận thay đổi',
                message: `Bạn có chắc chắn muốn ${action} tài khoản này?`,
                confirmText: 'Xác nhận',
                type: currentStatus == 1 ? 'danger' : 'success',
                onConfirm: async () => {
                    try {
                        const response = await fetch('api/users/toggle_status.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ id })
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
    }
}

export default new Users();
