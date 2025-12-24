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

        // Render products on the page
        renderProducts();

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
 */
function renderProducts() {
    const productsContainer = document.getElementById('productsContainer');
    const featuredContainer = document.querySelector('.featured-scroll');
    const shopProductsGrid = document.querySelector('.products-grid');

    // Render regular products (index.html)
    if (productsContainer) {
        productsContainer.innerHTML = '';
        allProducts.filter(p => !p.featured).forEach(product => {
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

    // Render all products on shop page
    if (shopProductsGrid) {
        shopProductsGrid.innerHTML = '';
        allProducts.forEach(product => {
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
    card.dataset.productImage = product.images?.[0] || 'img/fabian.png';

    const badgeHTML = isFeatured ? '<span class="badge-bestseller">Bestseller</span>' : '';

    card.innerHTML = `
        <div class="product-img-wrapper">
            <img src="${product.images?.[0] || 'img/fabian.png'}" alt="${product.name}">
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
    const productCards = document.querySelectorAll('.product-card[data-category]');
    const sectionTitle = document.getElementById('productsSectionTitle');

    categoryItems.forEach(item => {
        item.style.cursor = 'pointer';

        item.addEventListener('click', function() {
            const category = this.dataset.category;
            const categoryName = this.querySelector('.category-name').textContent;

            // Remove active state from all categories
            categoryItems.forEach(cat => cat.classList.remove('active'));

            // Add active state to clicked category
            this.classList.add('active');

            // Update section title
            if (sectionTitle) {
                sectionTitle.textContent = categoryName;
            }

            // Filter products with animation
            let visibleCount = 0;
            productCards.forEach((card) => {
                const categories = card.dataset.category || '';

                if (categories.includes(category)) {
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
 * Apply URL Filter on Shop Page
 * Reads the category parameter from URL and applies the corresponding filter
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
        // Find and click the corresponding filter pill
        const filterPills = document.querySelectorAll('.filter-pill');
        const productCards = document.querySelectorAll('.product-card[data-category]');
        const categoryTitle = document.getElementById('categoryTitle');

        filterPills.forEach(pill => {
            if (pill.dataset.filter === category) {
                // Remove active class from all pills
                filterPills.forEach(p => p.classList.remove('active'));
                // Add active class to the matching pill
                pill.classList.add('active');

                // Update the category title
                if (categoryTitle) {
                    categoryTitle.textContent = pill.textContent;
                }

                // Filter the products
                productCards.forEach((card, index) => {
                    const categories = card.dataset.category || '';

                    if (category === 'tutti' || categories.includes(category)) {
                        card.style.display = '';
                        card.style.animation = `fadeIn 0.3s ease ${index * 0.05}s forwards`;
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
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
            <img src="${product.images?.[0] || product.image || 'img/fabian.png'}" alt="${product.name}">
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
                images: fullProduct.images || ['img/fabian.png'],
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
        const images = product.images || ['img/fabian.png'];

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
    }
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
