class ProductUpdate {
    constructor() {
        this.productId = new URLSearchParams(window.location.search).get('id');
        this.product = null;
        this.categories = [];
        this.brands = [];
        this.productColors = [];
        this.stockHistory = [];
        this.selectedImages = []; // Dùng cho modal đang mở
        this.activeModal = 'add'; // 'add' hoặc 'edit' hoặc 'stock_add' hoặc 'stock_edit'
        this.deletedImageIds = []; // Dùng khi edit

        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    async init() {
        // if (!this.productId) {
        //     App.toast.error('ID sản phẩm không hợp lệ');
        //     setTimeout(() => window.location.href = 'products.php', 2000);
        //     return;
        // }

        this.initTabs();
        this.initModals();
        this.bindEvents();

        // await Promise.all([
        //     this.loadDependencies(),
        //     this.fetchProductDetail()
        // ]);
    }

    initModals() {
        const setupModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            const open = () => modal.classList.add('active');
            const close = () => modal.classList.remove('active');

            const closeBtns = modal.querySelectorAll('[data-modal-close]');
            closeBtns.forEach(btn => btn.addEventListener('click', close));

            modal.addEventListener('click', (e) => {
                if (e.target === modal) close();
            });

            return { open, close, element: modal };
        };

        this.addModal = setupModal('colorModalAdd');
        this.editModal = setupModal('colorModalEdit');
        this.stockAddModal = setupModal('stockModalAdd');
        this.stockEditModal = setupModal('stockModalEdit');
    }

    initTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');
            });
        });
    }

    async loadDependencies() {
        try {
            const response = await fetch('api/products/get_form_data.php');
            const result = await response.json();
            if (result.success) {
                this.categories = result.categories;
                this.brands = result.brands;
                this.renderDropdowns();
            }
        } catch (error) {
            console.error('Error loading dependencies:', error);
        }
    }

    renderDropdowns() {
        const catSelect = document.getElementById('productCategory');
        const brandSelect = document.getElementById('productBrand');

        if (catSelect) {
            catSelect.innerHTML = '<option value="">Chọn danh mục</option>' +
                this.categories.map(c => `<option value="${c.id}">${c.category_name}</option>`).join('');
        }
        if (brandSelect) {
            brandSelect.innerHTML = '<option value="">Chọn thương hiệu</option>' +
                this.brands.map(b => `<option value="${b.id}">${b.brand_name}</option>`).join('');
        }
    }

    async fetchProductDetail() {
        try {
            const response = await fetch(`api/products/get.php?id=${this.productId}`);
            const result = await response.json();

            if (result.success) {
                this.product = result.data;
                this.productColors = this.product.colors || [];
                this.stockHistory = this.product.stock_imports || [];
                this.fillBasicInfo();
                this.renderColors();
                this.renderStockHistory();
                this.updateStockColorSelects();
            } else {
                App.toast.error(result.message);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            App.toast.error('Lỗi kết nối server');
        }
    }

    fillBasicInfo() {
        if (!this.product) return;

        const pageTitle = document.getElementById('displayProductName');
        if (pageTitle) pageTitle.textContent = this.product.product_name;

        const fields = {
            'productName': 'product_name',
            'productCategory': 'category_id',
            'productBrand': 'brand_id',
            'productStatus': 'status',
            'productDescription': 'description',
            'productIngredients': 'ingredients',
            'productHowToUse': 'how_to_use'
        };

        for (const [id, key] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) {
                // Handle 0 correctly (like status)
                const value = this.product[key];
                el.value = (value !== null && value !== undefined) ? value : '';
            }
        }
    }

    renderColors() {
        const container = document.getElementById('colorListContainer');
        const btnHeader = document.getElementById('btnAddColorHeader');
        if (!container) return;

        if (this.productColors.length === 0) {
            if (btnHeader) btnHeader.style.display = 'none';
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-palette" style="font-size: 48px; color: var(--color-border); margin-bottom: var(--space-3); display: block;"></i>
                    <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--color-dark); margin-bottom: var(--space-2);">Quản lý Màu sắc & Biến thể</h3>
                    <p style="color: var(--color-text-secondary); margin-bottom: var(--space-4);">Sản phẩm này hiện chưa có phân loại màu sắc nào.</p>
                    <button class="btn-primary" style="margin: 0 auto;" onclick="document.getElementById('btnAddColorHeader').click()">
                        <i class="bi bi-plus-lg"></i> Thêm màu mới
                    </button>
                </div>
            `;
            return;
        }

        if (btnHeader) btnHeader.style.display = 'block';

        const tableHtml = `
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Màu sắc</th>
                            <th>Hình ảnh</th>
                            <th>Giá bán</th>
                            <th>Tồn kho</th>
                            <th>Trạng thái</th>
                            <th style="text-align: right;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.productColors.map(color => {
            const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(color.selling_price);
            const statusClass = color.status == 1 ? 'status-badge--active' : 'status-badge--inactive';
            const statusText = color.status == 1 ? 'Đang bán' : 'Ngừng bán';

            let imageUrl = "../assets/images/no-image.png";
            if (color.image_url) {
                imageUrl = color.image_url.startsWith('http') ? color.image_url : "../" + color.image_url;
            }

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: var(--space-2);">
                            <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: ${color.hex_code || '#ccc'}; border: 1px solid var(--color-border);"></span>
                            <span style="font-weight: var(--font-medium); color: var(--color-dark);">${color.color_name}</span>
                        </div>
                    </td>
                    <td>
                        <img src="${imageUrl}" alt="${color.color_name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--color-border-light);">
                    </td>
                    <td>${priceFormatted}</td>
                    <td>${color.stock_quantity || 0}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="table-actions" style="justify-content: flex-end; display: flex; gap: 8px;">
                            <button class="action-btn" title="Chỉnh sửa" data-id="${color.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn" title="Xóa" data-id="${color.id}" 
                                    style="cursor: ${color.can_delete ? 'pointer' : 'not-allowed'}; color: ${color.can_delete ? '#F44336' : '#ccc'};"
                                    ${color.can_delete == 0 ? 'disabled' : ''}>
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }

    updateStockColorSelects() {
        const selects = document.querySelectorAll('.stock-color-select');
        const options = '<option value="">Chọn màu sắc...</option>' +
            this.productColors.map(c => `<option value="${c.id}">${c.color_name}</option>`).join('');

        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = options;
            select.value = currentValue;
        });
    }

    renderStockHistory() {
        const container = document.getElementById('stockListContainer');
        const btnHeader = document.getElementById('btnCreateStockHeader');
        if (!container) return;

        if (this.stockHistory.length === 0) {
            if (btnHeader) btnHeader.style.display = 'none';
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-box-seam" style="font-size: 48px; color: var(--color-border); margin-bottom: var(--space-3); display: block;"></i>
                    <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--color-dark); margin-bottom: var(--space-2);">Lịch sử Nhập kho</h3>
                    <p style="color: var(--color-text-secondary); margin-bottom: var(--space-4);">Chưa có phiếu nhập kho nào cho sản phẩm này.</p>
                    <button class="btn-primary" style="margin: 0 auto;" onclick="document.getElementById('btnCreateStockHeader').click()">
                        <i class="bi bi-plus-lg"></i> Tạo phiếu nhập mới
                    </button>
                </div>
            `;
            return;
        }

        if (btnHeader) btnHeader.style.display = 'block';

        const tableHtml = `
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày nhập</th>
                            <th>Phân loại màu</th>
                            <th>Số lượng</th>
                            <th>Tồn kho</th>
                            <th>Giá nhập</th>
                            <th>Trạng thái</th>
                            <th style="text-align: right;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.stockHistory.map(stock => {
            const date = new Date(stock.import_date).toLocaleDateString('vi-VN');
            const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stock.import_price);

            let statusClass = 'status-badge--draft';
            let statusText = 'Bản nháp';
            if (stock.status == 1) {
                statusClass = 'status-badge--imported';
                statusText = 'Đã nhập kho';
            } else if (stock.status == 2) {
                statusClass = 'status-badge--cancelled';
                statusText = 'Đã hủy';
            }

            return `
                <tr>
                    <td><span style="font-family: monospace; font-weight: bold;">#${stock.id}</span></td>
                    <td>${date}</td>
                    <td>${stock.color_name}</td>
                    <td><strong>${stock.quantity}</strong></td>
                    <td><strong>${stock.remaining_quantity}</strong></td>
                    <td>${priceFormatted}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="table-actions" style="justify-content: flex-end; display: flex; gap: 8px;">
                            <button ${stock.status == 0 ? '' : 'disabled'} class="action-btn" title="Sửa phiếu" data-id="${stock.id}" data-action="stock-edit"
                                style="cursor: ${stock.status == 0 ? 'pointer' : 'not-allowed'}; color: ${stock.status == 0 ? '' : '#ccc'};">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button ${stock.status == 0 ? '' : 'disabled'} class="action-btn" title="Xóa phiếu" data-id="${stock.id}" data-action="stock-delete" 
                                style="cursor: ${stock.status == 0 ? 'pointer' : 'not-allowed'}; color: ${stock.status == 0 ? '#F44336' : '#ccc'};">
                                <i class="bi bi-trash"></i>
                            </button>
        
                        </div>
                    </td>
                </tr>
            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }

    bindEvents() {
        // Nút lưu thông tin cơ bản
        const btnSaveBasic = document.getElementById('btnSaveBasicInfo');
        if (btnSaveBasic) {
            btnSaveBasic.addEventListener('click', () => this.saveBasicInfo());
        }

        // Nút mở modal thêm màu
        const btnAddColor = document.getElementById('btnAddColorHeader');
        if (btnAddColor) {
            btnAddColor.addEventListener('click', () => {
                this.activeModal = 'add';
                this.resetColorForm();
                this.addModal.open();
            });
        }

        // Nút lưu màu mới
        const btnSubmitColor = document.getElementById('btnColorAddSubmit');
        if (btnSubmitColor) {
            btnSubmitColor.addEventListener('click', () => this.saveColor());
        }

        // Nút cập nhật màu
        const btnUpdateColor = document.getElementById('btnColorEditSubmit');
        if (btnUpdateColor) {
            btnUpdateColor.addEventListener('click', () => this.updateColor());
        }

        // Event delegation cho danh sách màu
        const colorList = document.getElementById('colorListContainer');
        if (colorList) {
            colorList.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const id = btn.dataset.id;
                if (btn.title === 'Chỉnh sửa') {
                    this.openEditColorModal(id);
                } else if (btn.title === 'Xóa') {
                    this.deleteColor(id);
                }
            });
        }

        // --- NHẬP KHO ---
        const btnCreateStock = document.getElementById('btnCreateStockHeader');
        if (btnCreateStock) {
            btnCreateStock.addEventListener('click', () => {
                this.activeModal = 'stock_add';
                const form = document.getElementById('stockFormAdd');
                if (form) {
                    form.reset();
                    // Set default date to today
                    const dateInput = form.querySelector('input[type="date"]');
                    if (dateInput) dateInput.valueAsDate = new Date();
                }
                this.stockAddModal.open();
            });
        }

        const btnSubmitStock = document.getElementById('btnStockAddSubmit');
        if (btnSubmitStock) {
            btnSubmitStock.addEventListener('click', () => this.saveStockImport());
        }

        const btnUpdateStock = document.getElementById('btnStockEditSubmit');
        if (btnUpdateStock) {
            btnUpdateStock.addEventListener('click', () => this.updateStockImport());
        }

        const stockList = document.getElementById('stockListContainer');
        if (stockList) {
            stockList.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const id = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'stock-edit') {
                    this.openEditStockModal(id);
                } else if (action === 'stock-delete') {
                    this.deleteStockImport(id);
                }
            });
        }

        // Khởi tạo upload ảnh và sync màu cho cả 2 modal
        this.initColorImageUpload('colorImageDropzone', 'colorImageInput', 'colorImagePreview');
        this.initColorPickerSync('colorPicker', 'colorHex');

        this.initColorImageUpload('editColorImageDropzone', 'editColorImageInput', 'editColorImagePreview');
        this.initColorPickerSync('editColorPicker', 'editColorHex');
    }

    async saveStockImport() {
        const form = document.getElementById('stockFormAdd');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        formData.append('product_id', this.productId);

        try {
            App.loading.show();
            const response = await fetch('api/products/create_stock.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            App.loading.hide();

            if (result.success) {
                App.toast.success(result.message);
                this.stockAddModal.close();
                this.fetchProductDetail(); // Load lại toàn bộ (bao gồm cả tồn kho ở tab Màu sắc)
            } else {
                App.toast.error(result.message);
            }

        } catch (error) {
            App.loading.hide();
            App.toast.error('Lỗi kết nối server');
        }
    }

    async deleteStockImport(id) {
        App.confirm.show({
            title: 'Xác nhận xóa',
            message: 'Bạn có chắc chắn muốn xóa phiếu nhập kho này? Lưu ý: Chỉ có thể xóa phiếu ở trạng thái Bản nháp.',
            type: 'danger',
            confirmText: 'Xóa ngay',
            onConfirm: async () => {
                try {
                    App.loading.show();
                    const response = await fetch(`api/products/delete_stock.php?id=${id}`);
                    const result = await response.json();
                    App.loading.hide();

                    if (result.success) {
                        App.toast.success(result.message);
                        this.fetchProductDetail();
                    } else {
                        App.toast.error(result.message);
                    }
                } catch (error) {
                    App.loading.hide();
                    App.toast.error('Lỗi kết nối server');
                }
            }
        });
    }

    openEditStockModal(id) {
        const stock = this.stockHistory.find(s => s.id == id);
        if (!stock) return;

        this.activeModal = 'stock_edit';

        document.getElementById('editStockId').value = stock.id;
        document.getElementById('editStockColor').value = stock.color_id;
        document.getElementById('editStockDate').value = stock.import_date.split(' ')[0];
        document.getElementById('editStockQuantity').value = stock.quantity;
        document.getElementById('editStockPrice').value = stock.import_price;
        document.getElementById('editStockStatus').value = stock.status;
        document.getElementById('editStockNote').value = stock.note || '';

        // Nếu phiếu đã hoàn thành hoặc đã hủy thì không cho sửa một số trường nhạy cảm
        const isLocked = stock.status != 0;
        document.getElementById('editStockColor').disabled = isLocked;
        document.getElementById('editStockQuantity').disabled = isLocked;
        document.getElementById('editStockPrice').disabled = isLocked;
        document.getElementById('editStockDate').disabled = isLocked;

        this.stockEditModal.open();
    }

    async updateStockImport() {
        const form = document.getElementById('stockFormEdit');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Kích hoạt lại các trường bị disable để FormData có thể lấy dữ liệu
        const disabledFields = form.querySelectorAll(':disabled');
        disabledFields.forEach(f => f.disabled = false);

        const formData = new FormData(form);

        // Disable lại ngay sau khi lấy data để giữ UI
        disabledFields.forEach(f => f.disabled = true);

        try {
            App.loading.show();
            const response = await fetch('api/products/update_stock.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            App.loading.hide();

            if (result.success) {
                App.toast.success(result.message);
                this.stockEditModal.close();
                this.fetchProductDetail();
            } else {
                App.toast.error(result.message);
            }
        } catch (error) {
            App.loading.hide();
            App.toast.error('Lỗi kết nối server');
        }
    }

    initColorPickerSync(pickerId, hexId) {
        const picker = document.getElementById(pickerId);
        const hex = document.getElementById(hexId);
        if (picker && hex) {
            picker.addEventListener('input', (e) => {
                hex.value = e.target.value.toUpperCase();
            });
            hex.addEventListener('input', (e) => {
                let val = e.target.value;
                if (val && !val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    picker.value = val;
                }
            });
        }
    }

    initColorImageUpload(dropzoneId, inputId, previewId) {
        const dropzone = document.getElementById(dropzoneId);
        const input = document.getElementById(inputId);
        const previewContainer = document.getElementById(previewId);

        if (!dropzone || !input) return;

        dropzone.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleImageSelect(files);
            input.value = '';
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--color-primary)';
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = 'var(--color-border)';
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--color-border)';
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            this.handleImageSelect(files);
        });

        if (previewContainer) {
            previewContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action === 'remove') this.removeImage(id);
                else if (action === 'move') {
                    const dir = parseInt(btn.dataset.dir);
                    this.moveImage(id, dir);
                }
            });
        }
    }

    handleImageSelect(files) {
        files.forEach(file => {
            if (file.size > 2 * 1024 * 1024) {
                App.toast.warning(`File ${file.name} vượt quá 2MB`);
                return;
            }

            const imgObj = {
                file: file,
                id: 'new_' + Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file),
                isNew: true
            };

            this.selectedImages.push(imgObj);
        });

        this.renderImagePreviews();
    }

    renderImagePreviews() {
        const previewId = this.activeModal === 'add' ? 'colorImagePreview' : 'editColorImagePreview';
        const container = document.getElementById(previewId);
        if (!container) return;

        container.innerHTML = this.selectedImages.map((img, index) => `
            <div class="image-preview-item" 
                 style="position: relative; width: 80px; height: 80px; border-radius: var(--radius-sm); border: 2px solid ${index === 0 ? 'var(--color-primary)' : 'var(--color-border-light)'}; overflow: hidden; background: #eee;">
                <img src="${img.preview}" style="width: 100%; height: 100%; object-fit: cover;">
                
                ${index === 0 ? `
                    <div style="position: absolute; top: 0; left: 0; background: var(--color-primary); color: white; font-size: 8px; padding: 1px 3px; border-bottom-right-radius: 4px; font-weight: bold; z-index: 2;">
                        MẶC ĐỊNH
                    </div>
                ` : ''}

                <div class="preview-actions" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: space-around; padding: 2px 0; opacity: 0; transition: opacity 0.2s;">
                    <button type="button" data-action="move" data-id="${img.id}" data-dir="-1" style="background: none; border: none; color: white; cursor: pointer; padding: 2px;"><i class="bi bi-chevron-left"></i></button>
                    <button type="button" data-action="remove" data-id="${img.id}" style="background: none; border: none; color: #ff4d4d; cursor: pointer; padding: 2px;"><i class="bi bi-trash"></i></button>
                    <button type="button" data-action="move" data-id="${img.id}" data-dir="1" style="background: none; border: none; color: white; cursor: pointer; padding: 2px;"><i class="bi bi-chevron-right"></i></button>
                </div>
            </div>
        `).join('');
    }

    removeImage(id) {
        const index = this.selectedImages.findIndex(img => img.id == id);
        if (index > -1) {
            const img = this.selectedImages[index];
            if (img.isNew) {
                URL.revokeObjectURL(img.preview);
            } else {
                this.deletedImageIds.push(img.id);
            }
            this.selectedImages.splice(index, 1);
            this.renderImagePreviews();
        }
    }

    moveImage(id, direction) {
        const index = this.selectedImages.findIndex(img => img.id == id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < this.selectedImages.length) {
            const temp = this.selectedImages[index];
            this.selectedImages[index] = this.selectedImages[newIndex];
            this.selectedImages[newIndex] = temp;
            this.renderImagePreviews();
        }
    }

    resetColorForm() {
        const formId = this.activeModal === 'add' ? 'colorForm' : 'editColorForm';
        const form = document.getElementById(formId);
        if (form) form.reset();

        this.selectedImages.forEach(img => {
            if (img.isNew) URL.revokeObjectURL(img.preview);
        });
        this.selectedImages = [];
        this.deletedImageIds = [];
        this.renderImagePreviews();

        if (this.activeModal === 'add') {
            const picker = document.getElementById('colorPicker');
            if (picker) picker.value = '#A0254A';
        }
    }

    openEditColorModal(id) {
        const color = this.productColors.find(c => c.id == id);
        if (!color) return;

        this.activeModal = 'edit';
        this.resetColorForm();

        // Điền thông tin vào form edit
        document.getElementById('editColorId').value = color.id;
        document.getElementById('editColorName').value = color.color_name;
        document.getElementById('editColorHex').value = color.hex_code;
        document.getElementById('editColorPicker').value = color.hex_code || '#000000';
        document.getElementById('editSellingPrice').value = color.selling_price;
        document.getElementById('editColorStatus').value = color.status;

        // Load ảnh hiện tại
        this.selectedImages = (color.all_images || []).map(img => ({
            id: img.id,
            preview: img.image_url.startsWith('http') ? img.image_url : "../" + img.image_url,
            isNew: false
        }));

        this.renderImagePreviews();
        this.editModal.open();
    }

    async saveColor() {
        const form = document.getElementById('colorForm');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        formData.append('product_id', this.productId);
        this.selectedImages.forEach((img) => {
            formData.append('images[]', img.file);
        });

        try {
            App.loading.show();
            const response = await fetch('api/products/create_color.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            App.loading.hide();

            if (result.success) {
                App.toast.success(result.message);
                this.addModal.close();
                this.fetchProductDetail();
            } else {
                App.toast.error(result.message);
            }
        } catch (error) {
            App.loading.hide();
            App.toast.error('Lỗi kết nối server');
        }
    }

    async updateColor() {
        const form = document.getElementById('editColorForm');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        formData.append('product_id', this.productId);

        // Meta data cho thứ tự ảnh và các ảnh cũ được giữ lại
        const imageOrder = [];
        this.selectedImages.forEach((img, idx) => {
            if (img.isNew) {
                imageOrder.push({ type: 'new', id: img.id });
                formData.append('new_images[]', img.file);
                formData.append('new_images_ids[]', img.id);
            } else {
                imageOrder.push({ type: 'existing', id: img.id });
            }
        });

        formData.append('image_order', JSON.stringify(imageOrder));
        formData.append('deleted_image_ids', JSON.stringify(this.deletedImageIds));

        try {
            App.loading.show();
            const response = await fetch('api/products/update_color.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            App.loading.hide();

            if (result.success) {
                App.toast.success(result.message);
                this.editModal.close();
                this.fetchProductDetail();
            } else {
                App.toast.error(result.message);
            }
        } catch (error) {
            App.loading.hide();
            App.toast.error('Lỗi kết nối server');
        }
    }

    async deleteColor(id) {
        App.confirm.show({
            title: 'Xác nhận xóa',
            message: 'Bạn có chắc chắn muốn xóa màu sắc này? Hành động này sẽ xóa tất cả ảnh liên quan.',
            type: 'danger',
            confirmText: 'Xóa ngay',
            onConfirm: async () => {
                try {
                    App.loading.show();
                    const response = await fetch(`api/products/delete_color.php?id=${id}`);
                    const result = await response.json();
                    App.loading.hide();

                    if (result.success) {
                        App.toast.success(result.message);
                        this.fetchProductDetail();
                    } else {
                        App.toast.error(result.message);
                    }
                } catch (error) {
                    App.loading.hide();
                    App.toast.error('Lỗi kết nối server');
                }
            }
        });
    }

    async saveBasicInfo() {
        const form = document.getElementById('basicInfoForm');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        formData.append('id', this.productId);

        try {
            App.loading.show();
            const response = await fetch('api/products/update_basic.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            App.loading.hide();

            if (result.success) {
                App.toast.success(result.message);
                const pageTitle = document.getElementById('displayProductName');
                if (pageTitle) pageTitle.textContent = formData.get('product_name');
            } else {
                App.toast.error(result.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            App.loading.hide();
            console.error('Error updating basic info:', error);
            App.toast.error('Lỗi kết nối server');
        }
    }
}

export default new ProductUpdate();
