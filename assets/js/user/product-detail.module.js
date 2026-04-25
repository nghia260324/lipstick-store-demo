import Cart from '../utils/cart.js';

class ProductDetail {
    constructor() {
        this.params = new URLSearchParams(location.search);
        this.pid = parseInt(this.params.get('id')) || 1;
        this.product = null;
        this.selectedColor = null;
        this.selectedColorInfo = null;
        this.qty = 1;

        this.init();
    }

    async init() {
        await this.fetchProductDetail();
        if (this.product) {
            this.setupEventListeners();
        }
    }

    async fetchProductDetail() {
        try {
            const response = await fetch(`api/product_detail.php?id=${this.pid}`);
            const result = await response.json();

            if (result.success) {
                this.product = result.data;
                // Set default color from the first color in full_colors
                if (this.product.full_colors && this.product.full_colors.length > 0) {
                    this.selectedColorInfo = this.product.full_colors[0];
                    this.selectedColor = this.selectedColorInfo.color_name;
                }

                this.updatePageInfo();
                this.buildDetail();
                this.renderRelated();
            } else {
                console.error('Không tìm thấy sản phẩm');
                document.getElementById('detailLayout').innerHTML = `<p class="text-center py-20">Sản phẩm không tồn tại hoặc đã bị ẩn.</p>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        }
    }

    updatePageInfo() {
        document.title = `${this.product.name} – LipLux`;
        const bcProduct = document.getElementById('bcProduct');
        if (bcProduct) bcProduct.textContent = this.product.name;
    }

    formatPrice(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    renderStars(rating) {
        // let stars = '';
        // for (let i = 1; i <= 5; i++) {
        //     stars += i <= rating ? '⭐' : '☆';
        // }
        // return stars;
        return ''
    }

    buildDetail() {
        if (!this.product) return;

        const product = this.product;
        const colorInfo = this.selectedColorInfo;

        const images = colorInfo.images && colorInfo.images.length > 0 ? colorInfo.images : [colorInfo.image || 'assets/images/placeholder-product.png'];

        const thumbs = images.map((img, i) => `
            <div class="detail-gallery__thumb ${i === 0 ? 'active' : ''}" data-src="${img}">
                <img src="${img}" alt="Ảnh ${i + 1}">
            </div>`).join('');

        const colorSwatches = product.full_colors.map(c => `
            <div class="swatch-lg ${c.color_name === this.selectedColor ? 'active' : ''}"
                style="background:${c.hex_code}"
                data-color="${c.color_name}"
                title="${c.color_name}">
                <span class="swatch-tooltip">${c.color_name}</span>
            </div>`).join('');

        const badge = product.badge ? `<span class="badge badge--${product.badge}">${product.badgeLabel}</span>` : '';
        const origPrice = colorInfo.originalPrice > colorInfo.price
            ? `<span class="detail-price-original">${this.formatPrice(colorInfo.originalPrice)}</span>
               <span class="detail-discount-tag">-${Math.round(((colorInfo.originalPrice - colorInfo.price) / colorInfo.originalPrice) * 100)}%</span>` : '';

        document.getElementById('detailLayout').innerHTML = `
            <!-- GALLERY -->
            <div class="detail-gallery">
                <div class="detail-gallery__thumbs">${thumbs}</div>
                <div class="detail-gallery__main">
                    <img class="detail-gallery__main-img" id="mainImg" src="${images[0]}" alt="${product.name}">
                    <div class="detail-gallery__badges">${badge}</div>
                    <button class="detail-gallery__zoom-btn" id="zoomBtn"><i class="bi bi-zoom-in"></i></button>
                </div>
            </div>

            <!-- INFO -->
            <div class="detail-info">
                <div class="detail-info__brand">
                    ${product.brand}
                    <span class="brand-verified-icon">✦</span>
                </div>
                <h1 class="detail-info__name">${product.name}</h1>

                <div class="detail-info__rating">
                    ${this.renderStars(product.rating)}
                    <span class="rating-score" style="display:none">${product.rating}</span>
                    <span class="rating-count" style="display:none">${product.reviews} đánh giá</span>
                    <span class="rating-sold">Đã bán ${product.reviews * 3}+</span>
                </div>

                <div class="detail-info__price-block">
                    <span class="detail-price">${this.formatPrice(colorInfo.price)}</span>
                    ${origPrice}
                </div>

                <!-- COLOR -->
                <div class="detail-info__colors">
                    <div class="detail-info__label">
                        Màu sắc <span id="selectedColorLabel">${this.selectedColor}</span>
                    </div>
                    <div class="color-swatches-lg" id="colorSwatches">${colorSwatches}</div>
                </div>

                <!-- QUANTITY -->
                <div class="detail-info__colors">
                    <div class="detail-info__label">Số lượng <span>(Còn ${colorInfo.stock} sản phẩm)</span></div>
                    <div class="qty-input">
                        <div class="qty-input__btn" data-action="minus">−</div>
                        <div class="qty-input__value" id="qtyDisplay">${this.qty}</div>
                        <div class="qty-input__btn" data-action="plus">+</div>
                    </div>
                </div>

                <!-- ACTIONS -->
                <div class="detail-info__actions">
                    <div class="detail-info__action-row">
                        <button class="btn btn--primary btn--xl" id="addToCartBtn"><i class="bi bi-bag-plus"></i> Thêm vào giỏ</button>
                        <div style="display: none;" class="detail-wishlist-btn" id="wishlistBtn" title="Yêu thích">
                            <i class="bi bi-heart"></i>
                        </div>
                    </div>
                </div>

                <!-- DELIVERY -->
                <div class="detail-info__delivery">
                    <div class="delivery-item"><span class="delivery-item__icon"><i class="bi bi-patch-check-fill"></i></span>Chính hãng 100%</div>
                    <div class="delivery-item"><span class="delivery-item__icon"><i class="bi bi-truck"></i></span>Giao 2–4 ngày</div>
                    <div class="delivery-item"><span class="delivery-item__icon"><i class="bi bi-arrow-repeat"></i></span>Đổi trả 7 ngày</div>
                    <div class="delivery-item"><span class="delivery-item__icon"><i class="bi bi-shield-check"></i></span>Thanh toán an toàn</div>
                </div>

                <!-- TAGS -->
                <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
                    ${product.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                    <span class="tag">#${product.categoryLabel.replace(/\s+/g, '')}</span>
                </div>
            </div>`;

        // Tab desc
        const tabDesc = document.getElementById('tab-desc');
        tabDesc.style.whiteSpace = 'pre-line';
        if (tabDesc) tabDesc.innerHTML = `<p class="tab-panel__desc">${product.description || 'Chưa có mô tả.'}</p>`;

        // Tab ingredients
        const tabIngred = document.getElementById('tab-ingredients');
        tabIngred.style.whiteSpace = 'pre-line';
        if (tabIngred) tabIngred.innerHTML = `<p class="tab-panel__desc">${product.ingredients || 'Đang cập nhật...'}</p>`;

        // Tab how_to_use
        const tabHowToUse = document.getElementById('tab-how_to_use');
        tabHowToUse.style.whiteSpace = 'pre-line';
        if (tabHowToUse) tabHowToUse.innerHTML = `<p class="tab-panel__desc">${product.how_to_use || 'Đang cập nhật...'}</p>`;
    }

    setupEventListeners() {
        const layout = document.getElementById('detailLayout');
        if (!layout) return;

        layout.addEventListener('click', (e) => {
            // Switch image
            const thumb = e.target.closest('.detail-gallery__thumb');
            if (thumb) {
                const src = thumb.dataset.src;
                document.getElementById('mainImg').src = src;
                layout.querySelectorAll('.detail-gallery__thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            }

            // Select color
            const swatch = e.target.closest('.swatch-lg');
            if (swatch) {
                const colorName = swatch.dataset.color;
                this.selectedColor = colorName;
                this.selectedColorInfo = this.product.full_colors.find(c => c.color_name === colorName);

                // Re-build detail to update images and price
                this.buildDetail();
            }

            // Change quantity
            const qtyBtn = e.target.closest('.qty-input__btn');
            if (qtyBtn) {
                const action = qtyBtn.dataset.action;
                if (action === 'minus') {
                    this.qty = Math.max(1, this.qty - 1);
                } else if (action === 'plus') {
                    this.qty = Math.min(this.selectedColorInfo.stock, this.qty + 1);
                }
                document.getElementById('qtyDisplay').textContent = this.qty;
            }

            // Add to cart
            if (e.target.closest('#addToCartBtn')) {
                this.addToCart();
            }

            // Open lightbox
            if (e.target.closest('#zoomBtn')) {
                this.openLightbox();
            }
        });

        // Tab switching
        const tabNav = document.querySelector('.tab-nav');
        if (tabNav) {
            tabNav.addEventListener('click', (e) => {
                const item = e.target.closest('.tab-nav__item');
                if (item) {
                    // Extract id from onclick attribute: switchTab(this, 'id')
                    const onclickAttr = item.getAttribute('onclick');
                    const match = onclickAttr ? onclickAttr.match(/'([^']+)'/) : null;
                    const tabId = match ? match[1] : null;

                    if (tabId) {
                        this.switchTab(item, tabId);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            }, true);
        }

        // Re-attach onclick for tabs because I might have broken them by moving to module
        window.switchTab = (el, id) => this.switchTab(el, id);

        // Lightbox close
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.addEventListener('click', () => this.closeLightbox());
        }

        // Related products interactions
        const relatedGrid = document.getElementById('relatedGrid');
        if (relatedGrid) {
            relatedGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                if (!card) return;

                const productId = card.dataset.id;

                // 1. Switch color/image
                const swatch = e.target.closest('.swatch');
                if (swatch) {
                    card.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');

                    // Update image
                    const newImg = swatch.dataset.image;
                    card.querySelector('.product-card__img').src = newImg;

                    // Update price
                    const newPrice = swatch.dataset.price;
                    card.querySelector('.price').textContent = this.formatPrice(newPrice);
                    return;
                }

                // 2. Add to cart
                const cartBtn = e.target.closest('.product-card__cart-btn');
                if (cartBtn) {
                    const activeSwatch = card.querySelector('.swatch.active');
                    const colorId = activeSwatch ? activeSwatch.dataset.id : null;

                    if (colorId) {
                        Cart.add(colorId, 1);
                    }
                    return;
                }

                // 3. Go to detail page (if not clicking on swatch or cart button or eye icon)
                if (!e.target.closest('.product-card__cart-btn') && !e.target.closest('.swatch') && !e.target.closest('.product-card__action-btn')) {
                    window.location.href = `product-detail.php?id=${productId}`;
                }
            });
        }
    }

    switchTab(el, id) {
        document.querySelectorAll('.tab-nav__item').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
        const panel = document.getElementById('tab-' + id);
        if (panel) panel.classList.add('active');
    }

    openLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const mainImg = document.getElementById('mainImg');
        if (lightbox && lightboxImg && mainImg) {
            lightboxImg.src = mainImg.src;
            lightbox.classList.add('open');
        }
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) lightbox.classList.remove('open');
    }

    addToCart() {
        if (!this.selectedColorInfo) return;
        Cart.add(this.selectedColorInfo.id, this.qty);
    }

    async renderRelated() {
        try {
            // For now, let's just fetch some products from the same category
            const response = await fetch(`api/products_list.php?categories=${this.product.category_id}&limit=5`);
            const result = await response.json();

            if (result.success) {
                const related = result.data.filter(p => p.id !== this.product.id).slice(0, 4);
                const grid = document.getElementById('relatedGrid');
                if (grid) {
                    grid.innerHTML = related.map(p => this.createRelatedProductHTML(p)).join('');
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm liên quan:', error);
        }
    }

    createRelatedProductHTML(p) {
        if (!p.colors || p.colors.length === 0) return '';

        const defaultColor = p.colors[0];
        const priceFormatted = this.formatPrice(defaultColor.price);
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
                        <a href="product-detail.php?id=${p.id}" class="product-card__action-btn" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </a>
                    </div>
                    <div class="product-card__cart-btn">
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
            </div>`;
    }
}

export default new ProductDetail();
