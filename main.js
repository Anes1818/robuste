(function() {
    'use strict';

    // ============== تهيئة Firebase ==============
    const firebaseConfig = {
        apiKey: "AIzaSyBTrnKCYOtfSSDYtmVQbzP2HcwgkLT565Y",
        authDomain: "robuste-c8e0f.firebaseapp.com",
        projectId: "robuste-c8e0f",
        storageBucket: "robuste-c8e0f.appspot.com",
        messagingSenderId: "975609984963",
        appId: "1:975609984963:web:a481efb493a88d7bc7af76",
        measurementId: "G-DWT7MZN028"
    };

    // تهيئة Firebase
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        firebase.initializeApp(firebaseConfig);
        var db = firebase.firestore();
    }

    // تهيئة EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init("k77vdaUWPpnLrfTnS");
    }

    // قائمة الولايات الجزائرية
    var wilayas = [
        "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة",
        "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل",
        "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم",
        "المسيلة", "معسكر", "ورقلة", "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف",
        "تيندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة",
        "عين تموشنت", "غرداية", "غليزان"
    ];

    // ============== المتغيرات العامة ==============
    var orderModal = null;
    var cart = [];
    var touchStartTime = 0;
    var touchStartX = 0;
    var touchStartY = 0;
    var lastTapTime = 0;
    var lastTapTarget = null;
    var isScrolling = false;
    var scrollTimeout;

    // ============== نظام المنتجات الديناميكي ==============

    // دالة جلب وعرض المنتجات من JSON
    function loadAndDisplayProducts(category) {
        if (!category) category = 'all';
        
        fetch('products.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des produits');
                }
                return response.json();
            })
            .then(function(products) {
                // تصفية المنتجات حسب الفئة
                var filteredProducts;
                if (category === 'all') {
                    filteredProducts = products;
                } else {
                    filteredProducts = products.filter(function(product) {
                        return product.category === category;
                    });
                }
                
                renderProducts(filteredProducts);
                setupProductCardTaps(); // إعداد النقرات بعد عرض المنتجات
            })
            .catch(function(error) {
                console.error('Erreur:', error);
                showStatus('Erreur lors du chargement des produits', 'error');
            });
    }

    // دالة عرض المنتجات
    function renderProducts(products) {
        var container = document.getElementById('productsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (products.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">Aucun produit trouvé</div>';
            return;
        }
        
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var discountBadge = '';
            var oldPrice = '';
            var productBadge = '';
            
            if (product.old_price && product.old_price > product.price) {
                var discountPercentage = Math.round(((product.old_price - product.price) / product.old_price) * 100);
                discountBadge = '<div class="discount-badge">خصم ' + discountPercentage + '%</div>';
                oldPrice = '<small dir="ltr" class="text-decoration-line-through text-muted me-2">' + product.old_price.toLocaleString() + ' DA</small>';
            }
            
            if (product.badge) {
                productBadge = '<div class="product-badge">' + product.badge + '</div>';
            }
            
            // إنشاء سلايدر للصور
            var carouselIndicators = '';
            var carouselItems = '';
            var carouselControls = '';
            
            for (var j = 0; j < product.images.length; j++) {
                carouselIndicators += '<button type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide-to="' + j + '" ' + 
                    (j === 0 ? 'class="active" aria-current="true"' : '') + 
                    ' aria-label="صورة ' + (j + 1) + '"></button>';
                
                carouselItems += '<div class="carousel-item ' + (j === 0 ? 'active' : '') + '">' +
                    '<img src="' + product.images[j] + '" class="d-block w-100" alt="' + product.title + '" loading="lazy">' +
                    '</div>';
            }
            
            if (product.images.length > 1) {
                carouselControls = '<button class="carousel-control-prev" type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide="prev">' +
                    '<span class="carousel-control-prev-icon" aria-hidden="true"></span>' +
                    '<span class="visually-hidden">السابق</span>' +
                    '</button>' +
                    '<button class="carousel-control-next" type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide="next">' +
                    '<span class="carousel-control-next-icon" aria-hidden="true"></span>' +
                    '<span class="visually-hidden">التالي</span>' +
                    '</button>';
            }
            
            var productCard = '<div class="col-6 col-md-4 col-lg-3 mb-4">' +
                '<div class="product-card card h-100 position-relative" role="link" tabindex="0" data-pid="' + product.id + '">' +
                '<div class="product-card-tap-area">' + // إضافة منطقة النقر
                productBadge + discountBadge +
                '<div id="carousel-' + product.id + '" class="carousel slide product-carousel" data-bs-ride="carousel">' +
                '<div class="carousel-indicators">' + carouselIndicators + '</div>' +
                '<div class="carousel-inner">' + carouselItems + '</div>' +
                carouselControls +
                '</div>' +
                '<div class="card-body">' +
                '<h5 class="product-title card-title">' + product.title + '</h5>' +
                '<p class="card-text text-muted small">' + product.description_short + '</p>' +
                '<div class="price-section d-flex align-items-center mt-2">' +
                oldPrice +
                '<p dir="ltr" class="current-price fw-bold mb-0">' + product.price.toLocaleString() + ' DA</p>' +
                '</div>' +
                '</div>' +
                '</div>' + // نهاية منطقة النقر
                '<div class="card-footer bg-transparent border-0 pt-0">' +
                '<button class="btn btn-orange w-100 add-to-cart-btn" data-id="' + product.id + '" aria-label="Ajouter ' + product.title + ' au panier">' +
                '<i class="bi bi-cart-plus"></i>&nbsp;Ajouter au panier' +
                '</button>' +
                '</div>' +
                '</div>' +
                '</div>';
            
            container.innerHTML += productCard;
        }
    }

    // ============== نظام النقر السلس للبطاقات ==============
    function setupProductCardTaps() {
        var productCards = document.querySelectorAll('.product-card');
        
        for (var i = 0; i < productCards.length; i++) {
            var card = productCards[i];
            
            // إعداد خصائص CSS لللمس
            card.style.cursor = 'pointer';
            card.style.userSelect = 'none';
            card.style.webkitTapHighlightColor = 'transparent';
            
            // إعداد معالجات اللمس
            setupTouchHandlersForCard(card);
            
            // إعداد معالج النقر
            card.addEventListener('click', handleProductCardClick);
            
            // إعداد معالج الضغط على المفتاح
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToProductPage(this);
                }
            });
        }
    }

    function setupTouchHandlersForCard(card) {
        var tapArea = card.querySelector('.product-card-tap-area');
        if (!tapArea) return;
        
        tapArea.style.cursor = 'pointer';
        tapArea.style.userSelect = 'none';
        tapArea.style.webkitTapHighlightColor = 'transparent';
        tapArea.style.position = 'relative';
        tapArea.style.zIndex = '1';
        
        var startX, startY, startTime;
        var moved = false;
        
        card.addEventListener('touchstart', function(e) {
            if (isScrolling) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            moved = false;
            
            // إضافة تأثير اللمس
            this.classList.add('product-card-touch');
            
            // منع السلوك الافتراضي للنقر
            e.preventDefault();
        }, { passive: false });
        
        card.addEventListener('touchmove', function(e) {
            if (!startX || !startY) return;
            
            var currentX = e.touches[0].clientX;
            var currentY = e.touches[0].clientY;
            
            // إذا تحرك المستخدم كثيراً، نعتبره تمريراً وليس نقراً
            if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) {
                moved = true;
                this.classList.remove('product-card-touch');
            }
        }, { passive: true });
        
        card.addEventListener('touchend', function(e) {
            var endTime = Date.now();
            
            // إزالة تأثير اللمس
            this.classList.remove('product-card-touch');
            
            // إذا لم يتحرك وكان الوقت قصيراً (أقل من 500ms)
            if (!moved && (endTime - startTime) < 500) {
                e.preventDefault();
                e.stopPropagation();
                
                // تجنب النقرات المزدوجة
                var currentTime = Date.now();
                if (currentTime - lastTapTime < 500 && this === lastTapTarget) {
                    return;
                }
                
                lastTapTime = currentTime;
                lastTapTarget = this;
                
                // تأخير بسيط لتحسين الاستجابة
                setTimeout(function(card) {
                    navigateToProductPage(card);
                }.bind(null, this), 50);
            }
        }, { passive: false });
        
        card.addEventListener('touchcancel', function() {
            this.classList.remove('product-card-touch');
        });
    }

    function handleProductCardClick(e) {
        // إذا كان النقر على زر إضافة للسلة، نتجاهله
        if (e.target.closest('.add-to-cart-btn')) {
            return;
        }
        
        // إذا كان النقر على عناصر تحكم السلايدر، نتجاهله
        if (e.target.closest('.carousel-control-prev') || 
            e.target.closest('.carousel-control-next') ||
            e.target.closest('.carousel-indicators')) {
            return;
        }
        
        navigateToProductPage(this);
    }

    function navigateToProductPage(card) {
        var productId = card.getAttribute('data-pid');
        if (productId) {
            window.location.href = 'product.html?pid=' + encodeURIComponent(productId);
        }
    }

    // دالة تحميل العروض الخاصة
    function loadSpecialOffers() {
        fetch('products.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des produits');
                }
                return response.json();
            })
            .then(function(products) {
                var specialOffers = [];
                for (var i = 0; i < products.length; i++) {
                    var product = products[i];
                    if (product.old_price && product.old_price > product.price) {
                        specialOffers.push(product);
                        if (specialOffers.length >= 3) break;
                    }
                }
                renderSpecialOffers(specialOffers);
            })
            .catch(function(error) {
                console.error('Erreur lors du chargement des offres spéciales:', error);
            });
    }

    // دالة عرض العروض الخاصة
    function renderSpecialOffers(offers) {
        var offersContainer = document.getElementById('specialOffersContainer');
        if (!offersContainer) return;
        
        if (offers.length === 0) {
            offersContainer.innerHTML = '<div class="col-12 text-center text-muted">Aucune offre spéciale pour le moment</div>';
            return;
        }
        
        offersContainer.innerHTML = '';
        
        for (var i = 0; i < offers.length; i++) {
            var product = offers[i];
            var discountPercentage = Math.round(((product.old_price - product.price) / product.old_price) * 100);
            
            var carouselIndicators = '';
            var carouselItems = '';
            
            for (var j = 0; j < product.images.length; j++) {
                carouselIndicators += '<button type="button" data-bs-target="#carousel-offer-' + product.id + '" data-bs-slide-to="' + j + '" ' + 
                    (j === 0 ? 'class="active"' : '') + '></button>';
                
                carouselItems += '<div class="carousel-item ' + (j === 0 ? 'active' : '') + '">' +
                    '<img src="' + product.images[j] + '" class="d-block w-100" alt="' + product.title + '" height="300" loading="lazy">' +
                    '</div>';
            }
            
            var productBadge = product.badge ? '<div class="offer-product-badge">' + product.badge + '</div>' : '';
            
            var offerHTML = '<div class="col-md-4">' +
                '<div class="offer-product">' +
                '<div class="offer-product-discount">-' + discountPercentage + '%</div>' +
                productBadge +
                '<div id="carousel-offer-' + product.id + '" class="carousel slide" data-bs-ride="carousel">' +
                '<div class="carousel-indicators">' + carouselIndicators + '</div>' +
                '<div class="carousel-inner">' + carouselItems + '</div>' +
                '<button class="carousel-control-prev" type="button" data-bs-target="#carousel-offer-' + product.id + '" data-bs-slide="prev">' +
                '<span class="carousel-control-prev-icon"></span>' +
                '</button>' +
                '<button class="carousel-control-next" type="button" data-bs-target="#carousel-offer-' + product.id + '" data-bs-slide="next">' +
                '<span class="carousel-control-next-icon"></span>' +
                '</button>' +
                '</div>' +
                '<h4 class="offer-product-title">' + product.title + '</h4>' +
                '<div class="offer-product-price">' + product.price.toLocaleString() + ' DA</div>' +
                '<div class="offer-product-old-price">' + product.old_price.toLocaleString() + ' DA</div>' +
                '<button class="offer-btn add-to-cart-btn" data-id="' + product.id + '">' +
                '<i class="bi bi-cart-plus"></i> Acheter maintenant' +
                '</button>' +
                '</div>' +
                '</div>';
            
            offersContainer.innerHTML += offerHTML;
        }
    }

    // ============== إعداد نظام الفئات ==============
    function setupCategoryFilters() {
        var categoryBtns = document.querySelectorAll('.category-btn');
        for (var i = 0; i < categoryBtns.length; i++) {
            categoryBtns[i].addEventListener('touchend', handleCategoryClick, { passive: true });
            categoryBtns[i].addEventListener('click', handleCategoryClick);
        }
    }

    function handleCategoryClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var currentTime = Date.now();
        if (currentTime - lastTapTime < 500 && this === lastTapTarget) {
            return;
        }
        
        lastTapTime = currentTime;
        lastTapTarget = this;
        
        var categoryBtns = document.querySelectorAll('.category-btn');
        for (var i = 0; i < categoryBtns.length; i++) {
            categoryBtns[i].classList.remove('active');
        }
        
        this.classList.add('active');
        
        var category = this.getAttribute('data-category');
        loadAndDisplayProducts(category);
        
        if (e.type === 'touchend') {
            this.classList.add('active-touch');
            setTimeout(function(btn) {
                btn.classList.remove('active-touch');
            }.bind(null, this), 200);
        }
    }

    // ============== إعداد أزرار إضافة إلى السلة ==============
    function setupAddToCartButtons() {
        if (setupAddToCartButtons._initialized) return;
        setupAddToCartButtons._initialized = true;

        // استخدام event delegation لجميع أزرار إضافة إلى السلة
        document.addEventListener('touchend', handleAddToCart, { passive: false });
        document.addEventListener('click', handleAddToCart);
    }

    function handleAddToCart(e) {
        var button = null;
        
        // البحث عن زر add-to-cart-btn
        if (e.target.matches('.add-to-cart-btn')) {
            button = e.target;
        } else if (e.target.closest('.add-to-cart-btn')) {
            button = e.target.closest('.add-to-cart-btn');
        }
        
        if (!button) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        if (button.getAttribute('data-processing') === 'true') return;
        button.setAttribute('data-processing', 'true');
        
        setTimeout(function() {
            button.removeAttribute('data-processing');
        }, 300);
        
        var productId = button.getAttribute('data-id');
        if (!productId) {
            console.warn('add-to-cart button without data-id', button);
            return;
        }
        
        fetch('products.json')
            .then(function(response) {
                if (!response.ok) throw new Error('Failed to load products.json');
                return response.json();
            })
            .then(function(products) {
                var product = null;
                for (var i = 0; i < products.length; i++) {
                    if (products[i].id == productId) {
                        product = products[i];
                        break;
                    }
                }
                if (product) {
                    addToCart(
                        product.title,
                        product.price.toLocaleString() + ' DA',
                        product.price,
                        product.images,
                        product.id
                    );
                } else {
                    console.warn('Product not found for id', productId);
                    showStatus('Produit introuvable', 'error');
                }
            })
            .catch(function(error) {
                console.error('Error loading product:', error);
                showStatus('Error loading product details', 'error');
            });
    }

    // ============== إدارة سلة المشتريات ==============

    // تحميل السلة من localStorage
    function loadCart() {
        try {
            var cartData = localStorage.getItem('robuste_cart');
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
        var cartCount = document.getElementById('cartCount');
        var checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!cartCount || !checkoutBtn) return;
        
        var count = 0;
        for (var i = 0; i < cart.length; i++) {
            count += cart[i].quantity || 0;
        }
        cartCount.textContent = count;
        checkoutBtn.disabled = count === 0;
    }

    // عرض محتويات السلة
    function renderCart() {
        var cartItems = document.getElementById('cartItems');
        var cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems || !cartTotal) return;
        
        // مسح المحتوى الحالي
        while (cartItems.firstChild) {
            cartItems.removeChild(cartItems.firstChild);
        }
        
        if (cart.length === 0) {
            var emptyDiv = document.createElement('div');
            emptyDiv.className = 'text-center py-4 text-muted';
            emptyDiv.id = 'emptyCartMessage';
            emptyDiv.innerHTML = '<i class="bi bi-cart-x display-4 d-block mb-2"></i>سلة المشتريات فارغة';
            cartItems.appendChild(emptyDiv);
            cartTotal.textContent = '0 د.ج';
            return;
        }
        
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            var itemTotal = (item.price || 0) * (item.quantity || 0);
            total += itemTotal;
            
            var itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.setAttribute('data-id', item.id || '');
            
            itemElement.innerHTML = '<div class="d-flex">' +
                '<img src="' + (item.image || '') + '" alt="' + (item.name || 'منتج') + '" class="cart-item-img me-3" loading="lazy">' +
                '<div class="cart-item-details">' +
                '<div class="cart-item-title">' + (item.name || 'منتج بدون اسم') + '</div>' +
                '<div class="cart-item-price">' + (item.price || 0) + ' د.ج</div>' +
                '<div class="quantity-controls">' +
                '<button class="quantity-btn" data-action="decrease" data-index="' + i + '">-</button>' +
                '<input type="number" class="quantity-input" value="' + (item.quantity || 1) + '" min="1" data-index="' + i + '" pattern="[0-9]*" inputmode="numeric">' +
                '<button class="quantity-btn" data-action="increase" data-index="' + i + '">+</button>' +
                '</div>' +
                '</div>' +
                '<button class="remove-item align-self-start" data-index="' + i + '">' +
                '<i class="bi bi-trash"></i>' +
                '</button>' +
                '</div>';
            
            cartItems.appendChild(itemElement);
        }
        
        cartTotal.textContent = total.toLocaleString('ar-DZ') + ' د.ج';
        
        // إضافة معالجي الأحداث بعد عرض العناصر
        attachCartEventListeners();
    }

    // إضافة معالجي الأحداث لعناصر السلة
    function attachCartEventListeners() {
        var quantityBtns = document.querySelectorAll('.quantity-btn');
        for (var i = 0; i < quantityBtns.length; i++) {
            quantityBtns[i].addEventListener('touchend', handleQuantityTouch, { passive: false });
            quantityBtns[i].addEventListener('click', handleQuantityClick);
        }
        
        var quantityInputs = document.querySelectorAll('.quantity-input');
        for (var j = 0; j < quantityInputs.length; j++) {
            quantityInputs[j].addEventListener('change', handleQuantityChange);
            quantityInputs[j].addEventListener('blur', handleQuantityBlur);
            quantityInputs[j].addEventListener('touchstart', function(e) {
                e.stopPropagation();
            });
        }
        
        var removeBtns = document.querySelectorAll('.remove-item');
        for (var k = 0; k < removeBtns.length; k++) {
            removeBtns[k].addEventListener('touchend', handleRemoveTouch, { passive: false });
            removeBtns[k].addEventListener('click', handleRemoveClick);
        }
    }

    function handleQuantityTouch(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var index = parseInt(this.getAttribute('data-index'), 10);
        var action = this.getAttribute('data-action');
        
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        if (action === 'increase') {
            updateQuantity(index, cart[index].quantity + 1);
        } else if (action === 'decrease') {
            updateQuantity(index, cart[index].quantity - 1);
        }
        
        this.classList.add('active-touch');
        setTimeout(function(btn) {
            btn.classList.remove('active-touch');
        }.bind(null, this), 200);
    }

    function handleQuantityClick(e) {
        e.preventDefault();
        
        var index = parseInt(this.getAttribute('data-index'), 10);
        var action = this.getAttribute('data-action');
        
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        if (action === 'increase') {
            updateQuantity(index, cart[index].quantity + 1);
        } else if (action === 'decrease') {
            updateQuantity(index, cart[index].quantity - 1);
        }
    }

    function handleQuantityChange(e) {
        var index = parseInt(this.getAttribute('data-index'), 10);
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        var newQuantity = parseInt(this.value, 10) || 1;
        updateQuantity(index, newQuantity);
    }

    function handleQuantityBlur(e) {
        var index = parseInt(this.getAttribute('data-index'), 10);
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        var newQuantity = parseInt(this.value, 10) || 1;
        if (newQuantity < 1) {
            this.value = cart[index].quantity;
        }
    }

    function handleRemoveTouch(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var index = parseInt(this.getAttribute('data-index'), 10);
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        removeFromCart(index);
        
        this.classList.add('active-touch');
        setTimeout(function(btn) {
            btn.classList.remove('active-touch');
        }.bind(null, this), 200);
    }

    function handleRemoveClick(e) {
        e.preventDefault();
        
        var index = parseInt(this.getAttribute('data-index'), 10);
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        removeFromCart(index);
    }

    // إضافة منتج إلى السلة
    function addToCart(productName, productPrice, priceValue, productImages, productId) {
        var name = typeof productName === 'string' ? productName : 'منتج بدون اسم';
        var price = typeof priceValue === 'number' ? priceValue : 
                   typeof productPrice === 'number' ? productPrice : 0;
        var id = productId || Date.now().toString();
        
        var image = '';
        if (Array.isArray(productImages) && productImages.length > 0) {
            image = productImages[0];
        } else if (typeof productImages === 'string') {
            image = productImages;
        }
        
        var existingItemIndex = -1;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id === id) {
                existingItemIndex = i;
                break;
            }
        }
        
        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += 1;
        } else {
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
        showStatus('تمت إضافة "' + name + '" إلى السلة', 'success');
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
        
        var productName = cart[index].name || 'منتج';
        cart.splice(index, 1);
        
        try {
            localStorage.setItem('robuste_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('خطأ في تحديث السلة:', e);
        }
        
        renderCart();
        updateCartCount();
        showStatus('تمت إزالة "' + productName + '" من السلة', 'success');
    }

    // إظهار/إخفاء السلة
    function toggleCart() {
        if (cart.length === 0) {
            showStatus('سلة المشتريات فارغة', 'info');
            return;
        }
        
        try {
            var cartElement = document.getElementById('cartOffcanvas');
            if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                var cartOffcanvas = new bootstrap.Offcanvas(cartElement);
                cartOffcanvas.show();
            } else {
                cartElement.classList.add('show');
                document.body.classList.add('offcanvas-open');
            }
        } catch (e) {
            console.error('خطأ في فتح السلة:', e);
            document.getElementById('cartOffcanvas').classList.add('show');
            document.body.classList.add('offcanvas-open');
        }
    }

    // ============== إتمام عملية الشراء من السلة ==============
    function checkout() {
        if (cart.length === 0) {
            showStatus('سلة المشتريات فارغة', 'error');
            return;
        }
        
        // إخفاء سلة المشتريات
        try {
            var cartElement = document.getElementById('cartOffcanvas');
            if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                var cartOffcanvas = bootstrap.Offcanvas.getInstance(cartElement);
                if (cartOffcanvas) {
                    cartOffcanvas.hide();
                }
            } else {
                cartElement.classList.remove('show');
                document.body.classList.remove('offcanvas-open');
            }
        } catch (e) {}
        
        // إعداد بيانات الطلب
        var firstItem = cart[0];
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].quantity;
        }
        
        // ملء نموذج الطلب
        document.getElementById('productName').value = cart.length + ' منتجات مختلفة';
        document.getElementById('productPriceValue').value = total;
        document.getElementById('productImageUrl').value = firstItem.image;
        
        document.getElementById('productNameDisplay').textContent = cart.length + ' منتجات مختلفة';
        document.getElementById('productPrice').textContent = total.toLocaleString() + ' DA';
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
    function submitOrder() {
        var productName = document.getElementById('productName').value;
        var productPrice = document.getElementById('productPriceValue').value;
        var productImage = document.getElementById('productImageUrl').value;
        var fullName = document.getElementById('fullName').value;
        var phone = document.getElementById('phone').value;
        var email = document.getElementById('email').value || 'لم يتم تقديمه';
        var wilaya = document.getElementById('wilaya').value;
        var address = document.getElementById('address').value || 'غير محدد';
        
        var paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethodElement) {
            showStatus('يرجى اختيار طريقة الدفع', 'error');
            return;
        }
        var paymentMethod = paymentMethodElement.value;
        
        // التحقق من صحة البيانات
        if (!fullName || !phone || !wilaya) {
            showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        var phoneRegex = /^0[5-7][0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            showStatus('رقم الهاتف غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 05 أو 06 أو 07', 'error');
            return;
        }
        
        // حساب المجموع الكلي
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].quantity;
        }
        
        // إعداد بيانات الطلب
        var orderData = {
            products: cart,
            customer: fullName,
            phone: phone,
            email: email,
            wilaya: wilaya,
            address: address,
            payment: paymentMethod,
            totalPrice: total,
            timestamp: new Date().toISOString(),
            status: 'جديد'
        };
        
        // عرض حالة التحميل
        showStatus('جاري معالجة طلبك...', 'loading');
        
        // تعطيل زر الإرسال أثناء المعالجة
        var submitBtn = document.getElementById('submitOrderBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>جاري المعالجة...';
        
        if (typeof db !== 'undefined') {
            // تخزين الطلب في Firebase
            db.collection('orders').add(orderData)
                .then(function(docRef) {
                    console.log("تم تخزين الطلب في Firebase:", docRef.id);
                    return sendOrderEmail(docRef.id, fullName, phone, email, wilaya, address, total, paymentMethod);
                })
                .then(function() {
                    showSuccessMessage(docRef.id, fullName, phone, total);
                    clearCartAndResetForm();
                })
                .catch(function(error) {
                    handleOrderError(error, submitBtn);
                });
        } else {
            // Fallback إذا لم يكن Firebase متاحاً
            setTimeout(function() {
                try {
                    var orderId = 'ORD-' + Date.now();
                    sendOrderEmail(orderId, fullName, phone, email, wilaya, address, total, paymentMethod)
                        .then(function() {
                            showSuccessMessage(orderId, fullName, phone, total);
                            clearCartAndResetForm();
                        })
                        .catch(function(error) {
                            handleOrderError(error, submitBtn);
                        });
                } catch (error) {
                    handleOrderError(error, submitBtn);
                }
            }, 500);
        }
    }

    function sendOrderEmail(orderId, fullName, phone, email, wilaya, address, total, paymentMethod) {
        // إنشاء قائمة المنتجات للبريد الإلكتروني
        var productsList = '';
        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            productsList += '<div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee;">' +
                '<strong>المنتج:</strong> ' + item.name + ' <br>' +
                '<strong>الكمية:</strong> ' + item.quantity + ' <br>' +
                '<strong>السعر:</strong> ' + item.price.toLocaleString() + ' د.ج <br>' +
                '<strong>المجموع:</strong> ' + (item.price * item.quantity).toLocaleString() + ' د.ج' +
                '</div>';
        }
        
        // إرسال إيميل عبر EmailJS
        if (typeof emailjs !== 'undefined') {
            return emailjs.send("service_lc1q5k8", "template_a15g7yg", {
                order_id: orderId,
                customer_name: fullName,
                customer_phone: phone,
                customer_email: email,
                wilaya: wilaya,
                address: address,
                total_price: total.toLocaleString(),
                payment_method: paymentMethod,
                order_date: new Date().toLocaleString('ar-DZ'),
                products: productsList
            });
        } else {
            return Promise.resolve();
        }
    }

    function showSuccessMessage(orderId, fullName, phone, total) {
        var successMessage = '<div class="text-center">' +
            '<i class="bi bi-check-circle-fill text-success fs-1"></i>' +
            '<h5 class="mt-2">تم تأكيد طلبك بنجاح!</h5>' +
            '<div class="text-start mt-3">' +
            '<p><strong>رقم الطلب:</strong> ' + orderId + '</p>' +
            '<p><strong>الاسم:</strong> ' + fullName + '</p>' +
            '<p><strong>عدد المنتجات:</strong> ' + cart.length + ' منتجات</p>' +
            '<p><strong>المبلغ الإجمالي:</strong> ' + total.toLocaleString() + ' د.ج</p>' +
            '<p class="mt-3">سيتم التواصل معك على الرقم <strong>' + phone + '</strong> خلال 24 ساعة لتأكيد الشحن.</p>' +
            '</div>' +
            '<a href="https://wa.me/213656360457?text=' + encodeURIComponent(
                'استفسار عن الطلب ' + orderId + '\nالاسم: ' + fullName + '\nعدد المنتجات: ' + cart.length + '\nالمجموع: ' + total.toLocaleString() + ' د.ج\nرقم الهاتف: ' + phone
            ) + '" class="btn whatsapp-contact-btn mt-2 w-100" target="_blank">' +
            '<i class="bi bi-whatsapp"></i> تواصل عبر واتساب (اختياري)' +
            '</a>' +
            '</div>';
        
        showStatus(successMessage, 'success');
    }

    function clearCartAndResetForm() {
        cart = [];
        localStorage.removeItem('robuste_cart');
        updateCartCount();
        document.getElementById('orderForm').reset();
        if (orderModal) {
            orderModal.hide();
        }
    }

    function handleOrderError(error, submitBtn) {
        console.error('حدث خطأ:', error);
        
        var errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        if (error.code) {
            errorMessage = 'خطأ في النظام: ' + error.code;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.text) {
            errorMessage = error.text;
        }
        
        showStatus('حدث خطأ أثناء إرسال الطلب: ' + errorMessage, 'error');
        
        // إعادة تمكين زر الإرسال
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'تأكيد الطلب';
    }

    // ============== وظائف الاتصال ==============

    // إرسال رسالة الاتصال
    function sendContactMessage() {
        var name = document.getElementById('contactName').value;
        var email = document.getElementById('contactEmail').value;
        var phone = document.getElementById('contactPhone').value || 'لم يتم تقديمه';
        var message = document.getElementById('contactMessage').value;
        
        if (!name || !email || !message) {
            showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // عرض حالة التحميل
        var contactSpinner = document.getElementById('contactSpinner');
        var contactSubmitText = document.getElementById('contactSubmitText');
        contactSpinner.classList.remove('d-none');
        contactSubmitText.textContent = 'جاري الإرسال...';
        
        if (typeof emailjs !== 'undefined') {
            // إرسال رسالة الاتصال عبر EmailJS
            emailjs.send("service_lc1q5k8", "template_11pkq0k", {
                from_name: name,
                from_email: email,
                phone_number: phone,
                message: message
            })
            .then(function() {
                console.log("تم إرسال رسالة الاتصال");
                showStatus('تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً.', 'success');
                document.getElementById('contactForm').reset();
            })
            .catch(function(error) {
                console.error('حدث خطأ:', error);
                var errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
                if (error.code) {
                    errorMessage = 'خطأ في النظام: ' + error.code;
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (error.text) {
                    errorMessage = error.text;
                }
                showStatus('حدث خطأ أثناء إرسال الرسالة: ' + errorMessage, 'error');
            })
            .finally(function() {
                contactSpinner.classList.add('d-none');
                contactSubmitText.textContent = 'إرسال الرسالة';
            });
        } else {
            showStatus('تعذر إرسال الرسالة. يرجى المحاولة لاحقاً.', 'error');
            contactSpinner.classList.add('d-none');
            contactSubmitText.textContent = 'إرسال الرسالة';
        }
    }

    // ============== وظائف مساعدة ==============

    // تعبئة قائمة الولايات
    function populateWilayas() {
        var wilayaSelect = document.getElementById('wilaya');
        if (!wilayaSelect) return;
        
        wilayaSelect.innerHTML = '<option value="">اختر الولاية</option>';
        for (var i = 0; i < wilayas.length; i++) {
            var option = document.createElement('option');
            option.value = wilayas[i];
            option.textContent = wilayas[i];
            wilayaSelect.appendChild(option);
        }
    }

    // بدء مؤقت العرض الخاص
    function startOfferTimer() {
        var daysElement = document.getElementById('days');
        var hoursElement = document.getElementById('hours');
        var minutesElement = document.getElementById('minutes');
        var secondsElement = document.getElementById('seconds');
        
        if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;
        
        // تاريخ انتهاء العرض (3 أيام من الآن)
        var endDate = new Date();
        endDate.setDate(endDate.getDate() + 3);
        
        function updateTimer() {
            var now = new Date();
            var difference = endDate.getTime() - now.getTime();
            
            if (difference <= 0) {
                daysElement.textContent = '00';
                hoursElement.textContent = '00';
                minutesElement.textContent = '00';
                secondsElement.textContent = '00';
                return;
            }
            
            var days = Math.floor(difference / (1000 * 60 * 60 * 24));
            var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            daysElement.textContent = days < 10 ? '0' + days : '' + days;
            hoursElement.textContent = hours < 10 ? '0' + hours : '' + hours;
            minutesElement.textContent = minutes < 10 ? '0' + minutes : '' + minutes;
            secondsElement.textContent = seconds < 10 ? '0' + seconds : '' + seconds;
        }
        
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    // عرض حالة الطلب
    function showStatus(message, type) {
        var indicator = document.getElementById('statusIndicator');
        var messageElement = document.getElementById('statusMessage');
        
        if (!indicator || !messageElement) return;
        
        messageElement.innerHTML = message;
        
        var alert = indicator.querySelector('.alert');
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
                messageElement.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>' + message;
                break;
            case 'info':
                alert.classList.add('alert-info');
                break;
            default:
                alert.classList.add('alert-info');
        }
        
        indicator.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(hideStatus, 5000);
        }
    }

    // إخفاء مؤشر الحالة
    function hideStatus() {
        var indicator = document.getElementById('statusIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // ============== السلايدر ==============
    var slideIndex1 = 1;
    
    function showSlides1(n) {
        var slides = document.getElementsByClassName("mySlides1");
        var dots = document.getElementsByClassName("dot1");
        
        if (slides.length === 0) return;
        
        if (n > slides.length) slideIndex1 = 1;
        if (n < 1) slideIndex1 = slides.length;
        
        for (var i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        
        for (var j = 0; j < dots.length; j++) {
            dots[j].className = dots[j].className.replace(" active", "");
        }
        
        slides[slideIndex1 - 1].style.display = "block";
        if (dots.length > 0) {
            dots[slideIndex1 - 1].className += " active";
        }
    }
    
    function plusSlides1(n) {
        showSlides1(slideIndex1 + n);
    }
    
    function currentSlide1(n) {
        showSlides1(n);
    }
    
    function initSlides() {
        showSlides1(1);
        setInterval(function() {
            plusSlides1(1);
        }, 4000);
    }

    // ============== وظيفة تبديل وضع الظلام ==============
    function toggleDarkMode() {
        var currentTheme = document.documentElement.getAttribute('data-theme');
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        var themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            if (newTheme === 'dark') {
                themeIcon.className = 'bi bi-sun';
                themeIcon.parentElement.title = 'تفعيل وضع النهار';
            } else {
                themeIcon.className = 'bi bi-moon';
                themeIcon.parentElement.title = 'تفعيل وضع الظلام';
            }
        }
        
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.error('Could not save theme preference:', e);
        }
    }

    function initDarkMode() {
        var savedTheme = 'light';
        try {
            savedTheme = localStorage.getItem('theme') || 'light';
        } catch (e) {
            console.error('Could not load theme preference:', e);
        }
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        var themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            if (savedTheme === 'dark') {
                themeIcon.className = 'bi bi-sun';
                themeIcon.parentElement.title = 'تفعيل وضع النهار';
            } else {
                themeIcon.className = 'bi bi-moon';
                themeIcon.parentElement.title = 'تفعيل وضع الظلام';
            }
        }
    }

    // ============== إعدادات اللمس للأجهزة المحمولة ==============
    function setupTouchHandlers() {
        // كشف التمرير
        window.addEventListener('scroll', function() {
            isScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                isScrolling = false;
            }, 100);
        });
        
        document.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            
            // إضافة فئة للمس للحصول على استجابة فورية
            if (e.target.matches('.add-to-cart-btn, .offer-btn, .btn, button, [role="button"]')) {
                e.target.classList.add('touch-start');
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            var currentTime = Date.now();
            var target = e.target;
            
            // إزالة فئة المس
            if (target.matches('.add-to-cart-btn, .offer-btn, .btn, button, [role="button"]')) {
                target.classList.remove('touch-start');
            }
            
            // منع النقرات السريعة المتتالية
            if (currentTime - touchStartTime < 50) {
                return;
            }
            
            // منع التمرير العرضي
            var touchEndX = e.changedTouches[0].clientX;
            var touchEndY = e.changedTouches[0].clientY;
            var deltaX = Math.abs(touchEndX - touchStartX);
            var deltaY = Math.abs(touchEndY - touchStartY);
            
            if (deltaX > 10 || deltaY > 10) {
                return;
            }
            
            // منع النقر المزدوج
            if (currentTime - lastTapTime < 300 && target === lastTapTarget) {
                return;
            }
            
            lastTapTime = currentTime;
            lastTapTarget = target;
        }, { passive: true });
        
        // تحسين أداء اللمس للأزرار
        var interactiveElements = document.querySelectorAll('button, .btn, [role="button"], a');
        for (var i = 0; i < interactiveElements.length; i++) {
            interactiveElements[i].style.touchAction = 'manipulation';
            interactiveElements[i].style.webkitTapHighlightColor = 'transparent';
        }
    }

    // ============== تهيئة الصفحة ==============
    function initializePage() {
        try {
            loadCart();
            updateCartCount();
            renderCart();
            
            if (document.getElementById('productsContainer')) {
                loadAndDisplayProducts();
                setupCategoryFilters();
                setupAddToCartButtons();
            }
            
            if (document.getElementById('specialOffersContainer')) {
                loadSpecialOffers();
            }
            
            if (document.getElementById('wilaya')) {
                populateWilayas();
            }
            
            if (document.getElementById('days')) {
                startOfferTimer();
            }
            
            if (document.querySelector('.mySlides1')) {
                initSlides();
            }
            
            initDarkMode();
            
            var themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    toggleDarkMode();
                }, { passive: false });
                themeToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    toggleDarkMode();
                });
            }
            
            var orderModalElement = document.getElementById('orderModal');
            if (orderModalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                orderModal = new bootstrap.Modal(orderModalElement);
            }
            
            var contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    sendContactMessage();
                });
            }
            
            var cartToggle = document.getElementById('cartToggle');
            if (cartToggle) {
                cartToggle.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    toggleCart();
                }, { passive: false });
                cartToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    toggleCart();
                });
            }
            
            var checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    checkout();
                }, { passive: false });
                checkoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    checkout();
                });
            }
            
            var submitOrderBtn = document.getElementById('submitOrderBtn');
            if (submitOrderBtn) {
                submitOrderBtn.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    submitOrder();
                }, { passive: false });
                submitOrderBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    submitOrder();
                });
            }
            
            setupTouchHandlers();
            
        } catch (error) {
            console.error('خطأ في تهيئة الصفحة:', error);
        }
    }

    // ============== معالجة الأخطاء العالمية ==============
    window.addEventListener('error', function(event) {
        console.error('خطأ في الصفحة:', event.error);
    });

    if (typeof Promise !== 'undefined') {
        window.addEventListener('unhandledrejection', function(event) {
            console.error('خطأ في الوعد:', event.reason);
        });
    }

    // ============== بدء التطبيق ==============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        initializePage();
    }

    // ============== تعريض الوظائف المطلوبة عالمياً ==============
    window.toggleCart = toggleCart;
    window.checkout = checkout;
    window.submitOrder = submitOrder;
    window.toggleDarkMode = toggleDarkMode;
    window.addToCart = addToCart;
    window.updateQuantity = updateQuantity;
    window.removeFromCart = removeFromCart;

})();
