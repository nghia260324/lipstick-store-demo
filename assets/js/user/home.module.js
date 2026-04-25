import Cart from '../utils/cart.js';

class Home {
    constructor() {
        this.tabsContainer = document.getElementById('homeTabs');
        this.gridContainer = document.getElementById('featuredGrid');
        this.allData = [];

        this.init();
    }

    async init() {
        console.log("Init home");
        await this.fetchProducts();
        this.setupEventListeners();
    }

    async fetchProducts() {
        try {
            const response = await fetch('api/home_products.php');
            const result = await response.json();

            if (result.success) {
                this.allData = result.data;
                this.renderTabs();
                this.renderProducts('all');
            }
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
        }
    }

    renderTabs() {
        if (!this.tabsContainer) return;

        let html = `<button class="products-tab active" data-id="all">Tất cả</button>`;

        this.allData.forEach(cat => {
            html += `<button class="products-tab" data-id="${cat.category_id}">${cat.category_name}</button>`;
        });

        this.tabsContainer.innerHTML = html;
    }

    renderProducts(categoryId) {
        if (!this.gridContainer) return;

        let productsToShow = [];
        if (categoryId === 'all') {
            // Lấy 8 sản phẩm đầu tiên của mỗi danh mục (hoặc tổng hợp lại)
            this.allData.forEach(cat => {
                productsToShow = [...productsToShow, ...cat.products];
            });
            // Giới hạn hiển thị ví dụ 12 sản phẩm nếu là "Tất cả"
            productsToShow = productsToShow.slice(0, 12);
        } else {
            const cat = this.allData.find(c => c.category_id == categoryId);
            if (cat) productsToShow = cat.products;
        }

        if (productsToShow.length === 0) {
            this.gridContainer.innerHTML = '<p class="text-center w-full py-10 opacity-50">Không có sản phẩm nào.</p>';
            return;
        }

        this.gridContainer.innerHTML = productsToShow.map(p => this.createProductHTML(p)).join('');
    }

    createProductHTML(p) {
        if (!p.colors || p.colors.length === 0) return '';

        // Mặc định hiển thị màu đầu tiên
        const defaultColor = p.colors[0];
        const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(defaultColor.price);
        const image = defaultColor.image || 'assets/images/placeholder-product.png';

        // Tạo HTML cho mảng màu theo cấu trúc mẫu
        const swatchesHTML = p.colors.map((c, index) => `
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

    setupEventListeners() {
        if (!this.tabsContainer) return;

        // Bắt sự kiện chuyển tab
        this.tabsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.products-tab');
            if (!btn) return;

            this.tabsContainer.querySelectorAll('.products-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const id = btn.dataset.id;
            this.renderProducts(id);
        });

        // Bắt sự kiện trên card (đổi màu, thêm vào giỏ, xem chi tiết)
        if (this.gridContainer) {
            this.gridContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                if (!card) return;

                const productId = card.dataset.id;

                // 1. Đổi màu
                const swatch = e.target.closest('.swatch');
                if (swatch) {
                    card.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');

                    // Cập nhật ảnh
                    const newImg = swatch.dataset.image;
                    card.querySelector('.product-card__img').src = newImg;

                    // Cập nhật giá
                    const newPrice = swatch.dataset.price;
                    const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newPrice);
                    card.querySelector('.price').textContent = priceFormatted;
                    return;
                }

                // 2. Thêm vào giỏ
                const cartBtn = e.target.closest('.product-card__cart-btn');
                if (cartBtn) {
                    const activeSwatch = card.querySelector('.swatch.active');
                    if (activeSwatch) {
                        const colorId = activeSwatch.dataset.id;
                        Cart.add(colorId, 1);
                    }
                    return;
                }

                // 3. Xem chi tiết (nếu không click vào swatch hay nút giỏ hàng)
                if (!e.target.closest('.product-card__action-btn')) {
                    window.location.href = `product-detail.php?id=${productId}`;
                }
            });
        }
    }
}


export default new Home();