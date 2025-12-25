/**
 * Fabian E-commerce - Main JavaScript
 * Mobile-first functionality
 */

// Global products array
let allProducts = [];

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
});

/**
 * Validate product images structure
 */
function validateProductImages(product) {
    if (!product.images || !Array.isArray(product.images)) {
        console.warn(`Product "${product.name}" (ID: ${product.id}) has no images array`);
        return false;
    }

    if (product.images.length < 1) {
        console.warn(`Product "${product.name}" (ID: ${product.id}) has no images`);
        return false;
    }

    return true;
}

/**
 * Load products from products.json
 */
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        allProducts = data.products;

        // Validate all products
        allProducts.forEach(product => {
            validateProductImages(product);
        });

        // Check for category filter in URL before rendering (shop page)
        let initialCategory = null;
        if (window.location.pathname.includes('shop.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            initialCategory = urlParams.get('category');
        }

        // Render products on the page (filtered if category specified)
        renderProducts(initialCategory);

        // Initialize all other functionality
        initCategoryItems();
        initFilterPills();
        initWishlistButtons();
        initSmoothScroll();
        restoreFavouritesState();
        initFavouritesPage();
        initProductCardClicks();
        initProductPage();
        initBackToTop();
        initMostraTuttoButtons();
        applyUrlFilter();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

/**
 * Render products on the page
 * @param {string|null} categoryFilter - Optional category to filter products (for shop page)
 */
function renderProducts(categoryFilter = null) {
    const productsContainer = document.getElementById('productsContainer');
    const featuredContainer = document.querySelector('.featured-scroll');
    const shopProductsGrid = document.querySelector('.products-grid');

    // Render regular products (index.html) - randomized order
    if (productsContainer) {
        productsContainer.innerHTML = '';
        const regularProducts = allProducts.filter(p => !p.featured);
        // Shuffle the products array for random display order
        const shuffled = [...regularProducts].sort(() => Math.random() - 0.5);
        shuffled.forEach(product => {
            productsContainer.appendChild(createProductCard(product, 'scroll-card'));
        });
    }

    // Render featured products (index.html)
    if (featuredContainer) {
        featuredContainer.innerHTML = '';
        allProducts.filter(p => p.featured).forEach(product => {
            featuredContainer.appendChild(createProductCard(product, 'featured-card', true));
        });
    }

    // Render products on shop page (filtered if category specified)
    if (shopProductsGrid) {
        shopProductsGrid.innerHTML = '';
        let productsToRender = allProducts;

        // Filter by category if specified (skip filtering for "tutti" which means "all")
        if (categoryFilter && categoryFilter !== 'tutti') {
            productsToRender = allProducts.filter(product => {
                const categories = product.categories || [];
                return categories.includes(categoryFilter);
            });
        }

        // Hide filters section if no products
        const filtersSection = document.querySelector('.filters-section');
        if (filtersSection) {
            filtersSection.style.display = productsToRender.length === 0 ? 'none' : '';
        }

        productsToRender.forEach(product => {
            shopProductsGrid.appendChild(createProductCard(product, ''));
        });
    }
}

/**
 * Create a product card element
 */
function createProductCard(product, extraClass = '', isFeatured = false) {
    const card = document.createElement('div');
    card.className = `product-card ${extraClass}`;
    card.dataset.category = product.categories.join(' ');
    card.dataset.productId = product.id;
    card.dataset.productName = product.name;
    card.dataset.productPrice = product.price;
    card.dataset.productImage = product.images?.[0] || 'img/fabian.webp';

    const badgeHTML = isFeatured ? '<span class="badge-bestseller">Bestseller</span>' : '';

    card.innerHTML = `
        <div class="product-img-wrapper">
            <img src="${product.images?.[0] || 'img/fabian.webp'}" alt="${product.name}">
            ${badgeHTML}
            <button class="wishlist-btn"><i class="bi bi-heart"></i></button>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">&euro; ${product.price}</p>
        </div>
    `;

    return card;
}

/**
 * Category Items Functionality
 */
function initCategoryItems() {
    const categoryItems = document.querySelectorAll('.category-item[data-category]');

    categoryItems.forEach(item => {
        item.style.cursor = 'pointer';

        item.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;

            // Haptic feedback on mobile
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }

            // Navigate to shop page with category filter
            window.location.href = `shop.html?category=${category}`;
        });
    });
}

/**
 * Filter Pills Functionality
 */
function initFilterPills() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const productCards = document.querySelectorAll('.product-card[data-category]');
    const sectionTitle = document.getElementById('productsSectionTitle') || document.querySelector('.products-section .section-title');
    const categoryItems = document.querySelectorAll('.category-item[data-category]');

    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Update active state on filter pills
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            // Update section title
            if (sectionTitle) {
                sectionTitle.textContent = this.textContent;
            }

            // Update active state on corresponding category
            categoryItems.forEach(cat => cat.classList.remove('active'));
            const matchingCategory = document.querySelector(`.category-item[data-category="${filter}"]`);
            if (matchingCategory) {
                matchingCategory.classList.add('active');
            } else if (filter === 'tutti') {
                // Remove all active states when "tutti" is selected
                categoryItems.forEach(cat => cat.classList.remove('active'));
            }

            // Filter products with animation
            let visibleCount = 0;
            productCards.forEach((card, index) => {
                const categories = card.dataset.category || '';

                if (filter === 'tutti' || categories.includes(filter)) {
                    card.style.display = '';
                    card.style.animation = `fadeIn 0.3s ease ${visibleCount * 0.05}s forwards`;
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Haptic feedback on mobile
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        });
    });
}

/**
 * Mostra Tutto Button Functionality
 * Navigates to shop page with the currently active category
 */
function initMostraTuttoButtons() {
    const mostraTuttoButtons = document.querySelectorAll('.toggle-view-btn');

    mostraTuttoButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Find the currently active category
            const activeCategory = document.querySelector('.category-item.active');

            if (activeCategory) {
                const categoryValue = activeCategory.dataset.category;
                // Navigate to shop page with the category parameter
                window.location.href = `shop.html?category=${categoryValue}`;
            } else {
                // If no category is active, default to "tutti"
                window.location.href = 'shop.html?category=tutti';
            }
        });
    });
}

/**
 * Category-specific filter configuration
 */
const categoryFilters = {
    'cucina': [
        { filter: 'tutti', label: 'Tutti' },
        { filter: 'tovagliette', label: 'Tovagliette' },
        { filter: 'grembiuli', label: 'Grembiuli' }
    ],
    'asilo': [
        { filter: 'tutti', label: 'Tutti' },
        { filter: 'bimbo', label: 'Bimbo' },
        { filter: 'bimba', label: 'Bimba' }
    ],
    'borse': [
        { filter: 'tutti', label: 'Tutti' }
    ],
    'decorazioni': [
        { filter: 'tutti', label: 'Tutti' },
        { filter: 'bimbo', label: 'Bimbo' },
        { filter: 'bimba', label: 'Bimba' }
    ],
    'regali': [
        { filter: 'tutti', label: 'Tutti' }
    ]
};

/**
 * Update filter pills based on category
 */
function updateFilterPills(category) {
    const filtersScroll = document.querySelector('.filters-scroll');
    const filtersSection = document.querySelector('.filters-section');
    if (!filtersScroll) return;

    // Get products in current category
    const productsInCategory = category && category !== 'tutti'
        ? allProducts.filter(p => (p.categories || []).includes(category))
        : allProducts;

    // Get filters for this category, or use default
    let filters = categoryFilters[category] || [
        { filter: 'tutti', label: 'Tutti' },
        { filter: 'asilo', label: 'Asilo' },
        { filter: 'bimbo', label: 'Bimbo' },
        { filter: 'bimba', label: 'Bimba' },
        { filter: 'regalo', label: 'Regalo' },
        { filter: 'cucina', label: 'Cucina' }
    ];

    // Filter out pills that have no matching products
    filters = filters.filter(filterConfig => {
        if (filterConfig.filter === 'tutti') return true;
        return productsInCategory.some(p => (p.categories || []).includes(filterConfig.filter));
    });

    // Hide filters section if only "Tutti" filter remains or no products
    if (filtersSection) {
        if (filters.length <= 1 || productsInCategory.length === 0) {
            filtersSection.style.display = 'none';
            return;
        } else {
            filtersSection.style.display = '';
        }
    }

    // Clear existing pills
    filtersScroll.innerHTML = '';

    // Create new pills
    filters.forEach((filterConfig, index) => {
        const pill = document.createElement('button');
        pill.className = 'filter-pill';
        pill.dataset.filter = filterConfig.filter;
        pill.textContent = filterConfig.label;

        // Make first pill active by default
        if (index === 0) {
            pill.classList.add('active');
        }

        filtersScroll.appendChild(pill);
    });

    // Re-initialize filter pills functionality
    initFilterPills();
}

/**
 * Apply URL Filter on Shop Page
 * Reads the category parameter from URL and updates title/filter pills
 * Note: Products are already filtered during renderProducts() to avoid image flickering
 */
function applyUrlFilter() {
    // Only run on shop page
    if (!window.location.pathname.includes('shop.html')) {
        return;
    }

    // Get the category parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        // Update filter pills for this category
        updateFilterPills(category);

        // Update the category title
        const categoryTitle = document.getElementById('categoryTitle');
        if (categoryTitle) {
            const categoryNames = {
                'cucina': 'Cucina',
                'asilo': 'Asilo',
                'borse': 'Borse',
                'decorazioni': 'Decorazioni',
                'regali': 'Regali'
            };
            categoryTitle.textContent = categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
        }

        // Products are already filtered during renderProducts() - no need to re-filter here
        // This prevents the image flickering issue caused by applying animations after images loaded
    }
}

/**
 * Favourites Storage Helper Functions
 */
function getFavourites() {
    const favourites = localStorage.getItem('fabian_favourites');
    return favourites ? JSON.parse(favourites) : [];
}

function saveFavourites(favourites) {
    localStorage.setItem('fabian_favourites', JSON.stringify(favourites));
}

function addToFavourites(product) {
    const favourites = getFavourites();
    if (!favourites.find(f => f.id === product.id)) {
        favourites.push(product);
        saveFavourites(favourites);
    }
}

function removeFromFavourites(productId) {
    const favourites = getFavourites();
    const updated = favourites.filter(f => f.id !== productId);
    saveFavourites(updated);
}

function isFavourite(productId) {
    const favourites = getFavourites();
    return favourites.some(f => f.id === productId);
}

/**
 * Restore Favourites State on Page Load
 */
function restoreFavouritesState() {
    const productCards = document.querySelectorAll('.product-card[data-product-id]');

    productCards.forEach(card => {
        const productId = card.dataset.productId;
        const btn = card.querySelector('.wishlist-btn');
        const icon = btn?.querySelector('i');

        if (btn && icon && isFavourite(productId)) {
            btn.classList.add('active');
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
        }
    });
}

/**
 * Wishlist Button Toggle
 */
function initWishlistButtons() {
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');

    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const card = this.closest('.product-card');
            const productId = card?.dataset.productId;

            if (!productId) return;

            this.classList.toggle('active');

            const icon = this.querySelector('i');
            if (this.classList.contains('active')) {
                icon.classList.remove('bi-heart');
                icon.classList.add('bi-heart-fill');

                // Save product to favourites
                const fullProduct = allProducts.find(p => p.id === productId);
                const product = {
                    id: productId,
                    name: card.dataset.productName,
                    price: card.dataset.productPrice,
                    images: fullProduct?.images || [card.dataset.productImage],
                    type: card.dataset.productType || 'Zainetto'
                };
                addToFavourites(product);

                // Haptic feedback on mobile (if supported)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }

                // Show toast notification
                showToast('Aggiunto ai preferiti');
            } else {
                icon.classList.remove('bi-heart-fill');
                icon.classList.add('bi-heart');

                // Remove from favourites
                removeFromFavourites(productId);

                showToast('Rimosso dai preferiti');
            }
        });
    });
}

/**
 * Toast Notification
 */
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 0.85rem;
        z-index: 2000;
        opacity: 1;
    `;

    document.body.appendChild(toast);

    // Remove after delay
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

/**
 * Smooth Scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

/**
 * Lazy Loading Images (native with fallback)
 */
if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for older browsers
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/**
 * Pull to Refresh (mobile gesture)
 */
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndY = e.changedTouches[0].clientY;

    // If at top of page and pulled down
    if (window.scrollY === 0 && touchEndY - touchStartY > 100) {
        // Could implement refresh logic here
        console.log('Pull to refresh gesture detected');
    }
}, { passive: true });

/**
 * Add to Cart animation (for future use)
 */
function addToCart(productId) {
    const cartIcon = document.querySelector('.bottom-nav-item .bi-bag');
    if (cartIcon) {
        cartIcon.parentElement.classList.add('bounce');
        setTimeout(() => {
            cartIcon.parentElement.classList.remove('bounce');
        }, 500);
    }

    showToast('Prodotto aggiunto al carrello');
}

/**
 * Initialize Favourites Page
 */
function initFavouritesPage() {
    const emptyState = document.getElementById('emptyFavourites');
    const favouritesList = document.getElementById('favouritesList');
    const orderBtnContainer = document.getElementById('orderBtnContainer');

    if (!emptyState || !favouritesList) return;

    const favourites = getFavourites();

    if (favourites.length === 0) {
        emptyState.style.display = 'block';
        favouritesList.style.display = 'none';
        if (orderBtnContainer) {
            orderBtnContainer.classList.add('d-none');
            document.body.classList.remove('has-order-btn');
        }
    } else {
        emptyState.style.display = 'none';
        favouritesList.style.display = '';
        favouritesList.innerHTML = '';

        favourites.forEach(product => {
            const item = createFavouriteItem(product);
            favouritesList.appendChild(item);
        });

        // Show order button
        if (orderBtnContainer) {
            orderBtnContainer.classList.remove('d-none');
            document.body.classList.add('has-order-btn');
        }

        // Initialize order button click handler
        initFavouritesOrderButton();
    }
}

/**
 * Initialize Order Button on Favourites Page
 */
function initFavouritesOrderButton() {
    const orderBtn = document.getElementById('orderBtn');
    if (!orderBtn) return;

    orderBtn.addEventListener('click', function(e) {
        e.preventDefault();

        const favourites = getFavourites();
        if (favourites.length === 0) return;

        let productsList = favourites.map(product =>
            `- ${product.name} (€ ${product.price})`
        ).join('\n');

        const message = `Ciao! Sono interessato/a ai seguenti prodotti:\n\n` +
            `${productsList}\n\n` +
            `Vorrei avere maggiori informazioni!`;

        const phoneNumber = '393202615110';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
}

function createFavouriteItem(product) {
    const item = document.createElement('div');
    item.className = 'favourite-item';
    item.dataset.productId = product.id;

    item.innerHTML = `
        <div class="favourite-img">
            <img src="${product.images?.[0] || product.image || 'img/fabian.webp'}" alt="${product.name}">
        </div>
        <div class="favourite-info">
            <h3 class="favourite-name">${product.name}</h3>
            <p class="favourite-type">${product.type || 'Zainetto'}</p>
            <p class="favourite-price">&euro; ${product.price}</p>
        </div>
        <button class="favourite-delete" aria-label="Rimuovi dai preferiti">
            <i class="bi bi-trash"></i>
        </button>
    `;

    const deleteBtn = item.querySelector('.favourite-delete');
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        removeFromFavourites(product.id);
        showToast('Rimosso dai preferiti');

        item.remove();
        const remainingFavourites = getFavourites();
        if (remainingFavourites.length === 0) {
            document.getElementById('emptyFavourites').style.display = 'block';
            document.getElementById('favouritesList').style.display = 'none';
            const orderBtnContainer = document.getElementById('orderBtnContainer');
            if (orderBtnContainer) {
                orderBtnContainer.classList.add('d-none');
                document.body.classList.remove('has-order-btn');
            }
        }
    });

    return item;
}

/**
 * Product Card Click Handler
 */
function initProductCardClicks() {
    const productCards = document.querySelectorAll('.product-card[data-product-id]');

    productCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            // Don't navigate if clicking the wishlist button
            if (e.target.closest('.wishlist-btn')) return;

            const productId = this.dataset.productId;
            const fullProduct = allProducts.find(p => p.id === productId);

            if (!fullProduct) return;

            const product = {
                id: fullProduct.id,
                name: fullProduct.name,
                price: fullProduct.price,
                images: fullProduct.images || ['img/fabian.webp'],
                description: fullProduct.description || '',
                specs: fullProduct.specs || {},
                category: this.dataset.category || ''
            };

            // Store product info in localStorage
            localStorage.setItem('fabian_current_product', JSON.stringify(product));

            // Navigate to product page
            window.location.href = 'product.html';
        });
    });
}

/**
 * Product Page Initialization
 */
function initProductPage() {
    const productTitle = document.querySelector('.product-title-main');
    const productPrice = document.querySelector('.product-price-main');
    const productCategory = document.querySelector('.product-category');
    const productDescription = document.querySelector('.product-description-text');

    // Only run on product page
    if (!productTitle || !productPrice) return;

    const productData = localStorage.getItem('fabian_current_product');
    if (productData) {
        const product = JSON.parse(productData);

        productTitle.textContent = product.name;
        productPrice.textContent = '€ ' + product.price;
        if (productCategory && product.category) {
            productCategory.textContent = product.category.split(' ')[0] || 'Prodotto';
        }
        if (productDescription && product.description) {
            productDescription.textContent = product.description;
        }

        // Populate product specs
        if (product.specs) {
            const specAltezza = document.querySelector('.spec-altezza');
            const specLarghezza = document.querySelector('.spec-larghezza');
            const specProfondita = document.querySelector('.spec-profondita');

            if (specAltezza && product.specs.altezza) {
                specAltezza.textContent = product.specs.altezza;
            }
            if (specLarghezza && product.specs.larghezza) {
                specLarghezza.textContent = product.specs.larghezza;
            }
            if (specProfondita && product.specs.profondita) {
                specProfondita.textContent = product.specs.profondita;
            }
        }

        // Dynamically populate carousel with images
        const carouselInner = document.querySelector('#productCarousel .carousel-inner');
        const carouselIndicators = document.querySelector('#productCarousel .carousel-indicators');
        const images = product.images || ['img/fabian.webp'];

        if (carouselInner) {
            // Clear existing items
            carouselInner.innerHTML = '';

            // Create carousel items
            images.forEach((imagePath, index) => {
                const carouselItem = document.createElement('div');
                carouselItem.className = `carousel-item${index === 0 ? ' active' : ''}`;
                carouselItem.innerHTML = `
                    <div class="product-image-container">
                        <img src="${imagePath}" alt="${product.name} - Immagine ${index + 1} di ${images.length}">
                    </div>
                `;
                carouselInner.appendChild(carouselItem);
            });
        }

        if (carouselIndicators && images.length > 1) {
            // Clear existing indicators
            carouselIndicators.innerHTML = '';

            // Create indicators
            images.forEach((_, index) => {
                const indicator = document.createElement('button');
                indicator.type = 'button';
                indicator.setAttribute('data-bs-target', '#productCarousel');
                indicator.setAttribute('data-bs-slide-to', index.toString());
                if (index === 0) indicator.className = 'active';
                carouselIndicators.appendChild(indicator);
            });
        } else if (carouselIndicators && images.length === 1) {
            // Hide indicators if only 1 image
            carouselIndicators.style.display = 'none';
        }

        // Update page title
        document.title = product.name + ' - Fabian';

        // Populate related products section
        populateRelatedProducts(product);
    }
}

/**
 * Populate Related Products Section
 */
function populateRelatedProducts(currentProduct) {
    const suggestionsScroll = document.querySelector('.suggestions-scroll');
    if (!suggestionsScroll) return;

    // Get the full product from allProducts to check for relatedProducts field
    const fullProduct = allProducts.find(p => p.id === currentProduct.id);
    let relatedProducts = [];

    if (fullProduct && fullProduct.relatedProducts && fullProduct.relatedProducts.length > 0) {
        // Use the specified related products
        relatedProducts = fullProduct.relatedProducts
            .map(id => allProducts.find(p => p.id === id))
            .filter(p => p && validateProductImages(p)); // Only include products with valid images
    } else {
        // Get random products (excluding current product)
        relatedProducts = getRandomProducts(currentProduct.id, 6);
    }

    // Clear existing suggestions
    suggestionsScroll.innerHTML = '';

    // Create and append suggestion cards
    relatedProducts.forEach(product => {
        const card = createSuggestionCard(product);
        suggestionsScroll.appendChild(card);
    });

    // Re-initialize wishlist buttons for the new cards
    initWishlistButtons();
    restoreFavouritesState();
    initProductCardClicks();
}

/**
 * Get Random Products
 */
function getRandomProducts(excludeId, count = 6) {
    const validProducts = allProducts.filter(p =>
        p.id !== excludeId && validateProductImages(p)
    );

    // Shuffle array and take first 'count' items
    const shuffled = validProducts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Create Suggestion Card
 */
function createSuggestionCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card suggestion-card';
    card.dataset.productId = product.id;
    card.dataset.productName = product.name;
    card.dataset.productPrice = product.price;
    card.dataset.productImage = product.images?.[0] || 'img/fabian.webp';
    card.dataset.category = product.categories?.join(' ') || '';

    card.innerHTML = `
        <div class="product-img-wrapper">
            <img src="${product.images?.[0] || 'img/fabian.webp'}" alt="${product.name}">
            <button class="wishlist-btn"><i class="bi bi-heart"></i></button>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">&euro; ${product.price}</p>
        </div>
    `;

    return card;
}

/**
 * Back to Top Functionality
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    if (!backToTopBtn) return;

    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Expose functions globally if needed
window.addToCart = addToCart;
