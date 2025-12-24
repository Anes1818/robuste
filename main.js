(function() {
'use strict';// ============== تهيئة Firebase ==============
var firebaseConfig = {
    apiKey: "AIzaSyBTrnKCYOtfSSDYtmVQbzP2HcwgkLT565Y",
    authDomain: "robuste-c8e0f.firebaseapp.com",
    projectId: "robuste-c8e0f",
    storageBucket: "robuste-c8e0f.appspot.com",
    messagingSenderId: "975609984963",
    appId: "1:975609984963:web:a481efb493a88d7bc7af76",
    measurementId: "G-DWT7MZN028"
};

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}
var db = firebase && firebase.firestore ? firebase.firestore() : null;

// تهيئة EmailJS
if (typeof emailjs !== 'undefined') {
    emailjs.init("k77vdaUWPpnLrfTnS");
}

// ============== المتغيرات العامة ==============
var orderModal = null;
var cart = [];

// قائمة الولايات الجزائرية
var wilayas = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة",
    "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل",
    "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم",
    "المسيلة", "معسكر", "ورقلة", "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف",
    "تيندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة",
    "عين تموشنت", "غرداية", "غليزان"
];

// ============== نظام المنتجات ==============
function loadAndDisplayProducts(category) {
    if (!category) category = 'all';
    fetch('products.json')
        .then(function(response) {
            if (!response.ok) throw new Error('Erreur lors du chargement des produits');
            return response.json();
        })
        .then(function(products) {
            var filteredProducts = category === 'all' ? products : products.filter(function(product) {
                return product.category === category;
            });
            renderProducts(filteredProducts);
        })
        .catch(function(error) {
            console.error('Erreur:', error);
            showStatus('Erreur lors du chargement des produits', 'error');
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
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        var discountBadge = '';
        if (product.old_price && product.old_price > product.price) {
            var discountPercent = Math.round(((product.old_price - product.price) / product.old_price) * 100);
            discountBadge = '<div class="discount-badge">خصم ' + discountPercent + '%</div>';
        }
        var oldPrice = '';
        if (product.old_price && product.old_price > product.price) {
            oldPrice = '<small dir="ltr" class="text-decoration-line-through text-muted me-2">' + product.old_price.toLocaleString() + ' DA</small>';
        }
        var productBadge = product.badge ? '<div class="product-badge">' + product.badge + '</div>' : '';
        var carouselIndicators = '';
        var carouselItems = '';
        if (product.images && product.images.length) {
            for (var j = 0; j < product.images.length; j++) {
                var activeClass = j === 0 ? 'active' : '';
                var activeAttr = j === 0 ? 'class="active" aria-current="true"' : '';
                carouselIndicators += '<button type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide-to="' + j + '" ' + activeAttr + ' aria-label="صورة ' + (j + 1) + '"></button>';
                carouselItems += '<div class="carousel-item ' + activeClass + '"><img src="' + product.images[j] + '" class="d-block w-100" alt="' + product.title + '" loading="lazy"></div>';
            }
        }
        var carouselControls = product.images && product.images.length > 1 ? '<button class="carousel-control-prev" type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">السابق</span></button><button class="carousel-control-next" type="button" data-bs-target="#carousel-' + product.id + '" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">التالي</span></button>' : '';
        var productCard = '<div class="col-6 col-md-4 col-lg-3 mb-4"><div class="product-card card h-100 position-relative" role="link" tabindex="0" data-pid="' + product.id + '">' + productBadge + discountBadge + '<div id="carousel-' + product.id + '" class="carousel slide product-carousel" data-bs-ride="carousel"><div class="carousel-indicators">' + carouselIndicators + '</div><div class="carousel-inner">' + carouselItems + '</div>' + carouselControls + '</div><div class="card-body"><h5 class="product-title card-title">' + product.title + '</h5><p class="card-text text-muted small">' + (product.description_short || '') + '</p><div class="price-section d-flex align-items-center mt-2">' + oldPrice + '<p dir="ltr" class="current-price fw-bold mb-0">' + product.price.toLocaleString() + ' DA</p></div></div><div class="card-footer bg-transparent border-0"><button class="btn btn-orange w-100 add-to-cart-btn" data-id="' + product.id + '" aria-label="Ajouter ' + product.title + ' au panier"><i class="bi bi-cart-plus"></i>&nbsp;Ajouter au panier</button></div></div></div>';
        container.insertAdjacentHTML('beforeend', productCard);
    }
    setupCardClickHandlers();
}

function setupCardClickHandlers() {
    var cards = document.querySelectorAll('.product-card[data-pid]');
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        card.addEventListener('click', handleCardClick);
        card.addEventListener('keydown', handleCardKeydown);
    }
}

function handleCardClick(e) {
    if (e.target.closest('button, a, input, select, textarea, .carousel-control, .carousel-indicators')) return;
    var card = e.currentTarget;
    var pid = card.getAttribute('data-pid');
    if (pid) {
        window.location.href = 'product.html?pid=' + encodeURIComponent(pid);
    }
}

function handleCardKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var card = e.currentTarget;
        var pid = card.getAttribute('data-pid');
        if (pid) window.location.href = 'product.html?pid=' + encodeURIComponent(pid);
    }
}

function loadSpecialOffers() {
    fetch('products.json')
        .then(function(response) {
            if (!response.ok) throw new Error('Erreur lors du chargement des produits');
            return response.json();
        })
        .then(function(products) {
            var specialOffers = products.filter(function(product) {
                return product.old_price && product.old_price > product.price;
            }).slice(0, 3);
            renderSpecialOffers(specialOffers);
        })
        .catch(function(error) {
            console.error('Erreur lors du chargement des offres spéciales:', error);
        });
}

function renderSpecialOffers(offers) {
    var container = document.getElementById('specialOffersContainer');
    if (!container) return;
    if (!offers || offers.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">Aucune offre spéciale pour le moment</div>';
        return;
    }
    container.innerHTML = '';
    for (var i = 0; i < offers.length; i++) {
        var product = offers[i];
        var discountPercentage = Math.round(((product.old_price - product.price) / product.old_price) * 100);
        var badgeHTML = product.badge ? '<div class="offer-product-badge">' + product.badge + '</div>' : '';
        var indicators = '';
        var items = '';
        if (product.images && product.images.length) {
            for (var j = 0; j < product.images.length; j++) {
                var active = j === 0 ? 'active' : '';
                indicators += '<button type="button" data-bs-target="#carousel-offer-' + product.id + '" data-bs-slide-to="' + j + '" ' + (j === 0 ? 'class="active"' : '') + '></button>';
                items += '<div class="carousel-item ' + active + '"><img src="' + product.images[j] + '" class="d-block w-100" alt="' + product.title + '" height="300" loading="lazy"></div>';
            }
        }
        var offerHTML = '<div class="col-md-4"><div class="offer-product"><div class="offer-product-discount">-' + discountPercentage + '%</div>' + badgeHTML + '<div id="carousel-offer-' + product.id + '" class="carousel slide" data-bs-ride="carousel"><div class="carousel-indicators">' + indicators + '</div><div class="carousel-inner">' + items + '</div><button class="carousel-control-prev" type="button" data-bs-target="#carousel-offer-' + product.id + '" data-bs-slide="prev"><span class="carousel-control-prev-icon"></span></button><button class="carousel-control-next" type="button" data-bs-target="#carousel-offer-' + product.id + '" data-bs-slide="next"><span class="carousel-control-next-icon"></span></button></div><h4 class="offer-product-title">' + product.title + '</h4><div class="offer-product-price">' + product.price.toLocaleString() + ' DA</div><div class="offer-product-old-price">' + product.old_price.toLocaleString() + ' DA</div><button class="offer-btn add-to-cart-btn" data-id="' + product.id + '"><i class="bi bi-cart-plus"></i> Acheter maintenant</button></div></div>';
        container.insertAdjacentHTML('beforeend', offerHTML);
    }
}

// ============== الفئات ==============
function setupCategoryFilters() {
    var buttons = document.querySelectorAll('.category-btn');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', handleCategoryClick);
    }
}

function handleCategoryClick() {
    var buttons = document.querySelectorAll('.category-btn');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    this.classList.add('active');
    var category = this.getAttribute('data-category');
    loadAndDisplayProducts(category);
}

// ============== سلة المشتريات ==============
function loadCart() {
    try {
        var cartData = localStorage.getItem('robuste_cart');
        cart = cartData ? JSON.parse(cartData) : [];
    } catch (e) {
        console.error('خطأ في تحميل سلة المشتريات:', e);
        cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem('robuste_cart', JSON.stringify(cart));
    } catch (e) {
        console.error('خطأ في حفظ السلة:', e);
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
    checkoutBtn.disabled = count === 0;
}

function renderCart() {
    var cartItems = document.getElementById('cartItems');
    var cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;
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
        itemElement.innerHTML = '<div class="d-flex"><img src="' + (item.image || '') + '" alt="' + (item.name || 'منتج') + '" class="cart-item-img me-3"><div class="cart-item-details"><div class="cart-item-title">' + (item.name || 'منتج بدون اسم') + '</div><div class="cart-item-price">' + (item.price || 0) + ' د.ج</div><div class="quantity-controls"><button class="quantity-btn" data-action="decrease" data-index="' + i + '">-</button><input type="number" class="quantity-input" value="' + (item.quantity || 1) + '" min="1" data-index="' + i + '"><button class="quantity-btn" data-action="increase" data-index="' + i + '">+</button></div></div><button class="remove-item align-self-start" data-index="' + i + '"><i class="bi bi-trash"></i></button></div>';
        cartItems.appendChild(itemElement);
    }
    cartTotal.textContent = total.toLocaleString('ar-DZ') + ' د.ج';
    attachCartEventListeners();
}

function attachCartEventListeners() {
    var quantityBtns = document.querySelectorAll('.quantity-btn');
    for (var i = 0; i < quantityBtns.length; i++) {
        quantityBtns[i].addEventListener('click', handleQuantityBtnClick);
    }
    var quantityInputs = document.querySelectorAll('.quantity-input');
    for (var j = 0; j < quantityInputs.length; j++) {
        quantityInputs[j].addEventListener('change', handleQuantityInputChange);
        quantityInputs[j].addEventListener('keydown', preventNonNumericInput);
    }
    var removeBtns = document.querySelectorAll('.remove-item');
    for (var k = 0; k < removeBtns.length; k++) {
        removeBtns[k].addEventListener('click', handleRemoveItemClick);
    }
}

function handleQuantityBtnClick() {
    var index = parseInt(this.getAttribute('data-index'), 10);
    var action = this.getAttribute('data-action');
    if (isNaN(index) || index < 0 || index >= cart.length) return;
    var newQty = cart[index].quantity;
    if (action === 'increase') {
        newQty += 1;
    } else if (action === 'decrease') {
        newQty -= 1;
    }
    updateQuantity(index, newQty);
}

function handleQuantityInputChange() {
    var index = parseInt(this.getAttribute('data-index'), 10);
    if (isNaN(index) || index < 0 || index >= cart.length) return;
    var newQty = parseInt(this.value, 10) || 1;
    updateQuantity(index, newQty);
}

function preventNonNumericInput(e) {
    if (!/[\d\b\t\n]|Arrow|Delete|Backspace|Tab/.test(e.key) && !(e.ctrlKey || e.metaKey)) {
        e.preventDefault();
    }
}

function handleRemoveItemClick() {
    var index = parseInt(this.getAttribute('data-index'), 10);
    if (isNaN(index) || index < 0 || index >= cart.length) return;
    removeFromCart(index);
}

function addToCart(productName, productPrice, priceValue, productImages, productId) {
    var name = typeof productName === 'string' ? productName : 'منتج بدون اسم';
    var price = typeof priceValue === 'number' ? priceValue : (typeof productPrice === 'number' ? productPrice : 0);
    var id = productId || Date.now().toString();
    var image = '';
    if (Array.isArray(productImages) && productImages.length > 0) {
        image = productImages[0];
    } else if (typeof productImages === 'string') {
        image = productImages;
    }
    var existingIndex = -1;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            existingIndex = i;
            break;
        }
    }
    if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    saveCart();
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
    saveCart();
    renderCart();
    updateCartCount();
}

function removeFromCart(index) {
    if (isNaN(index) || index < 0 || index >= cart.length) return;
    var productName = cart[index].name || 'منتج';
    cart.splice(index, 1);
    saveCart();
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
        var cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    } catch (e) {
        console.error('خطأ في فتح السلة:', e);
        document.getElementById('cartOffcanvas').classList.add('show');
        document.body.classList.add('offcanvas-open');
    }
}

function checkout() {
    if (cart.length === 0) {
        showStatus('سلة المشتريات فارغة', 'error');
        return;
    }
    var cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
    if (cartOffcanvas) cartOffcanvas.hide();
    var firstItem = cart[0];
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
        total += cart[i].price * cart[i].quantity;
    }
    document.getElementById('productName').value = cart.length + ' منتجات مختلفة';
    document.getElementById('productPriceValue').value = total;
    document.getElementById('productImageUrl').value = firstItem.image || '';
    document.getElementById('productNameDisplay').textContent = cart.length + ' منتجات مختلفة';
    document.getElementById('productPrice').textContent = total.toLocaleString() + ' DA';
    document.getElementById('productImage').src = firstItem.image || '';
    document.getElementById('orderForm').reset();
    document.getElementById('cashOnDelivery').checked = true;
    if (orderModal) orderModal.show();
}

// ============== الطلبات ==============
function submitOrder() {
    var productName = document.getElementById('productName').value;
    var productPrice = document.getElementById('productPriceValue').value;
    var productImage = document.getElementById('productImageUrl').value;
    var fullName = document.getElementById('fullName').value;
    var phone = document.getElementById('phone').value;
    var email = document.getElementById('email').value || 'لم يتم تقديمه';
    var wilaya = document.getElementById('wilaya').value;
    var address = document.getElementById('address').value || 'غير محدد';
    var paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    paymentMethod = paymentMethod ? paymentMethod.value : null;
    if (!fullName || !phone || !wilaya || !paymentMethod) {
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
    if (db) {
        db.collection('orders').add(orderData).then(function(docRef) {
            console.log("تم تخزين الطلب في Firebase:", docRef.id);
            var productsList = '';
            for (var j = 0; j < cart.length; j++) {
                var item = cart[j];
                productsList += '<div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee;"><strong>المنتج:</strong> ' + item.name + ' <br><strong>الكمية:</strong> ' + item.quantity + ' <br><strong>السعر:</strong> ' + item.price.toLocaleString() + ' د.ج <br><strong>المجموع:</strong> ' + (item.price * item.quantity).toLocaleString() + ' د.ج</div>';
            }
            if (typeof emailjs !== 'undefined') {
                emailjs.send("service_lc1q5k8", "template_a15g7yg", {
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
                }).then(function() {
                    console.log("تم إرسال إيميل تأكيد الطلب");
                    showSuccess(docRef.id, fullName, cart.length, total, phone);
                }).catch(function(emailError) {
                    console.error("EmailJS error:", emailError);
                    showSuccess(docRef.id, fullName, cart.length, total, phone);
                });
            } else {
                showSuccess(docRef.id, fullName, cart.length, total, phone);
            }
        }).catch(function(error) {
            console.error('حدث خطأ:', error);
            showStatus('حدث خطأ أثناء إرسال الطلب: ' + (error.message || 'خطأ غير معروف'), 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'تأكيد الطلب';
        });
    } else {
        showStatus('قاعدة البيانات غير متاحة', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'تأكيد الطلب';
    }
}

function showSuccess(orderId, name, count, total, phone) {
    var msg = '<div class="text-center"><i class="bi bi-check-circle-fill text-success fs-1"></i><h5 class="mt-2">تم تأكيد طلبك بنجاح!</h5><div class="text-start mt-3"><p><strong>رقم الطلب:</strong> ' + orderId + '</p><p><strong>الاسم:</strong> ' + name + '</p><p><strong>عدد المنتجات:</strong> ' + count + ' منتجات</p><p><strong>المبلغ الإجمالي:</strong> ' + total.toLocaleString() + ' د.ج</p><p class="mt-3">سيتم التواصل معك على الرقم <strong>' + phone + '</strong> خلال 24 ساعة لتأكيد الشحن.</p></div><a href="https://wa.me/213656360457?text=' + encodeURIComponent('استفسار عن الطلب ' + orderId + '\nالاسم: ' + name + '\nعدد المنتجات: ' + count + '\nالمجموع: ' + total.toLocaleString() + ' د.ج\nرقم الهاتف: ' + phone) + '" class="btn whatsapp-contact-btn mt-2 w-100" target="_blank"><i class="bi bi-whatsapp"></i> تواصل عبر واتساب (اختياري)</a></div>';
    showStatus(msg, 'success');
    cart = [];
    localStorage.removeItem('robuste_cart');
    updateCartCount();
    document.getElementById('orderForm').reset();
    if (orderModal) orderModal.hide();
    var submitBtn = document.getElementById('submitOrderBtn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'تأكيد الطلب';
}

// ============== الاتصال ==============
function sendContactMessage() {
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
    if (typeof emailjs !== 'undefined') {
        emailjs.send("service_lc1q5k8", "template_11pkq0k", {
            from_name: name,
            from_email: email,
            phone_number: phone,
            message: message
        }).then(function() {
            console.log("تم إرسال رسالة الاتصال");
            showStatus('تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً.', 'success');
            document.getElementById('contactForm').reset();
        }).catch(function(error) {
            console.error('حدث خطأ:', error);
            showStatus('حدث خطأ أثناء إرسال الرسالة: ' + (error.text || error.message || 'خطأ غير معروف'), 'error');
        }).finally(function() {
            contactSpinner.classList.add('d-none');
            contactSubmitText.textContent = 'إرسال الرسالة';
        });
    } else {
        showStatus('خدمة البريد غير متاحة', 'error');
        contactSpinner.classList.add('d-none');
        contactSubmitText.textContent = 'إرسال الرسالة';
    }
}

// ============== وظائف مساعدة ==============
function populateWilayas() {
    var wilayaSelect = document.getElementById('wilaya');
    if (!wilayaSelect) return;
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
        default:
            alert.classList.add('alert-info');
    }
    indicator.style.display = 'block';
    if (type === 'success') {
        setTimeout(hideStatus, 5000);
    }
}

function hideStatus() {
    var indicator = document.getElementById('statusIndicator');
    if (indicator) indicator.style.display = 'none';
}

// ============== السلايدر ==============
var slideIndex1 = 1;
function showSlides1(n) {
    var slides = document.getElementsByClassName("mySlides1");
    var dots = document.getElementsByClassName("dot1");
    if (!slides.length || !dots.length) return;
    if (n > slides.length) slideIndex1 = 1;
    if (n < 1) slideIndex1 = slides.length;
    for (var i = 0; i < slides.length; i++) slides[i].style.display = "none";
    for (var j = 0; j < dots.length; j++) dots[j].className = dots[j].className.replace(" active", "");
    slides[slideIndex1 - 1].style.display = "block";
    dots[slideIndex1 - 1].className += " active";
}
function plusSlides1(n) { showSlides1(slideIndex1 += n); }
function currentSlide1(n) { showSlides1(slideIndex1 = n); }
function initSlideshow() {
    showSlides1(slideIndex1);
    setInterval(function() { plusSlides1(1); }, 4000);
}

// ============== Dark Mode ==============
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
        themeToggle.addEventListener('click', toggleDarkMode);
    }
}

// ============== Mobile Optimizations ==============
function adjustOrderModalForMobile() {
    var modal = document.getElementById('orderModal');
    if (!modal) return;
    var isMobile = window.innerWidth <= 768;
    if (isMobile) {
        var modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.style.maxHeight = '70vh';
            modalBody.style.overflowY = 'auto';
        }
        var inputs = modal.querySelectorAll('.form-control, .form-select');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].style.minHeight = '44px';
        }
    }
}

// ============== Event Handlers Setup ==============
function setupAddToCartButtons() {
    if (setupAddToCartButtons._initialized) return;
    setupAddToCartButtons._initialized = true;
    document.addEventListener('click', function(e) {
        var button = e.target.closest('.add-to-cart-btn');
        if (!button) return;
        if (button.dataset.processing === 'true') return;
        button.dataset.processing = 'true';
        setTimeout(function() { delete button.dataset.processing; }, 300);
        e.preventDefault();
        e.stopPropagation();
        var productId = button.getAttribute('data-id');
        if (!productId) return;
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
            });
    });
}

// ============== تهيئة الصفحة ==============
function initPage() {
    initDarkMode();
    loadCart();
    loadAndDisplayProducts();
    setupCategoryFilters();
    setupAddToCartButtons();
    loadSpecialOffers();
    populateWilayas();
    startOfferTimer();
    if (typeof bootstrap !== 'undefined') {
        orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
    }
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendContactMessage();
        });
    }
    updateCartCount();
    renderCart();
    initSlideshow();
    var orderModalEl = document.getElementById('orderModal');
    if (orderModalEl) {
        orderModalEl.addEventListener('show.bs.modal', adjustOrderModalForMobile);
    }
    window.addEventListener('resize', adjustOrderModalForMobile);
    // إضافة معالجات اللمس لأزرار السلة والمنتجات
    var cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            toggleCart();
        });
    }
    var whatsappBtn = document.querySelector('.whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            window.open(this.href, '_blank');
        });
    }
}

// ============== Global Error Handling ==============
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// بدء التهيئة عند تحميل DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
} })();
