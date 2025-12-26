/**
 * Admin Panel JavaScript
 * Handles product form submission
 */

let uploadedImages = [];
let imageFiles = [];
let currentEditingProductId = null;
let currentDeletingProductId = null;
let allProducts = [];
let editImageFiles = [];

// API Key - will be set by environment variable at build time
const API_KEY = '__ADMIN_API_KEY__'; // This will be replaced during build

// Setup event listeners on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('productForm');
    const imagesInput = document.getElementById('productImages');

    form.addEventListener('submit', handleFormSubmit);
    imagesInput.addEventListener('change', handleImageSelection);

    // Setup product management
    setupProductManagement();
}

/**
 * Handle image selection and preview
 */
function handleImageSelection(e) {
    const files = Array.from(e.target.files);
    imageFiles = files;

    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';

    files.forEach((file, index) => {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Errore: L\'immagine ' + file.name + ' supera 5MB', 'danger');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-btn" data-index="${index}">×</button>
            `;

            previewItem.querySelector('.remove-btn').addEventListener('click', function() {
                removeImage(index);
            });

            previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Remove image from selection
 */
function removeImage(index) {
    imageFiles.splice(index, 1);

    // Update file input
    const dt = new DataTransfer();
    imageFiles.forEach(file => dt.items.add(file));
    document.getElementById('productImages').files = dt.files;

    // Re-render preview
    handleImageSelection({ target: { files: imageFiles } });
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Caricamento...';

    try {
        const formData = getFormData();

        if (!validateForm(formData)) {
            throw new Error('Validazione fallita');
        }

        const imageUrls = await uploadImages();
        if (imageUrls.length === 0) {
            throw new Error('Devi caricare almeno un\'immagine');
        }

        const productId = await getNextProductId();

        const product = {
            id: String(productId),
            name: formData.name,
            price: formData.price,
            images: imageUrls,
            categories: formData.categories,
            featured: formData.featured,
            description: formData.description,
            specs: {}
        };

        if (formData.altezza) product.specs.altezza = formData.altezza;
        if (formData.larghezza) product.specs.larghezza = formData.larghezza;

        console.log('Saving product:', product);

        await saveProduct(product);

        showAlert('Prodotto aggiunto con successo! Il sito si aggiornerà automaticamente in 30-60 secondi.', 'success');

        document.getElementById('productForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        imageFiles = [];
        uploadedImages = [];

    } catch (error) {
        console.error('Form submission error:', error);
        showAlert('Errore: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Aggiungi Prodotto';
    }
}

/**
 * Get form data
 */
function getFormData() {
    const categories = [];
    document.querySelectorAll('input[type="checkbox"][id^="cat"]:checked').forEach(cb => {
        categories.push(cb.value);
    });

    return {
        name: document.getElementById('productName').value.trim(),
        price: document.getElementById('productPrice').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        categories: categories,
        featured: document.getElementById('productFeatured').checked,
        altezza: document.getElementById('specAltezza').value.trim(),
        larghezza: document.getElementById('specLarghezza').value.trim()
    };
}

/**
 * Validate form data
 */
function validateForm(data) {
    if (!data.name || data.name.length < 3) {
        showAlert('Il nome del prodotto deve avere almeno 3 caratteri', 'warning');
        return false;
    }

    if (!data.price || !/^\d+\.\d{2}$/.test(data.price)) {
        showAlert('Il prezzo deve essere nel formato: 18.00', 'warning');
        return false;
    }

    if (!data.description || data.description.length < 10) {
        showAlert('La descrizione deve avere almeno 10 caratteri', 'warning');
        return false;
    }

    if (data.categories.length === 0) {
        showAlert('Seleziona almeno una categoria', 'warning');
        return false;
    }

    if (imageFiles.length === 0) {
        showAlert('Devi caricare almeno un\'immagine', 'warning');
        return false;
    }

    return true;
}

/**
 * Upload images to Cloudinary via Netlify Function
 */
async function uploadImages(files = imageFiles, progressId = 'uploadProgress', barId = 'uploadProgressBar', statusId = 'uploadStatus') {
    const progressDiv = document.getElementById(progressId);
    const progressBar = document.getElementById(barId);
    const statusText = document.getElementById(statusId);

    if (progressDiv) progressDiv.style.display = 'block';
    const imageUrls = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = Math.round(((i + 1) / files.length) * 100);

        if (progressBar) progressBar.style.width = progress + '%';
        if (statusText) statusText.textContent = `Caricamento immagine ${i + 1} di ${files.length}...`;

        try {
            const base64 = await fileToBase64(file);

            const response = await fetch('/.netlify/functions/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({
                    image: base64,
                    filename: file.name
                })
            });

            let errorData;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse response as JSON:', jsonError);
                throw new Error('Server ha restituito una risposta non valida');
            }

            if (!response.ok) {
                throw new Error(errorData.message || `Errore HTTP ${response.status}`);
            }

            if (!errorData.url || typeof errorData.url !== 'string') {
                throw new Error('Server non ha restituito un URL valido');
            }

            imageUrls.push(errorData.url);

        } catch (error) {
            console.error(`Upload error for ${file.name}:`, error);
            if (progressDiv) progressDiv.style.display = 'none';

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error(`Errore di rete durante il caricamento di ${file.name}. Verifica la connessione.`);
            }

            throw new Error(`Errore caricamento ${file.name}: ${error.message}`);
        }
    }

    if (progressDiv) progressDiv.style.display = 'none';
    return imageUrls;
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get next product ID
 */
async function getNextProductId() {
    try {
        const response = await fetch('/products.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.products || !Array.isArray(data.products)) {
            throw new Error('products.json format non valido');
        }

        if (data.products.length === 0) {
            return 1;
        }

        const ids = data.products.map(p => parseInt(p.id)).filter(id => !isNaN(id));
        if (ids.length === 0) {
            return 1;
        }

        return Math.max(...ids) + 1;
    } catch (error) {
        console.error('Error getting product ID:', error);
        throw new Error('Impossibile ottenere il prossimo ID prodotto: ' + error.message);
    }
}

/**
 * Save product to products.json via Netlify Function
 */
async function saveProduct(product) {
    const response = await fetch('/.netlify/functions/save-product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        body: JSON.stringify(product)
    });

    let responseData;
    try {
        responseData = await response.json();
    } catch (jsonError) {
        console.error('Failed to parse save-product response as JSON:', jsonError);
        throw new Error('Server ha restituito una risposta non valida');
    }

    if (!response.ok) {
        if (response.status === 409) {
            throw new Error('Conflitto: products.json è stato modificato. Ricarica la pagina e riprova.');
        }

        if (response.status === 401) {
            throw new Error('Sessione scaduta. Effettua di nuovo il login.');
        }

        throw new Error(responseData.message || `Errore HTTP ${response.status}`);
    }

    return responseData;
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.innerHTML = '';
    container.appendChild(alert);

    // Auto-dismiss success messages after 10 seconds
    if (type === 'success') {
        setTimeout(() => {
            alert.remove();
        }, 10000);
    }

    // Scroll to top to see the alert
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Setup product management
 */
function setupProductManagement() {
    // Load products on page load (only if user is authenticated)
    const authCheck = setInterval(() => {
        if (sessionStorage.getItem('adminAuth') === 'true') {
            clearInterval(authCheck);
            loadProducts();
        }
    }, 100);

    // Edit modal setup
    const saveEditBtn = document.getElementById('saveEditBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const editImagesInput = document.getElementById('editProductImages');

    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', handleEditSubmit);
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    }

    if (editImagesInput) {
        editImagesInput.addEventListener('change', handleEditImageSelection);
    }

    // Reset modal state when closed
    const editModal = document.getElementById('editProductModal');
    if (editModal) {
        editModal.addEventListener('hidden.bs.modal', resetEditModal);
    }
}

/**
 * Load all products from products.json
 */
async function loadProducts() {
    const loadingDiv = document.getElementById('productsLoading');
    const errorDiv = document.getElementById('productsError');
    const gridDiv = document.getElementById('productsGrid');

    // Show loading state
    if (loadingDiv) loadingDiv.classList.remove('d-none');
    if (errorDiv) errorDiv.classList.add('d-none');
    if (gridDiv) gridDiv.classList.add('d-none');

    try {
        const response = await fetch('/products.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.products || !Array.isArray(data.products)) {
            throw new Error('Formato products.json non valido');
        }

        allProducts = data.products;
        renderProductsGrid(allProducts);

        // Hide loading, show grid
        if (loadingDiv) loadingDiv.classList.add('d-none');
        if (gridDiv) gridDiv.classList.remove('d-none');

    } catch (error) {
        console.error('Error loading products:', error);

        // Show error
        if (loadingDiv) loadingDiv.classList.add('d-none');
        if (errorDiv) {
            errorDiv.classList.remove('d-none');
            errorDiv.textContent = 'Errore nel caricamento dei prodotti: ' + error.message;
        }
    }
}

/**
 * Render products in admin grid
 */
function renderProductsGrid(products) {
    const gridDiv = document.getElementById('productsGrid');
    if (!gridDiv) return;

    gridDiv.innerHTML = '';

    if (products.length === 0) {
        gridDiv.innerHTML = '<p class="text-muted text-center py-5">Nessun prodotto trovato.</p>';
        return;
    }

    // Sort by ID descending (newest first)
    const sortedProducts = [...products].sort((a, b) => parseInt(b.id) - parseInt(a.id));

    sortedProducts.forEach(product => {
        const card = createAdminProductCard(product);
        gridDiv.appendChild(card);
    });
}

/**
 * Create admin product card
 */
function createAdminProductCard(product) {
    const card = document.createElement('div');
    card.className = 'admin-product-card';
    card.dataset.productId = product.id;

    const categoriesHTML = product.categories.map(cat =>
        `<span class="category-badge">${cat}</span>`
    ).join('');

    const featuredBadge = product.featured ?
        '<span class="badge bg-warning text-dark position-absolute top-0 start-0 m-2">In evidenza</span>' : '';

    card.innerHTML = `
        <div class="product-img-wrapper">
            ${featuredBadge}
            <img src="${product.images?.[0] || 'img/placeholder.webp'}"
                 alt="${product.name}"
                 onerror="this.src='img/placeholder.webp'">
        </div>
        <div class="product-info">
            <h3 class="product-name" title="${product.name}">${product.name}</h3>
            <p class="product-price">&euro; ${product.price}</p>
            <div class="product-categories">${categoriesHTML}</div>
            <div class="product-actions">
                <button type="button" class="btn btn-outline-primary btn-sm edit-btn" data-id="${product.id}">
                    <i class="bi bi-pencil"></i> Modifica
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm delete-btn" data-id="${product.id}">
                    <i class="bi bi-trash"></i> Elimina
                </button>
            </div>
        </div>
    `;

    // Attach event listeners
    card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(product.id));
    card.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(product.id));

    return card;
}

/**
 * Open edit modal and pre-fill with product data
 */
function openEditModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showAlert('Prodotto non trovato', 'danger');
        return;
    }

    currentEditingProductId = productId;

    // Pre-fill form fields
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description;
    document.getElementById('editProductFeatured').checked = product.featured;

    // Pre-fill categories
    document.querySelectorAll('#editProductForm input[type="checkbox"][id^="editCat"]').forEach(cb => {
        cb.checked = product.categories.includes(cb.value);
    });

    // Pre-fill specs
    document.getElementById('editSpecAltezza').value = product.specs?.altezza || '';
    document.getElementById('editSpecLarghezza').value = product.specs?.larghezza || '';

    // Show existing images
    displayExistingImages(product.images);

    // Clear new image selection
    document.getElementById('editProductImages').value = '';
    document.getElementById('editImagePreview').innerHTML = '';
    editImageFiles = [];

    // Open modal
    const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
    modal.show();
}

/**
 * Display existing product images
 */
function displayExistingImages(images) {
    const container = document.getElementById('existingImagesPreview');
    if (!container) return;

    container.innerHTML = '<p class="small mb-2"><strong>Immagini attuali:</strong></p>';

    const imagesWrapper = document.createElement('div');
    imagesWrapper.className = 'existing-images-preview';

    images.forEach((url, index) => {
        const imgItem = document.createElement('div');
        imgItem.className = 'image-item';
        imgItem.innerHTML = `
            <img src="${url}" alt="Immagine ${index + 1}">
        `;
        imagesWrapper.appendChild(imgItem);
    });

    container.appendChild(imagesWrapper);
}

/**
 * Handle edit image selection
 */
function handleEditImageSelection(e) {
    const files = Array.from(e.target.files);
    editImageFiles = files;

    const previewContainer = document.getElementById('editImagePreview');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    if (files.length === 0) return;

    const notice = document.createElement('p');
    notice.className = 'small text-warning mb-2';
    notice.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Le nuove immagini sostituiranno completamente quelle esistenti.';
    previewContainer.appendChild(notice);

    files.forEach((file, index) => {
        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Errore: L\'immagine ' + file.name + ' supera 5MB', 'danger');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-btn" data-index="${index}">×</button>
            `;

            previewItem.querySelector('.remove-btn').addEventListener('click', function() {
                removeEditImage(index);
            });

            previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Remove image from edit selection
 */
function removeEditImage(index) {
    editImageFiles.splice(index, 1);

    // Update file input
    const dt = new DataTransfer();
    editImageFiles.forEach(file => dt.items.add(file));
    document.getElementById('editProductImages').files = dt.files;

    // Re-render preview
    handleEditImageSelection({ target: { files: editImageFiles } });
}

/**
 * Handle edit form submission
 */
async function handleEditSubmit() {
    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio...';

    try {
        const formData = getEditFormData();

        if (!validateEditForm(formData)) {
            throw new Error('Validazione fallita');
        }

        // If new images uploaded, use them; otherwise keep existing
        let imageUrls;
        if (editImageFiles.length > 0) {
            imageUrls = await uploadImages(editImageFiles, 'editUploadProgress', 'editUploadProgressBar', 'editUploadStatus');
            if (imageUrls.length === 0) {
                throw new Error('Devi caricare almeno un\'immagine');
            }
        } else {
            // Keep existing images
            const existingProduct = allProducts.find(p => p.id === currentEditingProductId);
            imageUrls = existingProduct.images;
        }

        const updatedProduct = {
            id: currentEditingProductId,
            name: formData.name,
            price: formData.price,
            images: imageUrls,
            categories: formData.categories,
            featured: formData.featured,
            description: formData.description,
            specs: {}
        };

        if (formData.altezza) updatedProduct.specs.altezza = formData.altezza;
        if (formData.larghezza) updatedProduct.specs.larghezza = formData.larghezza;

        console.log('Updating product:', updatedProduct);

        await updateProduct(updatedProduct);

        showAlert('Prodotto aggiornato con successo!', 'success');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();

        // Reload products
        await loadProducts();

    } catch (error) {
        console.error('Edit submission error:', error);
        showAlert('Errore: ' + error.message, 'danger');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Salva Modifiche';
    }
}

/**
 * Get edit form data
 */
function getEditFormData() {
    const categories = [];
    document.querySelectorAll('#editProductForm input[type="checkbox"][id^="editCat"]:checked').forEach(cb => {
        categories.push(cb.value);
    });

    return {
        name: document.getElementById('editProductName').value.trim(),
        price: document.getElementById('editProductPrice').value.trim(),
        description: document.getElementById('editProductDescription').value.trim(),
        categories: categories,
        featured: document.getElementById('editProductFeatured').checked,
        altezza: document.getElementById('editSpecAltezza').value.trim(),
        larghezza: document.getElementById('editSpecLarghezza').value.trim()
    };
}

/**
 * Validate edit form (reuse existing validation)
 */
function validateEditForm(data) {
    return validateForm(data);
}

/**
 * Reset edit modal
 */
function resetEditModal() {
    currentEditingProductId = null;
    editImageFiles = [];
    document.getElementById('editProductForm').reset();
    document.getElementById('editImagePreview').innerHTML = '';
    document.getElementById('existingImagesPreview').innerHTML = '';
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showAlert('Prodotto non trovato', 'danger');
        return;
    }

    currentDeletingProductId = productId;
    document.getElementById('deleteProductName').textContent = product.name;

    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

/**
 * Handle delete confirmation
 */
async function handleDeleteConfirm() {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Eliminazione...';

    try {
        await deleteProduct(currentDeletingProductId);

        showAlert('Prodotto eliminato con successo!', 'success');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();

        // Reload products
        await loadProducts();

        currentDeletingProductId = null;

    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Errore: ' + error.message, 'danger');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-trash"></i> Elimina Definitivamente';
    }
}

/**
 * Update product via Netlify Function
 */
async function updateProduct(product) {
    const response = await fetch('/.netlify/functions/update-product', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        body: JSON.stringify(product)
    });

    let responseData;
    try {
        responseData = await response.json();
    } catch (jsonError) {
        console.error('Failed to parse update-product response as JSON:', jsonError);
        throw new Error('Server ha restituito una risposta non valida');
    }

    if (!response.ok) {
        if (response.status === 409) {
            throw new Error('Conflitto: products.json è stato modificato. Ricarica la pagina e riprova.');
        }

        if (response.status === 401) {
            throw new Error('Sessione scaduta. Effettua di nuovo il login.');
        }

        if (response.status === 404) {
            throw new Error('Prodotto non trovato.');
        }

        throw new Error(responseData.message || `Errore HTTP ${response.status}`);
    }

    return responseData;
}

/**
 * Delete product via Netlify Function
 */
async function deleteProduct(productId) {
    const response = await fetch('/.netlify/functions/delete-product', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        body: JSON.stringify({ id: productId })
    });

    let responseData;
    try {
        responseData = await response.json();
    } catch (jsonError) {
        console.error('Failed to parse delete-product response as JSON:', jsonError);
        throw new Error('Server ha restituito una risposta non valida');
    }

    if (!response.ok) {
        if (response.status === 409) {
            throw new Error('Conflitto: products.json è stato modificato. Ricarica la pagina e riprova.');
        }

        if (response.status === 401) {
            throw new Error('Sessione scaduta. Effettua di nuovo il login.');
        }

        if (response.status === 404) {
            throw new Error('Prodotto non trovato.');
        }

        throw new Error(responseData.message || `Errore HTTP ${response.status}`);
    }

    return responseData;
}
