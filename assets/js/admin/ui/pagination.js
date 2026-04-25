/**
 * Pagination UI Module
 * Hỗ trợ render phân trang với các quy tắc hiển thị nâng cao
 */
class Pagination {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - Container chứa pagination
     * @param {Function} options.onChange - Callback khi chuyển trang
     */
    constructor(options) {
        if (!options.container) {
            throw new Error('Pagination: container is required');
        }

        this.container = options.container;
        this.onChange = options.onChange || (() => { });
        this.state = {
            page: 1,
            totalPages: 1,
            totalDocs: 0,
            from: 0,
            to: 0
        };

        this._init();
    }

    /**
     * Khởi tạo cấu trúc ban đầu nếu cần
     */
    _init() {
        // Đảm bảo container có cấu trúc đúng
        this.container.innerHTML = `
            <div class="pagination-info"></div>
            <div class="pagination-controls"></div>
        `;

        this.infoElement = this.container.querySelector('.pagination-info');
        this.controlsElement = this.container.querySelector('.pagination-controls');

        // Event delegation cho các nút bấm
        this.controlsElement.addEventListener('click', (e) => {
            const btn = e.target.closest('.pagination-btn');
            if (!btn || btn.disabled) return;

            const newPage = parseInt(btn.dataset.page);
            if (!isNaN(newPage) && newPage !== this.state.page) {
                this.onChange(newPage);
            }
        });
    }

    /**
     * Cập nhật trạng thái và re-render
     * @param {Object} data - { page, totalPages, totalDocs, from, to }
     */
    update(data) {
        this.state = { ...this.state, ...data };
        this._render();
    }

    /**
     * Render UI theo quy tắc
     */
    _render() {
        const { page, totalPages, totalDocs, from, to } = this.state;

        // 1. Render Info
        if (this.infoElement) {
            if (totalDocs > 0) {
                this.infoElement.innerHTML = `Hiển thị <strong>${from}-${to}</strong> của <strong>${totalDocs}</strong>`;
            } else {
                this.infoElement.innerHTML = 'Không có dữ liệu';
            }
        }

        // 2. Render Controls
        if (this.controlsElement) {
            const model = this._generateModel(page, totalPages);
            let html = '';

            // Nút Prev
            html += `<button class="pagination-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>
                        <i class="bi bi-chevron-left"></i>
                    </button>`;

            // Danh sách các trang
            model.forEach(item => {
                if (item.type === 'page') {
                    html += `<button class="pagination-btn ${item.active ? 'active' : ''}" data-page="${item.value}">
                                ${item.value}
                            </button>`;
                } else if (item.type === 'ellipsis') {
                    html += `<span class="pagination-ellipsis">...</span>`;
                }
            });

            // Nút Next
            html += `<button class="pagination-btn" data-page="${page + 1}" ${page === totalPages || totalPages === 0 ? 'disabled' : ''}>
                        <i class="bi bi-chevron-right"></i>
                    </button>`;

            this.controlsElement.innerHTML = html;
        }
    }

    /**
     * Sinh danh sách model để render theo quy tắc
     * Model rule:
     * - totalPages <= 7: Hiện hết
     * - totalPages > 7:
     *   - Luôn hiện 1 và totalPages
     *   - Hiện [page-2, page-1, page, page+1, page+2]
     *   - Ellipsis (...) khi cách nhau > 1 trang
     */
    _generateModel(currentPage, totalPages) {
        if (totalPages <= 0) return [];

        const model = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                model.push({ type: 'page', value: i, active: i === currentPage });
            }
            return model;
        }

        // Quy tắc khi > 7 trang
        const pages = new Set();

        // Luôn hiển thị trang đầu và cuối
        pages.add(1);
        pages.add(totalPages);

        // Hiển thị 2 trang trước và sau current
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
            if (i >= 1 && i <= totalPages) {
                pages.add(i);
            }
        }

        const sortedPages = Array.from(pages).sort((a, b) => a - b);

        for (let i = 0; i < sortedPages.length; i++) {
            const current = sortedPages[i];
            const next = sortedPages[i + 1];

            model.push({ type: 'page', value: current, active: current === currentPage });

            if (next) {
                if (next - current === 2) {
                    // Nếu chỉ cách 1 số (ví dụ 1 và 3) thì thêm số đó luôn thay vì ...
                    model.push({ type: 'page', value: current + 1, active: (current + 1) === currentPage });
                } else if (next - current > 2) {
                    model.push({ type: 'ellipsis' });
                }
            }
        }

        return model;
    }
}

export default Pagination;
