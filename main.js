(function() {
    'use strict';

    // ============== تهيئة Firebase ==============
    var firebaseConfig = {
        apiKey: "AIzaSyBTrnKCYOtfSSDYtmVQbzP2HcwgkLT565Y",
        authDomain: "robuste-c8e0f.firebaseapp.com",
        projectId: "robuste-c8e0f",
        storageBucket: "robuste-c8e0f.appspot.com",
        messagingSenderId: "975609984963",
        appId: "1:975609984963:web:a481efb493a88d7bc7af76",
        measurementId: "G-DWT7MZN028"
    };

    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        try {
            firebase.initializeApp(firebaseConfig);
        } catch (e) {
            console.error('Firebase initialization error:', e);
        }
    }

    var db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

    // تهيئة EmailJS
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init("k77vdaUWPpnLrfTnS");
        } catch (e) {
            console.error('EmailJS initialization error:', e);
        }
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
    var lastTapTime = 0;
    var isProcessing = false;

    // ============== نظام المنتجات الديناميكي ==============

    // دالة جلب وعرض المنتجات من JSON
    function loadAndDisplayProducts(category) {
        if (category === undefined) category = 'all';
        
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
                    filteredProducts = [];
                    for (var i = 0; i < products.length; i++) {
                        if (products[i].category === category) {
                            filteredProducts.push(products[i]);
                        }
                    }
                }
                renderProducts(filteredProducts);
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
        
        var productCards = '';
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var discountBadge = '';
            var oldPrice = '';
            var productBadge = '';
            
            if (product.old_price && product.old_price > product.price) {
                var discountPercent = Math.round(((product.old_price - product.price) / product.old_price) * 100);
                discountBadge = '<div class="discount-badge">خصم ' + discountPercent + '%</div>';
                oldPrice = '<small dir="ltr" class="text-decoration-line-through text-muted me-2">' + product.old_price.toLocaleString() + ' DA</small>';
            }
            
            if (product.badge) {
                productBadge = '<div class="product-badge">' + product.badge + '</div>';
            }
            
            // إنشاء سلايدر للصور
            var carouselIndicators = '';
            var carouselItems = '';
            for (var j = 0; j < product.images.length; j++) {
                carouselIndicators += '<button type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide-to="' + j + '" ' + 
                    (j === 0 ? 'class="active" aria-current="true"' : '') + ' aria-label="صورة ' + (j + 1) + '"></button>';
                
                carouselItems += '<div class="carousel-item ' + (j === 0 ? 'active' : '') + '">' +
                    '<img src="' + product.images[j] + '" class="d-block w-100" alt="' + product.title + '" loading="lazy">' +
                    '</div>';
            }
            
            var carouselControls = '';
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
            
            productCards += '<div class="col-6 col-md-4 col-lg-3 mb-4">' +
                '<div class="product-card card h-100 position-relative" role="link" tabindex="0" data-pid="' + product.id + '">' +
                productBadge + discountBadge +
                '<div id="carousel-' + product.id + '" class="carousel slide product-carousel" data-bs-ride="carousel">' +
                '<div class="carousel-indicators">' + carouselIndicators + '</div>' +
                '<div class="carousel-inner">' + carouselItems + '</div>' +
                carouselControls +
                '</div>' +
                '<div class="card-body">' +
                '<h5 class="product-title card-title">' + product.title + '</h5>' +
                '<p class="card-text text-muted small">' + (product.description_short || '') + '</p>' +
                '<div class="price-section d-flex align-items-center mt-2">' +
                oldPrice +
                '<p dir="ltr" class="current-price fw-bold mb-0">' + product.price.toLocaleString() + ' DA</p>' +
                '</div>' +
                '</div>' +
                '<div class="card-footer bg-transparent border-0">' +
                '<button class="btn btn-orange w-100 add-to-cart-btn" data-id="' + product.id + '" aria-label="Ajouter ' + product.title + ' au panier">' +
                '<i class="bi bi-cart-plus"></i>&nbsp;Ajouter au panier' +
                '</button>' +
                '</div>' +
                '</div>' +
                '</div>';
        }
        
        container.innerHTML = productCards;
        
        // إعداد تفاعل البطاقات
        setupProductCardsInteraction();
    }

    // إعداد تفاعل البطاقات مع دعم اللمس
    function setupProductCardsInteraction() {
        var productCards = document.querySelectorAll('.product-card');
        for (var i = 0; i < productCards.length; i++) {
            setupCardTouchEvents(productCards[i]);
        }
    }

    // إعداد أحداث اللمس للبطاقات
    function setupCardTouchEvents(card) {
        var touchStartX = 0;
        var touchStartY = 0;
        var touchEndX = 0;
        var touchEndY = 0;
        
        card.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            this.classList.add('touch-active');
        }, { passive: true });
        
        card.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.classList.remove('touch-active');
            
            // منع النقر إذا كانت هناك حركة سريبة
            var deltaX = Math.abs(touchEndX - touchStartX);
            var deltaY = Math.abs(touchEndY - touchStartY);
            
            if (deltaX < 10 && deltaY < 10) {
                handleCardClick(this, e);
            }
        }, { passive: true });
        
        card.addEventListener('click', function(e) {
            // منع التنفيذ المزدوج مع touchend
            if (e.defaultPrevented) return;
            handleCardClick(this, e);
        });
        
        // دعم لوحة المفاتيح
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                var pid = this.getAttribute('data-pid');
                if (pid) {
                    window.location.href = 'product.html?pid=' + encodeURIComponent(pid);
                }
            }
        });
    }

    // معالجة النقر على البطاقة
    function handleCardClick(card, event) {
        // إذا كان النقر من عنصر تفاعلي
        var interactiveElement = event.target.closest('button, a, input, select, textarea, .carousel-control, .carousel-indicators');
        if (interactiveElement) {
            if (interactiveElement.classList.contains('add-to-cart-btn')) {
                event.stopPropagation();
                event.preventDefault();
                handleAddToCartClick(interactiveElement);
                return;
            }
            return;
        }
        
        var pid = card.getAttribute('data-pid');
        if (pid) {
            window.location.href = 'product.html?pid=' + encodeURIComponent(pid);
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
                    if (products[i].old_price && products[i].old_price > products[i].price) {
                        specialOffers.push(products[i]);
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
        
        var offersHTML = '';
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
            
            offersHTML += '<div class="col-md-4">' +
                '<div class="offer-product">' +
                '<div class="offer-product-discount">-' + discountPercentage + '%</div>' +
                (product.badge ? '<div class="offer-product-badge">' + product.badge + '</div>' : '') +
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
        }
        
        offersContainer.innerHTML = offersHTML;
    }

    // ============== إعداد نظام الفئات ==============
    function setupCategoryFilters() {
        var categoryButtons = document.querySelectorAll('.category-btn');
        for (var i = 0; i < categoryButtons.length; i++) {
            setupButtonTouchEvents(categoryButtons[i]);
            
            categoryButtons[i].addEventListener('click', function() {
                var allButtons = document.querySelectorAll('.category-btn');
                for (var j = 0; j < allButtons.length; j++) {
                    allButtons[j].classList.remove('active');
                }
                this.classList.add('active');
                var category = this.getAttribute('data-category');
                loadAndDisplayProducts(category);
            });
        }
    }

    // إعداد أحداث اللمس للأزرار
    function setupButtonTouchEvents(button) {
        button.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
        
        button.addEventListener('touchcancel', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    }

    // معالجة نقر إضافة إلى السلة
    function handleAddToCartClick(button) {
        // منع النقر السريع المتكرر
        var currentTime = new Date().getTime();
        var timeSinceLastTap = currentTime - lastTapTime;
        
        if (timeSinceLastTap < 300) return; // 300ms debounce
        if (isProcessing) return;
        
        lastTapTime = currentTime;
        isProcessing = true;
        
        var productId = button.getAttribute('data-id');
        if (!productId) {
            console.warn('add-to-cart button without data-id', button);
            isProcessing = false;
            return;
        }
        
        // إضافة تأثير مرئي
        button.classList.add('processing');
        var originalHTML = button.innerHTML;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
        
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
                    showStatus('Produit introuvable', 'error');
                }
            })
            .catch(function(error) {
                console.error('Error loading product:', error);
                showStatus('Error loading product details', 'error');
            })
            .finally(function() {
                button.classList.remove('processing');
                button.innerHTML = originalHTML;
                isProcessing = false;
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
                '<img src="' + (item.image || '') + '" alt="' + (item.name || 'منتج') + '" class="cart-item-img me-3">' +
                '<div class="cart-item-details">' +
                '<div class="cart-item-title">' + (item.name || 'منتج بدون اسم') + '</div>' +
                '<div class="cart-item-price">' + (item.price || 0) + ' د.ج</div>' +
                '<div class="quantity-controls">' +
                '<button class="quantity-btn" data-action="decrease" data-index="' + i + '">-</button>' +
                '<input type="number" class="quantity-input" value="' + (item.quantity || 1) + '" min="1" data-index="' + i + '">' +
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
        // معالجة أزرار الكمية
        var quantityBtns = document.querySelectorAll('.quantity-btn');
        for (var i = 0; i < quantityBtns.length; i++) {
            setupButtonTouchEvents(quantityBtns[i]);
            
            quantityBtns[i].addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var index = parseInt(this.getAttribute('data-index'));
                var action = this.getAttribute('data-action');
                
                if (isNaN(index) || index < 0 || index >= cart.length) return;
                
                if (action === 'increase') {
                    updateQuantity(index, cart[index].quantity + 1);
                } else if (action === 'decrease') {
                    updateQuantity(index, cart[index].quantity - 1);
                }
            });
        }
        
        // معالجة حقول الإدخال
        var quantityInputs = document.querySelectorAll('.quantity-input');
        for (var i = 0; i < quantityInputs.length; i++) {
            quantityInputs[i].addEventListener('change', function() {
                var index = parseInt(this.getAttribute('data-index'));
                if (isNaN(index) || index < 0 || index >= cart.length) return;
                
                var newQuantity = parseInt(this.value) || 1;
                updateQuantity(index, newQuantity);
            });
            
            quantityInputs[i].addEventListener('keydown', function(e) {
                if (!/[\d\b\t\n]|Arrow|Delete|Backspace|Tab/.test(e.key) && 
                    !(e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                }
            });
        }
        
        // معالجة أزرار الحذف
        var removeBtns = document.querySelectorAll('.remove-item');
        for (var i = 0; i < removeBtns.length; i++) {
            setupButtonTouchEvents(removeBtns[i]);
            
            removeBtns[i].addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var index = parseInt(this.getAttribute('data-index'));
                if (isNaN(index) || index < 0 || index >= cart.length) return;
                
                removeFromCart(index);
            });
        }
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
            var cartOffcanvasEl = document.getElementById('cartOffcanvas');
            if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                var cartOffcanvas = new bootstrap.Offcanvas(cartOffcanvasEl);
                cartOffcanvas.show();
            } else {
                cartOffcanvasEl.classList.add('show');
                document.body.classList.add('offcanvas-open');
            }
        } catch (e) {
            console.error('خطأ في فتح السلة:', e);
        }
    }

    // ============== إتمام عملية الشراء من السلة ==============
    function checkout() {
        if (cart.length === 0) {
            showStatus('سلة المشتريات فارغة', 'error');
            return;
        }
        
        // إخفاء سلة المشتريات
        var cartOffcanvasEl = document.getElementById('cartOffcanvas');
        if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
            var cartOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
            if (cartOffcanvas) {
                cartOffcanvas.hide();
            }
        } else {
            cartOffcanvasEl.classList.remove('show');
            document.body.classList.remove('offcanvas-open');
        }
        
        // إعداد بيانات الطلب
        var firstItem = cart[0];
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].quantity;
        }
        
        // ملء نموذج الطلب
        var productNameField = document.getElementById('productName');
        var priceValueField = document.getElementById('productPriceValue');
        var imageUrlField = document.getElementById('productImageUrl');
        var nameDisplay = document.getElementById('productNameDisplay');
        var priceDisplay = document.getElementById('productPrice');
        var imageDisplay = document.getElementById('productImage');
        
        if (productNameField) productNameField.value = cart.length + ' منتجات مختلفة';
        if (priceValueField) priceValueField.value = total;
        if (imageUrlField) imageUrlField.value = firstItem.image;
        if (nameDisplay) nameDisplay.textContent = cart.length + ' منتجات مختلفة';
        if (priceDisplay) priceDisplay.textContent = total.toLocaleString() + ' DA';
        if (imageDisplay && firstItem.image) imageDisplay.src = firstItem.image;
        
        // إعادة تعيين النموذج
        var orderForm = document.getElementById('orderForm');
        if (orderForm) orderForm.reset();
        
        var cashOnDelivery = document.getElementById('cashOnDelivery');
        if (cashOnDelivery) cashOnDelivery.checked = true;
        
        // إظهار نموذج الطلب
        if (orderModal) {
            orderModal.show();
        }
    }

    // ============== وظائف الطلب ==============

    // إرسال الطلب
    function submitOrder() {
        var productNameField = document.getElementById('productName');
        var priceValueField = document.getElementById('productPriceValue');
        var imageUrlField = document.getElementById('productImageUrl');
        var fullNameField = document.getElementById('fullName');
        var phoneField = document.getElementById('phone');
        var emailField = document.getElementById('email');
        var wilayaField = document.getElementById('wilaya');
        var addressField = document.getElementById('address');
        var paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
        
        if (!productNameField || !priceValueField || !imageUrlField || 
            !fullNameField || !phoneField || !wilayaField) {
            showStatus('النموذج غير مكتمل', 'error');
            return;
        }
        
        var productName = productNameField.value;
        var productPrice = priceValueField.value;
        var productImage = imageUrlField.value;
        var fullName = fullNameField.value;
        var phone = phoneField.value;
        var email = emailField.value || 'لم يتم تقديمه';
        var wilaya = wilayaField.value;
        var address = addressField.value || 'غير محدد';
        
        var paymentMethod = '';
        for (var i = 0; i < paymentMethodRadios.length; i++) {
            if (paymentMethodRadios[i].checked) {
                paymentMethod = paymentMethodRadios[i].value;
                break;
            }
        }
        
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
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري المعالجة...';
        }
        
        // تخزين الطلب في Firebase
        var firestorePromise = Promise.resolve();
        if (db) {
            firestorePromise = db.collection('orders').add(orderData)
                .then(function(docRef) {
                    console.log("تم تخزين الطلب في Firebase:", docRef.id);
                    return docRef.id;
                })
                .catch(function(error) {
                    console.error("Firebase error:", error);
                    throw error;
                });
        }
        
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
        var emailPromise = Promise.resolve();
        if (typeof emailjs !== 'undefined') {
            emailPromise = firestorePromise.then(function(orderId) {
                return emailjs.send("service_lc1q5k8", "template_a15g7yg", {
                    order_id: orderId || 'N/A',
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
            });
        }
        
        Promise.all([firestorePromise, emailPromise])
            .then(function(results) {
                var orderId = results[0] || 'N/A';
                
                showStatus('<div class="text-center">' +
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
                    '</div>', 'success');
                
                // تفريغ السلة وإعادة تعيين النموذج
                cart = [];
                try {
                    localStorage.removeItem('robuste_cart');
                } catch (e) {
                    console.error('Error clearing cart:', e);
                }
                
                updateCartCount();
                if (orderForm) orderForm.reset();
                if (orderModal) {
                    orderModal.hide();
                }
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
                
                showStatus('حدث خطأ أثناء إرسال الطلب: ' + errorMessage, 'error');
            })
            .finally(function() {
                // إعادة تمكين زر الإرسال
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'تأكيد الطلب';
                }
            });
    }

    // ============== وظائف الاتصال ==============

    // إرسال رسالة الاتصال
    function sendContactMessage() {
        var contactName = document.getElementById('contactName');
        var contactEmail = document.getElementById('contactEmail');
        var contactPhone = document.getElementById('contactPhone');
        var contactMessage = document.getElementById('contactMessage');
        
        if (!contactName || !contactEmail || !contactMessage) {
            showStatus('النموذج غير مكتمل', 'error');
            return;
        }
        
        var name = contactName.value;
        var email = contactEmail.value;
        var phone = contactPhone ? contactPhone.value || 'لم يتم تقديمه' : 'لم يتم تقديمه';
        var message = contactMessage.value;
        
        if (!name || !email || !message) {
            showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // عرض حالة التحميل
        var contactSpinner = document.getElementById('contactSpinner');
        var contactSubmitText = document.getElementById('contactSubmitText');
        if (contactSpinner) contactSpinner.classList.remove('d-none');
        if (contactSubmitText) contactSubmitText.textContent = 'جاري الإرسال...';
        
        // إرسال رسالة الاتصال عبر EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.send("service_lc1q5k8", "template_11pkq0k", {
                from_name: name,
                from_email: email,
                phone_number: phone,
                message: message
            })
            .then(function() {
                console.log("تم إرسال رسالة الاتصال");
                showStatus('تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً.', 'success');
                var contactForm = document.getElementById('contactForm');
                if (contactForm) contactForm.reset();
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
                // إعادة تعيين زر الإرسال
                if (contactSpinner) contactSpinner.classList.add('d-none');
                if (contactSubmitText) contactSubmitText.textContent = 'إرسال الرسالة';
            });
        } else {
            showStatus('خدمة البريد الإلكتروني غير متاحة حالياً', 'error');
            if (contactSpinner) contactSpinner.classList.add('d-none');
            if (contactSubmitText) contactSubmitText.textContent = 'إرسال الرسالة';
        }
    }

    // ============== وظائف مساعدة ==============

    // تعبئة قائمة الولايات
    function populateWilayas() {
        var wilayaSelect = document.getElementById('wilaya');
        if (!wilayaSelect) return;
        
        wilayaSelect.innerHTML = '';
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
            var difference = endDate - now;
            
            if (difference <= 0) {
                // انتهى الوقت
                daysElement.textContent = '00';
                hoursElement.textContent = '00';
                minutesElement.textContent = '00';
                secondsElement.textContent = '00';
                return;
            }
            
            // حساب الأيام، الساعات، الدقائق، الثواني
            var days = Math.floor(difference / (1000 * 60 * 60 * 24));
            var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            // تحديث العناصر
            daysElement.textContent = days.toString().padStart(2, '0');
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
        
        // تحديث المؤثر كل ثانية
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    // عرض حالة الطلب
    function showStatus(message, type) {
        var indicator = document.getElementById('statusIndicator');
        var messageElement = document.getElementById('statusMessage');
        
        if (!indicator || !messageElement) return;
        
        // إعداد الرسالة
        messageElement.innerHTML = message;
        
        // إعداد التصميم حسب النوع
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
        
        // إظهار المؤشر
        indicator.style.display = 'block';
        
        // إخفاء التلقائي لرسائل النجاح بعد 5 ثواني
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
    if (typeof showSlides1 === 'undefined') {
        window.showSlides1 = function(n) {
            var slides = document.getElementsByClassName("mySlides1");
            var dots = document.getElementsByClassName("dot1");
            
            if (!slides.length || !dots.length) return;
            
            if (n > slides.length) slideIndex1 = 1;
            if (n < 1) slideIndex1 = slides.length;
            
            for (var i = 0; i < slides.length; i++) {
                slides[i].style.display = "none";
            }
            for (var i = 0; i < dots.length; i++) {
                dots[i].className = dots[i].className.replace(" active", "");
            }
            
            slides[slideIndex1 - 1].style.display = "block";
            dots[slideIndex1 - 1].className += " active";
        };
        
        window.plusSlides1 = function(n) {
            showSlides1(slideIndex1 += n);
        };
        
        window.currentSlide1 = function(n) {
            showSlides1(slideIndex1 = n);
        };
    }

    // تشغيل تلقائي للسلايدر
    if (document.getElementsByClassName("mySlides1").length > 0) {
        showSlides1(slideIndex1);
        setInterval(function() {
            plusSlides1(1);
        }, 4000);
    }

    // ============== وظيفة تبديل وضع الظلام ==============
    function toggleDarkMode() {
        var currentTheme = document.documentElement.getAttribute('data-theme');
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // تغيير السمة
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // تحديث أيقونة الزر
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
        
        // حفظ التفضيل في localStorage
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.error('Error saving theme:', e);
        }
    }

    // تهيئة وضع الظلام عند تحميل الصفحة
    function initDarkMode() {
        var savedTheme;
        try {
            savedTheme = localStorage.getItem('theme') || 'light';
        } catch (e) {
            savedTheme = 'light';
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
        
        // إضافة مستمع الحدث
        var themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            setupButtonTouchEvents(themeToggle);
            themeToggle.addEventListener('click', toggleDarkMode);
        }
    }

    // ============== إعدادات الأدوات الرئيسية ==============
    function setupMainTools() {
        // زر السلة
        var cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            setupButtonTouchEvents(cartBtn);
            cartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleCart();
            });
        }
        
        // زر الدفع
        var checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            setupButtonTouchEvents(checkoutBtn);
            checkoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                checkout();
            });
        }
        
        // زر إرسال الطلب
        var submitOrderBtn = document.getElementById('submitOrderBtn');
        if (submitOrderBtn) {
            setupButtonTouchEvents(submitOrderBtn);
            submitOrderBtn.addEventListener('click', function(e) {
                e.preventDefault();
                submitOrder();
            });
        }
        
        // زر إغلاق مؤشر الحالة
        var statusCloseBtn = document.querySelector('#statusIndicator .btn-close');
        if (statusCloseBtn) {
            statusCloseBtn.addEventListener('click', hideStatus);
        }
    }

    // ============== تهيئة التطبيق ==============
    function initApp() {
        // تهيئة وضع الظلام
        initDarkMode();
        
        // تحميل السلة
        loadCart();
        
        // تحميل وعرض المنتجات
        loadAndDisplayProducts();
        
        // إعداد فلاتر الفئات
        setupCategoryFilters();
        
        // تحميل العروض الخاصة
        loadSpecialOffers();
        
        // تعبئة قائمة الولايات
        populateWilayas();
        
        // بدء مؤقت العرض
        startOfferTimer();
        
        // إعداد الأدوات الرئيسية
        setupMainTools();
        
        // تهيئة نموذج الطلب
        var orderModalEl = document.getElementById('orderModal');
        if (orderModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            orderModal = new bootstrap.Modal(orderModalEl);
        }
        
        // إعداد نموذج الاتصال
        var contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                sendContactMessage();
            });
        }
        
        // تحديث عداد السلة وعرضها
        updateCartCount();
        renderCart();
        
        // تحسين تجربة اللمس
        if ('ontouchstart' in window) {
            document.documentElement.style.cursor = 'pointer';
            document.documentElement.style.webkitTapHighlightColor = 'transparent';
        }
    }

    // ============== معالجة الأخطاء العالمية ==============
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
    });

    // ============== بدء التطبيق ==============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();
