// ============== تهيئة Firebase ==============
// Fixed: Added proper User Agent detection for Safari
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isMac = /Macintosh/.test(navigator.userAgent);

// Safari-specific Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTrnKCYOtfSSDYtmVQbzP2HcwgkLT565Y",
    authDomain: "robuste-c8e0f.firebaseapp.com",
    projectId: "robuste-c8e0f",
    storageBucket: "robuste-c8e0f.appspot.com",
    messagingSenderId: "975609984963",
    appId: "1:975609984963:web:a481efb493a88d7bc7af76",
    measurementId: "G-DWT7MZN028"
};

// Fixed: Check Firebase initialization for Safari
if (typeof firebase === 'undefined') {
    console.error('Firebase not loaded. Check script order and CORS.');
} else {
    try {
        // Initialize Firebase if no apps exist
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

const db = firebase.firestore ? firebase.firestore() : null;

// Fixed: Safari-safe EmailJS initialization
(function() {
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init("k77vdaUWPpnLrfTnS");
        } catch (e) {
            console.warn('EmailJS initialization error:', e);
        }
    } else {
        console.warn('EmailJS not loaded');
    }
})();

// Fixed: LocalStorage polyfill for Safari Private Browsing
(function() {
    if (typeof localStorage === 'object') {
        try {
            localStorage.setItem('safari_test', 'test');
            localStorage.removeItem('safari_test');
        } catch(e) {
            console.warn('Safari Private Browsing detected - using memory storage');
            var storage = {};
            window._safariMemoryStorage = storage;
            
            Object.defineProperty(window, 'localStorage', {
                value: {
                    setItem: function(k, v) { 
                        storage[k] = String(v); 
                        window._safariMemoryStorage = storage;
                    },
                    getItem: function(k) { 
                        return storage[k] || null; 
                    },
                    removeItem: function(k) { 
                        delete storage[k]; 
                        window._safariMemoryStorage = storage;
                    },
                    clear: function() { 
                        storage = {}; 
                        window._safariMemoryStorage = storage;
                    },
                    key: function(i) {
                        return Object.keys(storage)[i] || null;
                    },
                    get length() {
                        return Object.keys(storage).length;
                    }
                },
                writable: false
            });
        }
    }
})();

// قائمة الولايات الجزائرية
const wilayas = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة",
    "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل",
    "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم",
    "المسيلة", "معسكر", "ورقلة", "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف",
    "تيندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة",
    "عين تموشنت", "غرداية", "غليزان"
];

// ============== المتغيرات العامة ==============
let orderModal = null;
let cart = [];

// Fixed: Safari-compatible Promise polyfill if needed
if (typeof Promise === 'undefined') {
    console.warn('Promise not supported - loading polyfill');
    // Note: Would need to load polyfill via script tag
}

// ============== نظام المنتجات الديناميكي ==============

// دالة جلب وعرض المنتجات من JSON
async function loadAndDisplayProducts(category = 'all') {
    try {
        // Fixed: Safari fetch with credentials and mode
        const response = await fetch('products.json', {
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des produits');
        }
        
        const products = await response.json();
        
        // Fixed: Safari JSON parsing error handling
        if (!Array.isArray(products)) {
            throw new Error('Invalid products data format');
        }
        
        // تصفية المنتجات حسب الفئة
        const filteredProducts = category === 'all' 
            ? products 
            : products.filter(product => product.category === category);
        
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Erreur lors du chargement des produits', 'error');
    }
}

// دالة عرض المنتجات
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">Aucun produit trouvé</div>';
        return;
    }
    
    let productsHTML = '';
    
    products.forEach(product => {
        const discountBadge = product.old_price && product.old_price > product.price ? `
            <div class="discount-badge">
                خصم ${Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
            </div>
        ` : '';
        
        const oldPrice = product.old_price && product.old_price > product.price ? `
            <small dir="ltr" class="text-decoration-line-through text-muted me-2">${product.old_price.toLocaleString()} DA</small>
        ` : '';
        
        const productBadge = product.badge ? `
            <div class="product-badge">
                ${product.badge}
            </div>
        ` : '';
        
        // إنشاء سلايدر للصور
        const carouselIndicators = Array.isArray(product.images) ? product.images.map((_, index) => `
            <button type="button" data-bs-target="#carousel-${product.id}" data-bs-slide-to="${index}" 
                ${index === 0 ? 'class="active" aria-current="true"' : ''} 
                aria-label="صورة ${index + 1}">
            </button>
        `).join('') : '';
        
        const carouselItems = Array.isArray(product.images) ? product.images.map((img, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${img}" class="d-block w-100" alt="${product.title}" loading="lazy" crossorigin="anonymous">
            </div>
        `).join('') : '';
        
        const carouselControls = Array.isArray(product.images) && product.images.length > 1 ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">السابق</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">التالي</span>
            </button>
        ` : '';
        
        const productCard = `
          <!-- قالب البطاقة الجديد -->
<div class="col-6 col-md-4 col-lg-3 mb-4">
  <div class="product-card card h-100 position-relative" role="link" tabindex="0" data-pid="${product.id}">
    ${productBadge || ''}
    ${discountBadge || ''}

    <div id="carousel-${product.id}" class="carousel slide product-carousel" data-bs-ride="${isIOS || isSafari ? 'false' : 'carousel'}">
      <div class="carousel-indicators">
        ${carouselIndicators}
      </div>
      <div class="carousel-inner">
        ${carouselItems}
      </div>
      ${carouselControls}
    </div>

    <div class="card-body">
      <h5 class="product-title card-title">${product.title || 'No Title'}</h5>
      <p class="card-text text-muted small">${product.description_short || ''}</p>

      <div class="price-section d-flex align-items-center mt-2">
        ${oldPrice || ''}
        <p dir="ltr" class="current-price fw-bold mb-0">${(product.price || 0).toLocaleString()} DA</p>
      </div>
    </div>

    <div class="card-footer bg-transparent border-0">
      <!-- زر واحد واضح وكبير للهاتف -->
      <button class="btn btn-orange w-100 add-to-cart-btn" data-id="${product.id}" aria-label="Ajouter ${product.title} au panier">
        <i class="bi bi-cart-plus"></i>&nbsp;Ajouter au panier
      </button>
    </div>
  </div>
</div>
        `;
        
        productsHTML += productCard;
    });
    
    container.innerHTML = productsHTML;
    
    // Fixed: Initialize Bootstrap carousels for Safari
    setTimeout(() => {
        if (typeof bootstrap !== 'undefined' && bootstrap.Carousel) {
            document.querySelectorAll('.carousel').forEach(carouselEl => {
                try {
                    new bootstrap.Carousel(carouselEl, {
                        interval: 4000,
                        wrap: true
                    });
                } catch (e) {
                    console.warn('Carousel init error:', e);
                }
            });
        }
    }, 100);
}

// دالة تحميل العروض الخاصة
async function loadSpecialOffers() {
    try {
        const response = await fetch('products.json', {
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des produits');
        }
        
        const products = await response.json();
        
        if (!Array.isArray(products)) {
            throw new Error('Invalid products data');
        }
        
        // اختر 3 منتجات لها خصم للعروض الخاصة
        const specialOffers = products
            .filter(product => product.old_price && product.old_price > product.price)
            .slice(0, 3);
        
        renderSpecialOffers(specialOffers);
    } catch (error) {
        console.error('Erreur lors du chargement des offres spéciales:', error);
    }
}

// دالة عرض العروض الخاصة
function renderSpecialOffers(offers) {
    const offersContainer = document.getElementById('specialOffersContainer');
    if (!offersContainer) return;
    
    if (!Array.isArray(offers) || offers.length === 0) {
        offersContainer.innerHTML = '<div class="col-12 text-center text-muted">Aucune offre spéciale pour le moment</div>';
        return;
    }
    
    offersContainer.innerHTML = offers.map((product, index) => {
        const discountPercentage = Math.round(((product.old_price - product.price) / product.old_price) * 100);
        
        return `
            <div class="col-md-4">
                <div class="offer-product">
                    <div class="offer-product-discount">-${discountPercentage}%</div>
                    ${product.badge ? `<div class="offer-product-badge">${product.badge}</div>` : ''}

                    <div id="carousel-offer-${product.id}" class="carousel slide" data-bs-ride="${isIOS || isSafari ? 'false' : 'carousel'}">
                        <div class="carousel-indicators">
                            ${Array.isArray(product.images) ? product.images.map((_, i) => `
                                <button type="button" data-bs-target="#carousel-offer-${product.id}" data-bs-slide-to="${i}" 
                                    ${i === 0 ? 'class="active"' : ''}></button>
                            `).join('') : ''}
                        </div>
                        <div class="carousel-inner">
                            ${Array.isArray(product.images) ? product.images.map((img, i) => `
                                <div class="carousel-item ${i === 0 ? 'active' : ''}">
                                    <img src="${img}" class="d-block w-100" alt="${product.title}" height="300" loading="lazy" crossorigin="anonymous">
                                </div>
                            `).join('') : ''}
                        </div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#carousel-offer-${product.id}" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon"></span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#carousel-offer-${product.id}" data-bs-slide="next">
                            <span class="carousel-control-next-icon"></span>
                        </button>
                    </div>

                    <h4 class="offer-product-title">${product.title || 'No Title'}</h4>
                    <div class="offer-product-price">${(product.price || 0).toLocaleString()} DA</div>
                    <div class="offer-product-old-price">${(product.old_price || 0).toLocaleString()} DA</div>
                    <button class="offer-btn add-to-cart-btn" data-id="${product.id}">
                        <i class="bi bi-cart-plus"></i> Acheter maintenant
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============== إعداد نظام الفئات ==============
function setupCategoryFilters() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // إزالة النشط من جميع الأزرار
            document.querySelectorAll('.category-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // إضافة النشط للزر المحدد
            this.classList.add('active');
            
            // تصفية المنتجات حسب الفئة
            const category = this.dataset.category;
            loadAndDisplayProducts(category);
        });
    });
}

// ============== إعداد أزرار إضافة إلى السلة ==============
function setupAddToCartButtons() {
    // منع التهيئة المكررة لو تم استدعاء الدالة أكثر من مرة
    if (window.addToCartButtonsInitialized) return;
    window.addToCartButtonsInitialized = true;

    document.addEventListener('click', function(e) {
        // Fixed: Safari event handling with proper fallback
        const button = e.target.closest('.add-to-cart-btn');
        if (!button) return;

        // حماية مؤقتة لكل زر لمنع النقرات المتكررة السريعة
        if (button.dataset.processing === 'true') return;
        button.dataset.processing = 'true';
        setTimeout(() => { 
            delete button.dataset.processing; 
        }, 300);

        // Fixed: Safari preventDefault behavior
        if (e.preventDefault) {
            e.preventDefault();
        }
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const productId = button.getAttribute('data-id');
        if (!productId) {
            console.warn('add-to-cart button without data-id', button);
            return;
        }

        fetch('products.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load products.json');
                return response.json();
            })
            .then(products => {
                if (!Array.isArray(products)) {
                    throw new Error('Invalid products data');
                }
                
                const product = products.find(p => p.id == productId);
                if (product) {
                    addToCart(
                        product.title,
                        `${product.price.toLocaleString()} DA`,
                        product.price,
                        product.images,
                        product.id
                    );
                } else {
                    console.warn('Product not found for id', productId);
                    showStatus('Produit introuvable', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading product:', error);
                showStatus('Error loading product details', 'error');
            });
            
        return false; // Safari fallback
    });
}

// ============== إدارة سلة المشتريات ==============

// تحميل السلة من localStorage
function loadCart() {
    try {
        const cartData = localStorage.getItem('robuste_cart');
        if (cartData) {
            cart = JSON.parse(cartData);
        }
    } catch (e) {
        console.error('خطأ في تحميل سلة المشتريات:', e);
        cart = [];
    }
}

// تحديث عداد السلة
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartCount || !checkoutBtn) return;
    
    const count = Array.isArray(cart) ? cart.reduce((total, item) => total + (item.quantity || 0), 0) : 0;
    cartCount.textContent = count;
    checkoutBtn.disabled = count === 0;
    
    // Fixed: Safari disabled attribute handling
    if (count === 0) {
        checkoutBtn.setAttribute('disabled', 'disabled');
    } else {
        checkoutBtn.removeAttribute('disabled');
    }
}

// عرض محتويات السلة
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems || !cartTotal) return;
    
    // مسح المحتوى الحالي
    while (cartItems.firstChild) {
        cartItems.removeChild(cartItems.firstChild);
    }
    
    if (!Array.isArray(cart) || cart.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center py-4 text-muted';
        emptyDiv.id = 'emptyCartMessage';
        emptyDiv.innerHTML = '<i class="bi bi-cart-x display-4 d-block mb-2"></i>سلة المشتريات فارغة';
        cartItems.appendChild(emptyDiv);
        cartTotal.textContent = '0 د.ج';
        return;
    }
    
    let total = 0;
    cart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.dataset.id = item.id || '';
        
        itemElement.innerHTML = `
            <div class="d-flex">
                <img src="${item.image || ''}" alt="${item.name || 'منتج'}" class="cart-item-img me-3" crossorigin="anonymous">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name || 'منتج بدون اسم'}</div>
                    <div class="cart-item-price">${item.price || 0} د.ج</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" data-action="decrease" data-index="${index}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity || 1}" min="1" data-index="${index}">
                        <button class="quantity-btn" data-action="increase" data-index="${index}">+</button>
                    </div>
                </div>
                <button class="remove-item align-self-start" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        cartItems.appendChild(itemElement);
    });
    
    cartTotal.textContent = `${total.toLocaleString('ar-DZ')} د.ج`;
    
    // إضافة معالجي الأحداث بعد عرض العناصر
    attachCartEventListeners();
}

// إضافة معالجي الأحداث لعناصر السلة
function attachCartEventListeners() {
    // معالجة أزرار الكمية
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const index = parseInt(this.dataset.index);
            const action = this.dataset.action;
            
            if (isNaN(index) || index < 0 || index >= cart.length) return;
            
            if (action === 'increase') {
                updateQuantity(index, cart[index].quantity + 1);
            } else if (action === 'decrease') {
                updateQuantity(index, cart[index].quantity - 1);
            }
        });
    });
    
    // معالجة حقول الإدخال
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function(e) {
            const index = parseInt(this.dataset.index);
            if (isNaN(index) || index < 0 || index >= cart.length) return;
            
            const newQuantity = parseInt(this.value) || 1;
            updateQuantity(index, newQuantity);
        });
        
        // Fixed: Safari keyboard event handling
        input.addEventListener('keydown', function(e) {
            if (!/[\d\b\t\n]|Arrow|Delete|Backspace|Tab/.test(e.key) && 
                !(e.ctrlKey || e.metaKey)) {
                e.preventDefault();
            }
        });
        
        // Fixed: Safari input event for iOS
        if (isIOS) {
            input.addEventListener('input', function(e) {
                const index = parseInt(this.dataset.index);
                if (isNaN(index) || index < 0 || index >= cart.length) return;
                
                const newQuantity = parseInt(this.value) || 1;
                if (!isNaN(newQuantity)) {
                    updateQuantity(index, newQuantity);
                }
            });
        }
    });
    
    // معالجة أزرار الحذف
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const index = parseInt(this.dataset.index);
            if (isNaN(index) || index < 0 || index >= cart.length) return;
            
            removeFromCart(index);
        });
    });
}

// إضافة منتج إلى السلة - التصحيح هنا
function addToCart(productName, productPrice, priceValue, productImages, productId) {
    const name = typeof productName === 'string' ? productName : 'منتج بدون اسم';
    const price = typeof priceValue === 'number' ? priceValue : 
                 typeof productPrice === 'number' ? productPrice : 0;
    const id = productId || Date.now().toString();
    
    let image = '';
    if (Array.isArray(productImages) && productImages.length > 0) {
        image = productImages[0];
    } else if (typeof productImages === 'string') {
        image = productImages;
    }
    
    if (!Array.isArray(cart)) {
        cart = [];
    }
    
    const existingItemIndex = cart.findIndex(item => item.id === id);
    
    if (existingItemIndex >= 0) {
        // إذا المنتج موجود في السلة، نزيد الكمية بواحدة فقط
        cart[existingItemIndex].quantity += 1;
    } else {
        // إذا المنتج غير موجود، نضيفه بكمية واحدة فقط
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    // حفظ السلة في localStorage
    try {
        localStorage.setItem('robuste_cart', JSON.stringify(cart));
    } catch (e) {
        console.error('خطأ في حفظ السلة:', e);
        showStatus('تعذر حفظ السلة، قد تكون ذاكرة التخزين ممتلئة', 'error');
    }
    
    // تحديث الواجهة
    updateCartCount();
    renderCart();
    
    // إظهار تأكيد الإضافة
    showStatus(`تمت إضافة "${name}" إلى السلة`, 'success');
}

// تحديث كمية المنتج
function updateQuantity(index, newQuantity) {
    if (isNaN(index) || index < 0 || index >= cart.length) return;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    cart[index].quantity = newQuantity;
    
    try {
        localStorage.setItem('robuste_cart', JSON.stringify(cart));
    } catch (e) {
        console.error('خطأ في تحديث السلة:', e);
    }
    
    renderCart();
    updateCartCount();
}

// إزالة منتج من السلة
function removeFromCart(index) {
    if (isNaN(index) || index < 0 || index >= cart.length) return;
    
    const productName = cart[index].name || 'منتج';
    cart.splice(index, 1);
    
    try {
        localStorage.setItem('robuste_cart', JSON.stringify(cart));
    } catch (e) {
        console.error('خطأ في تحديث السلة:', e);
    }
    
    renderCart();
    updateCartCount();
    showStatus(`تمت إزالة "${productName}" من السلة`, 'success');
}

// إظهار/إخفاء السلة
function toggleCart() {
    if (!Array.isArray(cart) || cart.length === 0) {
        showStatus('سلة المشتريات فارغة', 'info');
        return;
    }
    
    try {
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    } catch (e) {
        console.error('خطأ في فتح السلة:', e);
        document.getElementById('cartOffcanvas').classList.add('show');
        document.body.classList.add('offcanvas-open');
    }
}

// ============== إتمام عملية الشراء من السلة ==============
function checkout() {
    if (!Array.isArray(cart) || cart.length === 0) {
        showStatus('سلة المشتريات فارغة', 'error');
        return;
    }
    
    // إخفاء سلة المشتريات
    const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
    if (cartOffcanvas) {
        cartOffcanvas.hide();
    }
    
    // إعداد بيانات الطلب
    const firstItem = cart[0];
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // ملء نموذج الطلب
    document.getElementById('productName').value = `${cart.length} منتجات مختلفة`;
    document.getElementById('productPriceValue').value = total;
    document.getElementById('productImageUrl').value = firstItem.image;
    
    document.getElementById('productNameDisplay').textContent = `${cart.length} منتجات مختلفة`;
    document.getElementById('productPrice').textContent = `${total.toLocaleString()} DA`;
    document.getElementById('productImage').src = firstItem.image;
    
    // إعادة تعيين النموذج
    document.getElementById('orderForm').reset();
    document.getElementById('cashOnDelivery').checked = true;
    
    // إظهار نموذج الطلب
    if (orderModal) {
        orderModal.show();
    }
}

// ============== وظائف الطلب ==============

// إرسال الطلب
async function submitOrder() {
    if (!db) {
        showStatus('Firebase غير متوفر. تحقق من الاتصال بالإنترنت.', 'error');
        return;
    }
    
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPriceValue').value;
    const productImage = document.getElementById('productImageUrl').value;
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value || 'لم يتم تقديمه';
    const wilaya = document.getElementById('wilaya').value;
    const address = document.getElementById('address').value || 'غير محدد';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!paymentMethod) {
        showStatus('يرجى اختيار طريقة الدفع', 'error');
        return;
    }
    
    // التحقق من صحة البيانات
    if (!fullName || !phone || !wilaya) {
        showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const phoneRegex = /^0[5-7][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
        showStatus('رقم الهاتف غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 05 أو 06 أو 07', 'error');
        return;
    }
    
    // حساب المجموع الكلي
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // إعداد بيانات الطلب
    const orderData = {
        products: cart,
        customer: fullName,
        phone: phone,
        email: email,
        wilaya: wilaya,
        address: address,
        payment: paymentMethod.value,
        totalPrice: total,
        timestamp: new Date().toISOString(),
        status: 'جديد'
    };
    
    // عرض حالة التحميل
    showStatus('جاري معالجة طلبك...', 'loading');
    
    // تعطيل زر الإرسال أثناء المعالجة
    const submitBtn = document.getElementById('submitOrderBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        جاري المعالجة...
    `;
    
    try {
        // تخزين الطلب في Firebase
        const docRef = await db.collection('orders').add(orderData);
        console.log("تم تخزين الطلب في Firebase:", docRef.id);
        
        // إنشاء قائمة المنتجات للبريد الإلكتروني
        const productsList = cart.map(item => `
            <div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee;">
                <strong>المنتج:</strong> ${item.name} <br>
                <strong>الكمية:</strong> ${item.quantity} <br>
                <strong>السعر:</strong> ${item.price.toLocaleString()} د.ج <br>
                <strong>المجموع:</strong> ${(item.price * item.quantity).toLocaleString()} د.ج
            </div>
        `).join('');
        
        // إرسال إيميل عبر EmailJS
        if (typeof emailjs !== 'undefined') {
            await emailjs.send("service_lc1q5k8", "template_a15g7yg", {
                order_id: docRef.id,
                customer_name: fullName,
                customer_phone: phone,
                customer_email: email,
                wilaya: wilaya,
                address: address,
                total_price: total.toLocaleString(),
                payment_method: paymentMethod.value,
                order_date: new Date().toLocaleString('ar-DZ'),
                products: productsList
            });
            console.log("تم إرسال إيميل تأكيد الطلب");
        }
        
        // عرض رسالة النجاح
        showStatus(`
            <div class="text-center">
                <i class="bi bi-check-circle-fill text-success fs-1"></i>
                <h5 class="mt-2">تم تأكيد طلبك بنجاح!</h5>
                <div class="text-start mt-3">
                    <p><strong>رقم الطلب:</strong> ${docRef.id}</p>
                    <p><strong>الاسم:</strong> ${fullName}</p>
                    <p><strong>عدد المنتجات:</strong> ${cart.length} منتجات</p>
                    <p><strong>المبلغ الإجمالي:</strong> ${total.toLocaleString()} د.ج</p>
                    <p class="mt-3">سيتم التواصل معك على الرقم <strong>${phone}</strong> خلال 24 ساعة لتأكيد الشحن.</p>
                </div>
                <a href="https://wa.me/213656360457?text=${encodeURIComponent(
                    `استفسار عن الطلب ${docRef.id}\nالاسم: ${fullName}\nعدد المنتجات: ${cart.length}\nالمجموع: ${total.toLocaleString()} د.ج\nرقم الهاتف: ${phone}`
                )}" class="btn whatsapp-contact-btn mt-2 w-100" target="_blank">
                    <i class="bi bi-whatsapp"></i> تواصل عبر واتساب (اختياري)
                </a>
            </div>
        `, 'success');
        
        // تفريغ السلة وإعادة تعيين النموذج
        cart = [];
        localStorage.removeItem('robuste_cart');
        updateCartCount();
        document.getElementById('orderForm').reset();
        if (orderModal) {
            orderModal.hide();
        }
        
    } catch (error) {
        console.error('حدث خطأ:', error);
        
        let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        if (error.code) {
            errorMessage = `خطأ في النظام: ${error.code}`;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.text) {
            errorMessage = error.text;
        }
        
        showStatus(`حدث خطأ أثناء إرسال الطلب: ${errorMessage}`, 'error');
    } finally {
        // إعادة تمكين زر الإرسال
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============== وظائف الاتصال ==============

// إرسال رسالة الاتصال
async function sendContactMessage() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value || 'لم يتم تقديمه';
    const message = document.getElementById('contactMessage').value;
    
    if (!name || !email || !message) {
        showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // عرض حالة التحميل
    const contactSpinner = document.getElementById('contactSpinner');
    const contactSubmitText = document.getElementById('contactSubmitText');
    const originalContactText = contactSubmitText.textContent;
    
    if (contactSpinner) contactSpinner.classList.remove('d-none');
    contactSubmitText.textContent = 'جاري الإرسال...';
    
    try {
        // إرسال رسالة الاتصال عبر EmailJS
        if (typeof emailjs !== 'undefined') {
            await emailjs.send("service_lc1q5k8", "template_11pkq0k", {
                from_name: name,
                from_email: email,
                phone_number: phone,
                message: message
            });
            
            console.log("تم إرسال رسالة الاتصال");
            
            showStatus('تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً.', 'success');
            document.getElementById('contactForm').reset();
        } else {
            showStatus('نظام البريد غير متوفر حالياً', 'error');
        }
    } catch (error) {
        console.error('حدث خطأ:', error);
        
        let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        if (error.code) {
            errorMessage = `خطأ في النظام: ${error.code}`;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.text) {
            errorMessage = error.text;
        }
        
        showStatus(`حدث خطأ أثناء إرسال الرسالة: ${errorMessage}`, 'error');
    } finally {
        // إعادة تمكين زر الإرسال
        if (contactSpinner) contactSpinner.classList.add('d-none');
        contactSubmitText.textContent = originalContactText;
    }
}

// ============== وظائف مساعدة ==============

// تعبئة قائمة الولايات
function populateWilayas() {
    const wilayaSelect = document.getElementById('wilaya');
    if (!wilayaSelect) return;
    
    wilayaSelect.innerHTML = '<option value="">اختر الولاية</option>';
    
    wilayas.forEach(wilaya => {
        const option = document.createElement('option');
        option.value = wilaya;
        option.textContent = wilaya;
        wilayaSelect.appendChild(option);
    });
}

// بدء مؤقت العرض الخاص
function startOfferTimer() {
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;
    
    // تاريخ انتهاء العرض (3 أيام من الآن)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    
    function updateTimer() {
        const now = new Date();
        const difference = endDate - now;
        
        if (difference <= 0) {
            // انتهى الوقت
            daysElement.textContent = '00';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            return;
        }
        
        // حساب الأيام، الساعات، الدقائق، الثواني
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // تحديث العناصر
        daysElement.textContent = days.toString().padStart(2, '0');
        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    // Fixed: Safari timer throttling workaround
    updateTimer();
    
    // Use requestAnimationFrame for better performance in Safari
    function tick() {
        updateTimer();
        if (document.getElementById('specialOffersSection') && 
            getComputedStyle(document.getElementById('specialOffersSection')).display !== 'none') {
            requestAnimationFrame(tick);
        }
    }
    
    // Start animation frame loop
    let animationId = requestAnimationFrame(function loop() {
        tick();
        animationId = requestAnimationFrame(loop);
    });
    
    // Stop when page is hidden
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animationId = requestAnimationFrame(loop);
        }
    });
}

// عرض حالة الطلب
function showStatus(message, type) {
    const indicator = document.getElementById('statusIndicator');
    const messageElement = document.getElementById('statusMessage');
    
    if (!indicator || !messageElement) return;
    
    // إعداد الرسالة
    messageElement.innerHTML = message;
    
    // إعداد التصميم حسب النوع
    const alert = indicator.querySelector('.alert');
    if (!alert) return;
    
    alert.className = 'alert alert-dismissible fade show';
    
    switch (type) {
        case 'success':
            alert.classList.add('alert-success', 'order-confirmation');
            break;
        case 'error':
            alert.classList.add('alert-danger', 'order-error');
            break;
        case 'loading':
            alert.classList.add('alert-info');
            messageElement.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                ${message}
            `;
            break;
        default:
            alert.classList.add('alert-info');
    }
    
    // إظهار المؤشر
    indicator.style.display = 'block';
    
    // Fixed: Safari CSS transition handling
    setTimeout(() => {
        indicator.style.opacity = '1';
    }, 10);
    
    // إخفاء التلقائي لرسائل النجاح بعد 5 ثواني
    if (type === 'success') {
        setTimeout(hideStatus, 5000);
    }
}

// إخفاء مؤشر الحالة
function hideStatus() {
    const indicator = document.getElementById('statusIndicator');
    if (!indicator) return;
    
    indicator.style.opacity = '0';
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 300);
}

// ============== السلايدر ==============
let slideIndex1 = 1;
let slideInterval1;

function showSlides1(n) {
  const slides = document.getElementsByClassName("mySlides1");
  const dots = document.getElementsByClassName("dot1");

  if (!slides.length || !dots.length) return;

  if (n > slides.length) slideIndex1 = 1;
  if (n < 1) slideIndex1 = slides.length;

  for (let s of slides) s.style.display = "none";
  for (let d of dots) d.className = d.className.replace(" active", "");

  slides[slideIndex1 - 1].style.display = "block";
  dots[slideIndex1 - 1].className += " active";
}

// التحكم بالأزرار
function plusSlides1(n) {
  showSlides1(slideIndex1 += n);
}

// التحكم بالنقاط
function currentSlide1(n) {
  showSlides1(slideIndex1 = n);
}

// Fixed: Safari autoplay restrictions
function startSlideshow() {
  if (slideInterval1) clearInterval(slideInterval1);
  
  // Check if user has interacted with page (Safari requirement)
  if (document.visibilityState === 'visible') {
    slideInterval1 = setInterval(() => {
      plusSlides1(1);
    }, 4000);
  }
}

// ============== وظيفة تبديل وضع الظلام ==============
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // تغيير السمة
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // تحديث أيقونة الزر
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        if (newTheme === 'dark') {
            themeIcon.className = 'bi bi-sun';
            themeIcon.parentElement.title = 'تفعيل وضع النهار';
        } else {
            themeIcon.className = 'bi bi-moon';
            themeIcon.parentElement.title = 'تفعيل وضع الظلام';
        }
    }
    
    // حفظ التفضيل في localStorage
    try {
        localStorage.setItem('theme', newTheme);
    } catch (e) {
        console.warn('Could not save theme preference:', e);
    }
}

// تهيئة وضع الظلام عند تحميل الصفحة
function initDarkMode() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        if (savedTheme === 'dark') {
            themeIcon.className = 'bi bi-sun';
            themeIcon.parentElement.title = 'تفعيل وضع النهار';
        } else {
            themeIcon.className = 'bi bi-moon';
            themeIcon.parentElement.title = 'تفعيل وضع الظلام';
        }
    }
    
    // Fixed: Safari event listener
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
}

// ============== تهيئة الصفحة الرئيسية ==============
function initializePage() {
    try {
        initDarkMode();
        
        // Load cart first
        loadCart();
        
        // Initialize components
        loadAndDisplayProducts();
        setupCategoryFilters();
        setupAddToCartButtons();
        loadSpecialOffers();
        populateWilayas();
        startOfferTimer();
        
        // Initialize modals
        if (typeof bootstrap !== 'undefined') {
            const orderModalElement = document.getElementById('orderModal');
            if (orderModalElement) {
                orderModal = new bootstrap.Modal(orderModalElement);
            }
            
            // Initialize offcanvas
            const cartOffcanvas = document.getElementById('cartOffcanvas');
            if (cartOffcanvas) {
                new bootstrap.Offcanvas(cartOffcanvas);
            }
        }
        
        // Setup form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                sendContactMessage();
            });
        }
        
        // Update cart UI
        updateCartCount();
        renderCart();
        
        // Initialize sliders
        showSlides1(slideIndex1);
        
        // Start slideshow after user interaction (Safari requirement)
        document.addEventListener('click', function firstInteraction() {
            startSlideshow();
            document.removeEventListener('click', firstInteraction);
        }, { once: true });
        
        // Also start on touch events for mobile Safari
        if (isIOS || isSafari) {
            document.addEventListener('touchstart', function firstTouch() {
                startSlideshow();
                document.removeEventListener('touchstart', firstTouch);
            }, { once: true });
        }
        
        console.log('Page initialized successfully');
        
    } catch (error) {
        console.error('Error during page initialization:', error);
    }
}

// Fixed: Safari DOMContentLoaded handling
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    // DOM already loaded
    setTimeout(initializePage, 100);
}

// Fixed: Safari visibility change handling
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Restart timers when page becomes visible
        if (slideInterval1) {
            clearInterval(slideInterval1);
            startSlideshow();
        }
    }
});

// Fixed: Safari page unload handling
window.addEventListener('pagehide', function() {
    // Clean up intervals
    if (slideInterval1) {
        clearInterval(slideInterval1);
    }
});

// Fixed: Safari back/forward cache handling
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page loaded from bfcache
        location.reload();
    }
});

// ============== تكييف حجم نموذج الطلب للأجهزة الصغيرة ==============
function adjustOrderModalForMobile() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768 || isIOS;
    
    if (isMobile) {
        modal.classList.add('mobile-optimized');
        
        // Adjust input fields for iOS
        if (isIOS) {
            document.querySelectorAll('#orderForm input, #orderForm select, #orderForm textarea').forEach(input => {
                input.style.fontSize = '16px'; // Prevent zoom on iOS
            });
        }
    }
}

// Setup modal adjustment
document.addEventListener('DOMContentLoaded', function() {
    const orderModalElement = document.getElementById('orderModal');
    
    if (orderModalElement) {
        orderModalElement.addEventListener('show.bs.modal', function() {
            setTimeout(adjustOrderModalForMobile, 50);
        });
        
        // Adjust on resize
        window.addEventListener('resize', adjustOrderModalForMobile);
    }
});

// Fixed: Safari touch event improvements
if ('ontouchstart' in window) {
    // Improve touch responsiveness
    document.documentElement.style.touchAction = 'manipulation';
    
    // Remove tap highlight
    document.documentElement.style.webkitTapHighlightColor = 'transparent';
}

// Fixed: Safari CSS variable fallback
if (isSafari) {
    // Ensure CSS variables are supported
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --primary: #ff6b35;
            --primary-dark: #e55a2b;
            --secondary: #6c757d;
            --light: #f8f9fa;
            --dark: #343a40;
        }
        
        [data-theme="dark"] {
            --light: #212529;
            --dark: #f8f9fa;
        }
    `;
    document.head.appendChild(style);
}

// Fixed: Safari console errors suppression for production
if (window.location.hostname !== 'localhost') {
    // Suppress non-critical console errors in production
    const originalError = console.error;
    console.error = function(...args) {
        // Filter out Safari-specific non-critical errors
        const errorMsg = args[0] ? args[0].toString() : '';
        const safariErrors = [
            'SecurityError',
            'NotAllowedError',
            'NS_ERROR_FAILURE',
            'QuotaExceededError'
        ];
        
        if (!safariErrors.some(err => errorMsg.includes(err))) {
            originalError.apply(console, args);
        }
    };
}

// Export functions for global access (Safari debugging)
window.appDebug = {
    reloadCart: function() {
        loadCart();
        updateCartCount();
        renderCart();
        return 'Cart reloaded';
    },
    clearStorage: function() {
        localStorage.clear();
        cart = [];
        updateCartCount();
        renderCart();
        return 'Storage cleared';
    },
    testFirebase: function() {
        if (db) {
            return 'Firestore available';
        }
        return 'Firestore not available';
    },
    safariInfo: function() {
        return {
            userAgent: navigator.userAgent,
            isSafari: isSafari,
            isIOS: isIOS,
            isMac: isMac,
            localStorage: typeof localStorage,
            firebase: typeof firebase,
            bootstrap: typeof bootstrap
        };
    }
};

console.log('Main.js loaded successfully for Safari compatibility');
