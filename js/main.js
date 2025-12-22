/**
 * Fabian E-commerce - Main JavaScript
 * Mobile-first functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initFilterPills();
    initWishlistButtons();
    initSmoothScroll();
    restoreFavouritesState();
    initFavouritesPage();
    initProductCardClicks();
    initProductPage();
});

/**
 * Filter Pills Functionality
 */
function initFilterPills() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const productCards = document.querySelectorAll('.product-card[data-category]');
    const sectionTitle = document.querySelector('.products-section .section-title');

    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Update active state
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            // Update section title
            if (sectionTitle) {
                sectionTitle.textContent = this.textContent;
            }

            // Filter products with animation
            productCards.forEach((card, index) => {
                const categories = card.dataset.category || '';

                if (filter === 'tutti' || categories.includes(filter)) {
                    card.style.display = '';
                    card.style.animation = `fadeIn 0.3s ease ${index * 0.05}s forwards`;
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
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
                const product = {
                    id: productId,
                    name: card.dataset.productName,
                    price: card.dataset.productPrice,
                    image: card.dataset.productImage,
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
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
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

        const phoneNumber = '392302615110';
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
            <img src="${product.image}" alt="${product.name}">
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

        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = 'all 0.3s ease';

        setTimeout(() => {
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
        }, 300);
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

            const product = {
                id: this.dataset.productId,
                name: this.dataset.productName,
                price: this.dataset.productPrice,
                image: this.dataset.productImage,
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
    const productImage = document.querySelector('.product-image-container img');
    const productCategory = document.querySelector('.product-category');

    // Only run on product page
    if (!productTitle || !productPrice) return;

    const productData = localStorage.getItem('fabian_current_product');
    if (productData) {
        const product = JSON.parse(productData);

        productTitle.textContent = product.name;
        productPrice.textContent = '€ ' + product.price;
        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }
        if (productCategory && product.category) {
            productCategory.textContent = product.category.split(' ')[0] || 'Prodotto';
        }

        // Update page title
        document.title = product.name + ' - Fabian';
    }
}

// Expose functions globally if needed
window.addToCart = addToCart;
