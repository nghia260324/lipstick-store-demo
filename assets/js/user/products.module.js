import Pagination from '../admin/ui/pagination.js';
import Cart from '../utils/cart.js';

class Products {
    constructor() {
        this.pagination = null;
        this.state = {
            brands: [],
            categories: [],
            sort: 'default',
            priceMin: 0,
            priceMax: 10000000,
            view: 'grid',
            search: '',
            page: 1,
            limit: 16
        };

        this.filterData = {
            categories: [],
            brands: []
        };

        this.gridContainer = document.getElementById('productGrid');
        this.catFilters = document.getElementById('catFilters');
        this.brandFilters = document.getElementById('brandFilters');
        this.resultsCount = document.getElementById('resultsCount');
        this.sortSelect = document.getElementById('sortSelect');

        this.init();
    }

    async init() {
        this.initPagination();
        this.readUrlParams();
        // Chờ lấy dữ liệu filter trước để render checkbox và tag đúng
        await this.fetchFilterData();
        await this.fetchProducts();
        this.setupEventListeners();
    }

    initPagination() {
        const container = document.getElementById('pagination');
        if (container) {
            this.pagination = new Pagination({
                container: container,
                onChange: (page) => {
                    this.goPage(page);
                }
            });
        }
    }

    readUrlParams() {
        const params = new URLSearchParams(location.search);
        if (params.get('brand')) this.state.brands = params.get('brand').split(',');
        if (params.get('cat')) this.state.categories = params.get('cat').split(',');
        if (params.get('page')) this.state.page = parseInt(params.get('page')) || 1;
        if (params.get('search')) this.state.search = params.get('search');
    }

    async fetchFilterData() {
        try {
            const res = await fetch('api/products_filter_data.php');
            const result = await res.json();
            if (result.success) {
                this.filterData = result.data;
                this.renderFilterLists();
            }
        } catch (e) {
            console.error('Lỗi fetch filter data:', e);
        }
    }

    async fetchProducts() {
        try {
            // Show loading state if needed
            if (this.gridContainer) {
                this.gridContainer.style.opacity = '0.5';
            }

            const query = new URLSearchParams({
                brands: this.state.brands.join(','),
                categories: this.state.categories.join(','),
                sort: this.state.sort,
                price_min: this.state.priceMin,
                price_max: this.state.priceMax,
                search: this.state.search,
                page: this.state.page,
                limit: this.state.limit
            });

            const res = await fetch(`api/products_list.php?${query.toString()}`);
            const result = await res.json();

            if (result.success) {
                this.renderProducts(result.data);
                if (this.pagination && result.pagination) {
                    this.pagination.update(result.pagination);
                }

                // Cập nhật kết quả số lượng sản phẩm ở toolbar
                if (this.resultsCount && result.pagination) {
                    this.resultsCount.innerHTML = `<strong>${result.pagination.totalDocs}</strong> sản phẩm`;
                }
            }

            if (this.gridContainer) {
                this.gridContainer.style.opacity = '1';
            }
        } catch (e) {
            console.error('Lỗi fetch products:', e);
            if (this.gridContainer) {
                this.gridContainer.style.opacity = '1';
            }
        }
    }

    renderFilterLists() {
        const renderList = (data, stateKey, containerId) => {
            const container = document.getElementById(containerId);
            const containerMobile = document.getElementById(containerId + 'Mobile');
            if (!container) return;

            const html = data.map(item => `
                <label class="filter-check">
                    <input type="checkbox" value="${item.id}" 
                           ${this.state[stateKey].includes(String(item.id)) ? 'checked' : ''} 
                           data-key="${stateKey}">
                    <span class="filter-check__box"></span>
                    <span class="filter-check__label">${item.label}</span>
                    <span class="filter-check__count">${item.count}</span>
                </label>
            `).join('');

            container.innerHTML = html;
            if (containerMobile) containerMobile.innerHTML = html;
        };

        renderList(this.filterData.categories, 'categories', 'catFilters');
        renderList(this.filterData.brands, 'brands', 'brandFilters');
    }

    renderProducts(products) {
        if (!this.gridContainer) return;

        if (products.length === 0) {
            this.gridContainer.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1">
                    <span class="no-results__icon">💄</span>
                    <div class="no-results__title">Không tìm thấy sản phẩm</div>
                    <p class="no-results__desc">Thử thay đổi bộ lọc hoặc tìm kiếm khác.</p>
                </div>
            `;
            return;
        }

        this.gridContainer.innerHTML = products.map(p => this.createProductHTML(p)).join('');
        this.renderActiveTags();
    }

    createProductHTML(p) {
        if (!p.colors || p.colors.length === 0) return '';

        const defaultColor = p.colors[0];
        const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(defaultColor.price);
        const image = defaultColor.image || 'assets/images/placeholder-product.png';

        const swatchesHTML = p.colors.slice(0, 5).map((c, index) => `
            <span class="swatch ${index === 0 ? 'active' : ''}" 
                  style="background: ${c.hex_code}" 
                  title="${c.color_name}"
                  data-id="${c.id}"
                  data-price="${c.price}"
                  data-image="${c.image || 'assets/images/placeholder-product.png'}">
            </span>
        `).join('');

        return `
            <div class="product-card" data-id="${p.id}">
                <div class="product-card__img-wrap">
                    <img class="product-card__img" src="${image}" alt="${p.product_name}" loading="lazy">
                    <div class="product-card__actions">
                        <a href="product-detail.php?id=${p.id}" class="product-card__action-btn" title="Xem nhanh">
                            <i class="bi bi-eye"></i>
                        </a>
                    </div>
                    <div class="product-card__cart-btn" data-id="${p.id}">
                        <i class="bi bi-bag-plus"></i> Thêm vào giỏ
                    </div>
                </div>
                <div class="product-card__body">
                    <div class="product-card__brand">${p.brand_name}</div>
                    <div class="product-card__name">${p.product_name}</div>
                    <div class="product-card__swatches">
                        ${swatchesHTML}
                    </div>
                    <div class="product-card__price">
                        <span class="price">${priceFormatted}</span>
                    </div>
                </div>
            </div>
        `;
    }

    goPage(page) {
        if (page === this.state.page) return;
        this.state.page = page;
        this.fetchProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Cập nhật URL (optional but good)
        const params = new URLSearchParams(location.search);
        params.set('page', page);
        window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
    }

    renderActiveTags() {
        const bar = document.getElementById('activeFilters');
        const tags = document.getElementById('filterTags');
        if (!bar || !tags) return;

        const items = [];

        this.state.categories.forEach(id => {
            const cat = this.filterData.categories.find(c => c.id == id);
            if (cat) items.push(`<span class="active-filter-tag">${cat.label}<span class="active-filter-tag__remove" data-key="categories" data-val="${id}">✕</span></span>`);
        });

        this.state.brands.forEach(id => {
            const brand = this.filterData.brands.find(b => b.id == id);
            if (brand) items.push(`<span class="active-filter-tag">${brand.label}<span class="active-filter-tag__remove" data-key="brands" data-val="${id}">✕</span></span>`);
        });

        tags.innerHTML = items.join('');
        bar.style.display = items.length ? 'flex' : 'none';
    }

    setupEventListeners() {
        // Lọc Checkbox
        const handleCheckChange = (e) => {
            const input = e.target.closest('input[type="checkbox"]');
            if (!input) return;

            const key = input.dataset.key;
            const val = input.value;

            if (input.checked) {
                if (!this.state[key].includes(val)) this.state[key].push(val);
            } else {
                this.state[key] = this.state[key].filter(v => v !== val);
            }

            this.state.page = 1; // Reset về trang 1 khi lọc
            this.fetchProducts();
            this.renderActiveTags();
        };

        if (this.catFilters) this.catFilters.addEventListener('change', handleCheckChange);
        if (this.brandFilters) this.brandFilters.addEventListener('change', handleCheckChange);

        const catMobile = document.getElementById('catFiltersMobile');
        const brandMobile = document.getElementById('brandFiltersMobile');
        if (catMobile) catMobile.addEventListener('change', handleCheckChange);
        if (brandMobile) brandMobile.addEventListener('change', handleCheckChange);

        // Xóa Tag
        document.getElementById('activeFilters')?.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.active-filter-tag__remove');
            if (removeBtn) {
                const key = removeBtn.dataset.key;
                const val = removeBtn.dataset.val;
                this.state[key] = this.state[key].filter(v => v !== val);
                this.renderFilterLists();
                this.state.page = 1;
                this.fetchProducts();
            }

            if (e.target.id === 'clearAll') {
                this.state.brands = [];
                this.state.categories = [];
                this.renderFilterLists();
                this.state.page = 1;
                this.fetchProducts();
            }
        });

        // Sắp xếp
        this.sortSelect?.addEventListener('change', (e) => {
            this.state.sort = e.target.value;
            this.state.page = 1;
            this.fetchProducts();
        });

        // Tương tác trên card
        this.gridContainer?.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;

            const swatch = e.target.closest('.swatch');
            if (swatch) {
                card.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                card.querySelector('.product-card__img').src = swatch.dataset.image;
                card.querySelector('.price').textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(swatch.dataset.price);
                return;
            }

            const cartBtn = e.target.closest('.product-card__cart-btn');
            if (cartBtn) {
                const activeSwatch = card.querySelector('.swatch.active');
                const colorId = activeSwatch ? activeSwatch.dataset.id : null;
                if (colorId) {
                    Cart.add(colorId, 1);
                }
                return;
            }

            if (!e.target.closest('.product-card__action-btn')) {
                window.location.href = `product-detail.php?id=${card.dataset.id}`;
            }
        });

        // Toggle blocks
        document.querySelectorAll('.filter-block__head').forEach(head => {
            head.addEventListener('click', () => {
                head.closest('.filter-block').classList.toggle('open');
            });
        });

        // Mobile toggle
        const filterToggleBtn = document.getElementById('filterToggleBtn');
        const filterDrawer = document.getElementById('filterDrawer');
        const drawerClose = document.getElementById('drawerClose');
        const drawerOverlay = document.getElementById('drawerOverlay');

        if (filterToggleBtn) {
            filterToggleBtn.addEventListener('click', () => filterDrawer?.classList.add('open'));
        }
        if (drawerClose) {
            drawerClose.addEventListener('click', () => filterDrawer?.classList.remove('open'));
        }
        if (drawerOverlay) {
            drawerOverlay.addEventListener('click', () => filterDrawer?.classList.remove('open'));
        }
    }
}

export default new Products();
