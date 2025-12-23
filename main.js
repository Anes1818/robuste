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
    
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    
    // ============== تهيئة EmailJS ==============
    (function() {
        if (typeof emailjs !== 'undefined') {
            emailjs.init("k77vdaUWPpnLrfTnS");
        }
    })();
    
    // ============== قائمة الولايات الجزائرية ==============
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
    var lastTouchEnd = 0;
    var touchMoved = false;
    var lastTap = 0;
    var tapDelay = 300;
    
    // ============== معالجات الأخطاء العالمية ==============
    window.addEventListener('error', function(errorEvent) {
        console.error('JavaScript Error:', errorEvent.error);
    });
    
    if (window.addEventListener) {
        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled Promise Rejection:', event.reason);
        });
    }
    
    // ============== نظام المنتجات الديناميكي ==============
    function loadAndDisplayProducts(category) {
        category = category || 'all';
        
        return new Promise(function(resolve, reject) {
            fetch('products.json')
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('Erreur lors du chargement des produits');
                    }
                    return response.json();
                })
                .then(function(products) {
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
                    resolve();
                })
                .catch(function(error) {
                    console.error('Erreur:', error);
                    showStatus('Erreur lors du chargement des produits', 'error');
                    reject(error);
                });
        });
    }
    
    function renderProducts(products) {
        var container = document.getElementById('productsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!products || products.length === 0) {
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
                var discountPercentage = Math.round(((product.old_price - product.price) / product.old_price) * 100);
                discountBadge = '<div class="discount-badge">خصم ' + discountPercentage + '%</div>';
                oldPrice = '<small dir="ltr" class="text-decoration-line-through text-muted me-2">' + product.old_price.toLocaleString() + ' DA</small>';
            }
            
            if (product.badge) {
                productBadge = '<div class="product-badge">' + product.badge + '</div>';
            }
            
            var carouselIndicators = '';
            var carouselItems = '';
            
            if (product.images && product.images.length > 0) {
                for (var j = 0; j < product.images.length; j++) {
                    carouselIndicators += '<button type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide-to="' + j + '" ' + 
                        (j === 0 ? 'class="active" aria-current="true"' : '') + 
                        ' aria-label="صورة ' + (j + 1) + '"></button>';
                    
                    carouselItems += '<div class="carousel-item ' + (j === 0 ? 'active' : '') + '">' +
                        '<img src="' + product.images[j] + '" class="d-block w-100" alt="' + product.title + '" loading="lazy">' +
                        '</div>';
                }
            }
            
            var carouselControls = '';
            if (product.images && product.images.length > 1) {
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
                productBadge +
                discountBadge +
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
    }
    
    // ============== نظام البطاقات القابلة للنقر ==============
    function setupProductCards() {
        var setupDone = false;
        
        return function() {
            if (setupDone) return;
            setupDone = true;
            
            // معالجة النقر على البطاقات (باستخدام اللمس والنقر)
            document.addEventListener('touchend', function(e) {
                handleProductCardTap(e);
            }, { passive: true });
            
            document.addEventListener('click', function(e) {
                handleProductCardTap(e);
            });
            
            // معالجة لوحة المفاتيح للوصول
            document.addEventListener('keydown', function(e) {
                var focused = document.activeElement;
                if (focused && focused.classList.contains('product-card')) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        var pid = focused.getAttribute('data-pid');
                        if (pid) {
                            window.location.href = 'product.html?pid=' + encodeURIComponent(pid);
                        }
                    }
                }
            });
        };
    }
    
    var setupProductCardsHandler = setupProductCards();
    
    function handleProductCardTap(e) {
        // منع التنفيذ المزدوج
        var now = Date.now();
        if (now - lastTap < tapDelay) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        lastTap = now;
        
        // البحث عن البطاقة الأصلية
        var card = e.target;
        while (card && !card.classList.contains('product-card')) {
            card = card.parentElement;
        }
        
        if (!card) return;
        
        // تخطي العناصر التفاعلية
        var interactiveEl = e.target;
        while (interactiveEl && interactiveEl !== card) {
            if (interactiveEl.tagName === 'BUTTON' || 
                interactiveEl.tagName === 'A' || 
                interactiveEl.tagName === 'INPUT' || 
                interactiveEl.tagName === 'SELECT' || 
                interactiveEl.tagName === 'TEXTAREA' ||
                interactiveEl.classList.contains('carousel-control') ||
                interactiveEl.classList.contains('carousel-indicators')) {
                return;
            }
            interactiveEl = interactiveEl.parentElement;
        }
        
        var pid = card.getAttribute('data-pid');
        if (pid) {
            window.location.href = 'product.html?pid=' + encodeURIComponent(pid);
        }
    }
    
    // ============== أزرار إضافة إلى السلة ==============
    function setupAddToCartButtons() {
        var setupDone = false;
        var processing = false;
        
        return function() {
            if (setupDone) return;
            setupDone = true;
            
            function handleAddToCart(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (processing) return;
                processing = true;
                
                setTimeout(function() {
                    processing = false;
                }, 300);
                
                var button = e.target;
                while (button && !button.classList.contains('add-to-cart-btn')) {
                    button = button.parentElement;
                }
                
                if (!button) {
                    processing = false;
                    return;
                }
                
                var productId = button.getAttribute('data-id');
                if (!productId) {
                    processing = false;
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
                            showStatus('Produit introuvable', 'error');
                        }
                    })
                    .catch(function(err) {
                        console.error(err);
                        showStatus('Error loading product details', 'error');
                    })
                    .finally(function() {
                        processing = false;
                    });
            }
            
            // معالجة اللمس والنقر
            document.addEventListener('touchend', function(e) {
                if (e.target.classList.contains('add-to-cart-btn') || 
                    e.target.closest('.add-to-cart-btn')) {
                    handleAddToCart(e);
                }
            }, { passive: true });
            
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('add-to-cart-btn') || 
                    e.target.closest('.add-to-cart-btn')) {
                    handleAddToCart(e);
                }
            });
        };
    }
    
    var setupAddToCartButtonsHandler = setupAddToCartButtons();
    
    // ============== العروض الخاصة ==============
    async function loadSpecialOffers() {
        try {
            var response = await fetch('products.json');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des produits');
            }
            var products = await response.json();
            
            var specialOffers = [];
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                if (product.old_price && product.old_price > product.price) {
                    specialOffers.push(product);
                    if (specialOffers.length >= 3) break;
                }
            }
            
            renderSpecialOffers(specialOffers);
        } catch (error) {
            console.error('Erreur lors du chargement des offres spéciales:', error);
        }
    }
    
    function renderSpecialOffers(offers) {
        var offersContainer = document.getElementById('specialOffersContainer');
        if (!offersContainer) return;
        
        if (!offers || offers.length === 0) {
            offersContainer.innerHTML = '<div class="col-12 text-center text-muted">Aucune offre spéciale pour le moment</div>';
            return;
        }
        
        var offersHTML = '';
        for (var i = 0; i < offers.length; i++) {
            var product = offers[i];
            var discountPercentage = Math.round(((product.old_price - product.price) / product.old_price) * 100);
            
            offersHTML += '<div class="col-md-4">' +
                '<div class="offer-product">' +
                '<div class="offer-product-discount">-' + discountPercentage + '%</div>' +
                (product.badge ? '<div class="offer-product-badge">' + product.badge + '</div>' : '') +
                '<div id="carousel-offer-' + product.id + '" class="carousel slide" data-bs-ride="carousel">' +
                '<div class="carousel-indicators">';
            
            if (product.images) {
                for (var j = 0; j < product.images.length; j++) {
                    offersHTML += '<button type="button" data-bs-target="#carousel-offer-' + product.id + '" data-bs-slide-to="' + j + '" ' +
                        (j === 0 ? 'class="active"' : '') + '></button>';
                }
                
                offersHTML += '</div><div class="carousel-inner">';
                
                for (var j = 0; j < product.images.length; j++) {
                    offersHTML += '<div class="carousel-item ' + (j === 0 ? 'active' : '') + '">' +
                        '<img src="' + product.images[j] + '" class="d-block w-100" alt="' + product.title + '" height="300" loading="lazy">' +
                        '</div>';
                }
            }
            
            offersHTML += '</div>' +
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
            attachCategoryButton(categoryButtons[i]);
        }
    }
    
    function attachCategoryButton(button) {
        function handleCategoryClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var categoryButtons = document.querySelectorAll('.category-btn');
            for (var i = 0; i < categoryButtons.length; i++) {
                categoryButtons[i].classList.remove('active');
            }
            
            this.classList.add('active');
            var category = this.getAttribute('data-category') || 'all';
            loadAndDisplayProducts(category);
        }
        
        button.addEventListener('touchend', handleCategoryClick, { passive: true });
        button.addEventListener('click', handleCategoryClick);
    }
    
    // ============== إدارة سلة المشتريات ==============
    function loadCart() {
        try {
            var cartData = localStorage.getItem('robuste_cart');
            if (cartData) {
                cart = JSON.parse(cartData);
            } else {
                cart = [];
            }
        } catch (e) {
            console.error('خطأ في تحميل سلة المشتريات:', e);
            cart = [];
        }
    }
    
    function updateCartCount() {
        var cartCount = document.getElementById('cartCount');
        var checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!cartCount || !checkoutBtn) return;
        
        var count = 0;
        for (var i = 0; i < cart.length; i++) {
            count += cart[i].quantity || 0;
        }
        
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'inline' : 'none';
        checkoutBtn.disabled = count === 0;
    }
    
    function renderCart() {
        var cartItems = document.getElementById('cartItems');
        var cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems || !cartTotal) return;
        
        cartItems.innerHTML = '';
        
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
        var fragment = document.createDocumentFragment();
        
        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            var itemTotal = (item.price || 0) * (item.quantity || 0);
            total += itemTotal;
            
            var itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.setAttribute('data-id', item.id || '');
            
            itemElement.innerHTML = '<div class="d-flex">' +
                '<img src="' + (item.image || '') + '" alt="' + (item.name || 'منتج') + '" class="cart-item-img me-3" onerror="this.style.display=\'none\'">' +
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
            
            fragment.appendChild(itemElement);
        }
        
        cartItems.appendChild(fragment);
        cartTotal.textContent = total.toLocaleString('ar-DZ') + ' د.ج';
        
        attachCartEventListeners();
    }
    
    function attachCartEventListeners() {
        // أزرار الكمية
        var quantityButtons = document.querySelectorAll('.quantity-btn');
        for (var i = 0; i < quantityButtons.length; i++) {
            var btn = quantityButtons[i];
            btn.addEventListener('touchend', handleQuantityButton, { passive: true });
            btn.addEventListener('click', handleQuantityButton);
        }
        
        // حقول الإدخال
        var quantityInputs = document.querySelectorAll('.quantity-input');
        for (var i = 0; i < quantityInputs.length; i++) {
            var input = quantityInputs[i];
            input.addEventListener('change', handleQuantityChange);
            input.addEventListener('keydown', handleQuantityKeydown);
        }
        
        // أزرار الحذف
        var removeButtons = document.querySelectorAll('.remove-item');
        for (var i = 0; i < removeButtons.length; i++) {
            var btn = removeButtons[i];
            btn.addEventListener('touchend', handleRemoveItem, { passive: true });
            btn.addEventListener('click', handleRemoveItem);
        }
    }
    
    function handleQuantityButton(e) {
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
    }
    
    function handleQuantityChange(e) {
        var index = parseInt(this.getAttribute('data-index'), 10);
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        var newQuantity = parseInt(this.value, 10) || 1;
        updateQuantity(index, newQuantity);
    }
    
    function handleQuantityKeydown(e) {
        if (!/[\d\b\t\n]|Arrow|Delete|Backspace|Tab/.test(e.key) && 
            !(e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
    }
    
    function handleRemoveItem(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var index = parseInt(this.getAttribute('data-index'), 10);
        if (isNaN(index) || index < 0 || index >= cart.length) return;
        
        removeFromCart(index);
    }
    
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
        
        try {
            localStorage.setItem('robuste_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('خطأ في حفظ السلة:', e);
            showStatus('تعذر حفظ السلة، قد تكون ذاكرة التخزين ممتلئة', 'error');
        }
        
        updateCartCount();
        renderCart();
        showStatus('تمت إضافة "' + name + '" إلى السلة', 'success');
    }
    
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
    
    function toggleCart() {
        if (cart.length === 0) {
            showStatus('سلة المشتريات فارغة', 'info');
            return;
        }
        
        try {
            var cartElement = document.getElementById('cartOffcanvas');
            if (cartElement && bootstrap && bootstrap.Offcanvas) {
                var cartOffcanvas = new bootstrap.Offcanvas(cartElement);
                cartOffcanvas.show();
            } else {
                cartElement.classList.add('show');
                document.body.classList.add('offcanvas-open');
            }
        } catch (e) {
            console.error('خطأ في فتح السلة:', e);
        }
    }
    
    // ============== إتمام عملية الشراء ==============
    function checkout() {
        if (cart.length === 0) {
            showStatus('سلة المشتريات فارغة', 'error');
            return;
        }
        
        try {
            var cartElement = document.getElementById('cartOffcanvas');
            if (cartElement && bootstrap && bootstrap.Offcanvas) {
                var cartOffcanvas = bootstrap.Offcanvas.getInstance(cartElement);
                if (cartOffcanvas) {
                    cartOffcanvas.hide();
                }
            }
        } catch (e) {
            console.error('خطأ في إخفاء السلة:', e);
        }
        
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].quantity;
        }
        
        document.getElementById('productName').value = cart.length + ' منتجات مختلفة';
        document.getElementById('productPriceValue').value = total;
        document.getElementById('productImageUrl').value = cart[0] && cart[0].image ? cart[0].image : '';
        
        document.getElementById('productNameDisplay').textContent = cart.length + ' منتجات مختلفة';
        document.getElementById('productPrice').textContent = total.toLocaleString() + ' DA';
        var productImage = document.getElementById('productImage');
        if (cart[0] && cart[0].image) {
            productImage.src = cart[0].image;
            productImage.style.display = 'block';
        } else {
            productImage.style.display = 'none';
        }
        
        document.getElementById('orderForm').reset();
        document.getElementById('cashOnDelivery').checked = true;
        
        if (orderModal) {
            orderModal.show();
        }
    }
    
    // ============== وظائف الطلب ==============
    async function submitOrder() {
        var productName = document.getElementById('productName').value;
        var productPrice = document.getElementById('productPriceValue').value;
        var productImage = document.getElementById('productImageUrl').value;
        var fullName = document.getElementById('fullName').value;
        var phone = document.getElementById('phone').value;
        var email = document.getElementById('email').value || 'لم يتم تقديمه';
        var wilaya = document.getElementById('wilaya').value;
        var address = document.getElementById('address').value || 'غير محدد';
        var paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        paymentMethod = paymentMethod ? paymentMethod.value : 'cash';
        
        if (!fullName || !phone || !wilaya) {
            showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        var phoneRegex = /^0[5-7][0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            showStatus('رقم الهاتف غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 05 أو 06 أو 07', 'error');
            return;
        }
        
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].quantity;
        }
        
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
        
        showStatus('جاري معالجة طلبك...', 'loading');
        
        var submitBtn = document.getElementById('submitOrderBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري المعالجة...';
        
        try {
            var docRef = await db.collection('orders').add(orderData);
            console.log("تم تخزين الطلب في Firebase:", docRef.id);
            
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
            
            if (typeof emailjs !== 'undefined') {
                await emailjs.send("service_lc1q5k8", "template_a15g7yg", {
                    order_id: docRef.id,
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
                console.log("تم إرسال إيميل تأكيد الطلب");
            }
            
            showStatus('<div class="text-center">' +
                '<i class="bi bi-check-circle-fill text-success fs-1"></i>' +
                '<h5 class="mt-2">تم تأكيد طلبك بنجاح!</h5>' +
                '<div class="text-start mt-3">' +
                '<p><strong>رقم الطلب:</strong> ' + docRef.id + '</p>' +
                '<p><strong>الاسم:</strong> ' + fullName + '</p>' +
                '<p><strong>عدد المنتجات:</strong> ' + cart.length + ' منتجات</p>' +
                '<p><strong>المبلغ الإجمالي:</strong> ' + total.toLocaleString() + ' د.ج</p>' +
                '<p class="mt-3">سيتم التواصل معك على الرقم <strong>' + phone + '</strong> خلال 24 ساعة لتأكيد الشحن.</p>' +
                '</div>' +
                '<a href="https://wa.me/213656360457?text=' + encodeURIComponent(
                    'استفسار عن الطلب ' + docRef.id + '\nالاسم: ' + fullName + '\nعدد المنتجات: ' + cart.length + '\nالمجموع: ' + total.toLocaleString() + ' د.ج\nرقم الهاتف: ' + phone
                ) + '" class="btn whatsapp-contact-btn mt-2 w-100" target="_blank">' +
                '<i class="bi bi-whatsapp"></i> تواصل عبر واتساب (اختياري)' +
                '</a>' +
                '</div>', 'success');
            
            cart = [];
            localStorage.removeItem('robuste_cart');
            updateCartCount();
            document.getElementById('orderForm').reset();
            if (orderModal) {
                orderModal.hide();
            }
            
        } catch (error) {
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
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'تأكيد الطلب';
        }
    }
    
    // ============== وظائف الاتصال ==============
    async function sendContactMessage() {
        var name = document.getElementById('contactName').value;
        var email = document.getElementById('contactEmail').value;
        var phone = document.getElementById('contactPhone').value || 'لم يتم تقديمه';
        var message = document.getElementById('contactMessage').value;
        
        if (!name || !email || !message) {
            showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        var contactSpinner = document.getElementById('contactSpinner');
        var contactSubmitText = document.getElementById('contactSubmitText');
        contactSpinner.classList.remove('d-none');
        contactSubmitText.textContent = 'جاري الإرسال...';
        
        try {
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
                showStatus('خدمة البريد الإلكتروني غير متوفرة حالياً', 'error');
            }
        } catch (error) {
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
        } finally {
            contactSpinner.classList.add('d-none');
            contactSubmitText.textContent = 'إرسال الرسالة';
        }
    }
    
    // ============== وظائف مساعدة ==============
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
    
    function startOfferTimer() {
        var daysElement = document.getElementById('days');
        var hoursElement = document.getElementById('hours');
        var minutesElement = document.getElementById('minutes');
        var secondsElement = document.getElementById('seconds');
        
        if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;
        
        var endDate = new Date();
        endDate.setDate(endDate.getDate() + 3);
        
        function updateTimer() {
            var now = new Date();
            var difference = endDate - now;
            
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
            
            daysElement.textContent = days.toString().padStart(2, '0');
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
        
        updateTimer();
        setInterval(updateTimer, 1000);
    }
    
    function showStatus(message, type) {
        var indicator = document.getElementById('statusIndicator');
        var messageElement = document.getElementById('statusMessage');
        
        if (!indicator || !messageElement) return;
        
        messageElement.innerHTML = message;
        
        var alert = indicator.querySelector('.alert');
        if (alert) {
            alert.className = 'alert alert-dismissible fade show';
            
            if (type === 'success') {
                alert.classList.add('alert-success', 'order-confirmation');
            } else if (type === 'error') {
                alert.classList.add('alert-danger', 'order-error');
            } else if (type === 'loading') {
                alert.classList.add('alert-info');
                messageElement.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>' + message;
            } else {
                alert.classList.add('alert-info');
            }
        }
        
        indicator.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(hideStatus, 5000);
        }
    }
    
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
        
        for (var i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        
        slides[slideIndex1 - 1].style.display = "block";
        if (dots.length > 0) {
            dots[slideIndex1 - 1].className += " active";
        }
    }
    
    function plusSlides1(n) {
        showSlides1(slideIndex1 += n);
    }
    
    function currentSlide1(n) {
        showSlides1(slideIndex1 = n);
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
        
        localStorage.setItem('theme', newTheme);
    }
    
    function initDarkMode() {
        var savedTheme = localStorage.getItem('theme') || 'light';
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
    }
    
    // ============== تهيئة التطبيق ==============
    function initApp() {
        try {
            loadCart();
            updateCartCount();
            renderCart();
            loadAndDisplayProducts();
            setupCategoryFilters();
            setupAddToCartButtonsHandler();
            setupProductCardsHandler();
            loadSpecialOffers();
            populateWilayas();
            startOfferTimer();
            initDarkMode();
            
            showSlides1(slideIndex1);
            setInterval(function() {
                plusSlides1(1);
            }, 4000);
            
            // إعداد Modal
            var orderModalElement = document.getElementById('orderModal');
            if (orderModalElement && bootstrap && bootstrap.Modal) {
                orderModal = new bootstrap.Modal(orderModalElement);
            }
            
            // إعداد أحداث السلة
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
            
            // إعداد حدث إرسال الطلب
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
            
            // إعداد حدث الاتصال
            var contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    sendContactMessage();
                });
            }
            
            // تحسين تجربة اللمس على iOS
            document.addEventListener('touchstart', function() {
                touchMoved = false;
            }, { passive: true });
            
            document.addEventListener('touchmove', function() {
                touchMoved = true;
            }, { passive: true });
            
            document.addEventListener('touchend', function(e) {
                if (!touchMoved) {
                    var now = Date.now();
                    if (now - lastTouchEnd < 300) {
                        e.preventDefault();
                    }
                    lastTouchEnd = now;
                }
            }, { passive: false });
            
            console.log('التطبيق جاهز للعمل على جميع المتصفحات');
            
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
        }
    }
    
    // بدء التطبيق عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
    
    // تصدير الوظائف العامة
    window.toggleCart = toggleCart;
    window.checkout = checkout;
    window.submitOrder = submitOrder;
    window.sendContactMessage = sendContactMessage;
    window.toggleDarkMode = toggleDarkMode;
    window.plusSlides1 = plusSlides1;
    window.currentSlide1 = currentSlide1;
})();
