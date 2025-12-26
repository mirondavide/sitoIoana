/**
 * Admin Panel JavaScript
 * Handles product form submission and Netlify Identity authentication
 */

let uploadedImages = [];
let imageFiles = [];

// Initialize Netlify Identity
const netlifyIdentity = window.netlifyIdentity;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    netlifyIdentity.on('init', user => {
        if (!user) {
            netlifyIdentity.open();
        }
    });

    netlifyIdentity.on('login', () => {
        netlifyIdentity.close();
        location.reload();
    });

    netlifyIdentity.on('logout', () => {
        location.href = '/index.html';
    });

    netlifyIdentity.init();

    // Check if user is logged in
    const user = netlifyIdentity.currentUser();
    if (!user) {
        netlifyIdentity.open();
        return;
    }

    // Setup event listeners
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('productForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const imagesInput = document.getElementById('productImages');

    form.addEventListener('submit', handleFormSubmit);
    logoutBtn.addEventListener('click', () => netlifyIdentity.logout());
    imagesInput.addEventListener('change', handleImageSelection);
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
async function uploadImages() {
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const statusText = document.getElementById('uploadStatus');

    progressDiv.style.display = 'block';
    const imageUrls = [];

    const user = netlifyIdentity.currentUser();
    if (!user || !user.token || !user.token.access_token) {
        progressDiv.style.display = 'none';
        throw new Error('Sessione scaduta. Effettua di nuovo il login.');
    }

    const token = user.token.access_token;

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const progress = Math.round(((i + 1) / imageFiles.length) * 100);

        progressBar.style.width = progress + '%';
        statusText.textContent = `Caricamento immagine ${i + 1} di ${imageFiles.length}...`;

        try {
            const base64 = await fileToBase64(file);

            const response = await fetch('/.netlify/functions/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            progressDiv.style.display = 'none';

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error(`Errore di rete durante il caricamento di ${file.name}. Verifica la connessione.`);
            }

            throw new Error(`Errore caricamento ${file.name}: ${error.message}`);
        }
    }

    progressDiv.style.display = 'none';
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
    const user = netlifyIdentity.currentUser();
    if (!user || !user.token || !user.token.access_token) {
        throw new Error('Sessione scaduta. Effettua di nuovo il login.');
    }

    const token = user.token.access_token;

    const response = await fetch('/.netlify/functions/save-product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
