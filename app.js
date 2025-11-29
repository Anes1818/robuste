// app.js - Robuste Eulma E-commerce Application
// Polyfill for older browsers compatibility

// ============== POLYFILLS FOR OLDER BROWSERS ==============

// Polyfill for Array.from for older Safari versions
if (!Array.from) {
    Array.from = (function () {
        var toStr = Object.prototype.toString;
        var isCallable = function (fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value) {
            var number = Number(value);
            if (isNaN(number)) { return 0; }
            if (number === 0 || !isFinite(number)) { return number; }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };

        return function from(arrayLike/*, mapFn, thisArg */) {
            var C = this;
            var items = Object(arrayLike);
            if (arrayLike == null) {
                throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
                if (!isCallable(mapFn)) {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }
                if (arguments.length > 2) {
                    T = arguments[2];
                }
            }
            var len = toLength(items.length);
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);
            var k = 0;
            var kValue;
            while (k < len) {
                kValue = items[k];
                if (mapFn) {
                    A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                } else {
                    A[k] = kValue;
                }
                k += 1;
            }
            A.length = len;
            return A;
        };
    })();
}

// Polyfill for NodeList.forEach for older Safari versions
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function(callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

// ============== APPLICATION CONSTANTS AND CONFIGURATION ==============

const firebaseConfig = {
    apiKey: "AIzaSyBTrnKCYOtfSSDYtmVQbzP2HcwgkLT565Y",
    authDomain: "robuste-c8e0f.firebaseapp.com",
    projectId: "robuste-c8e0f",
    storageBucket: "robuste-c8e0f.appspot.com",
    messagingSenderId: "975609984963",
    appId: "1:975609984963:web:a481efb493a88d7bc7af76",
    measurementId: "G-DWT7MZN028"
};

// EmailJS Configuration
const ORDER_SERVICE_ID = "service_lc1q5k8";
const ORDER_TEMPLATE_ID = "template_a15g7yg";
const CONTACT_TEMPLATE_ID = "template_11pkq0k";

// Algerian Wilayas List
const wilayas = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة",
    "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل",
    "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم",
    "المسيلة", "معسكر", "ورقلة", "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف",
    "تيندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة",
    "عين تموشنت", "غرداية", "غليزان"
];

// ============== GLOBAL VARIABLES ==============

let cart = [];
let orderModal = null;
let currentCategory = 'all';
let slideIndex1 = 1;

// ============== FIREBASE AND EMAILJS INITIALIZATION ==============

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Initialize EmailJS
(function() {
    emailjs.init("k77vdaUWPpnLrfTnS");
})();

// ============== CART MANAGEMENT SYSTEM ==============

/**
 * Initialize cart from localStorage
 */
function initializeCart() {
    try {
        const cartData = localStorage.getItem('robuste_cart');
        if (cartData) {
            cart = JSON.parse(cartData);
        }
    } catch (e) {
        console.error('Error loading cart:', e);
        cart = [];
    }
    updateCartCount();
    renderCart();
}

/**
 * Update cart count in the UI
 */
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartCount || !checkoutBtn) return;
    
    const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    cartCount.textContent = count;
    checkoutBtn.disabled = count === 0;
}

/**
 * Render cart items in the offcanvas
 */
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems || !cartTotal) return;
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-4 text-muted" id="emptyCartMessage">
                <i class="bi bi-cart-x display-4 d-block mb-2"></i>
                Panier d'achat فارغة
            </div>
        `;
        cartTotal.textContent = '0 د.ج';
        return;
    }
    
    let total = 0;
    cart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="d-flex">
                <img src="${item.image || ''}" alt="${item.name || 'منتج'}" class="cart-item-img me-3">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name || 'منتج بدون اسم'}</div>
                    <div class="cart-item-price">${item.price || 0} د.ج</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity || 1}" min="1" 
                               onchange="updateCartItemQuantity(${index}, parseInt(this.value))">
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-item align-self-start" onclick="removeFromCart(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        cartItems.appendChild(itemElement);
    });
    
    cartTotal.textContent = `${total.toLocaleString('ar-DZ')} د.ج`;
}

/**
 * Add product to cart
 */
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
    
    const existingItemIndex = cart.findIndex(item => item.id === id);
    
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
    
    saveCart();
    updateCartCount();
    renderCart();
    showStatus(`تمت إضافة "${name}" إلى السلة`, 'success');
}

/**
 * Update item quantity in cart
 */
function updateCartItemQuantity(index, newQuantity) {
    if (index < 0 || index >= cart.length) return;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    cart[index].quantity = newQuantity;
    saveCart();
    renderCart();
    updateCartCount();
}

/**
 * Remove item from cart
 */
function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    
    const productName = cart[index].name || 'منتج';
    cart.splice(index, 1);
    
    saveCart();
    renderCart();
    updateCartCount();
    showStatus(`تمت إزالة "${productName}" من السلة`, 'success');
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    try {
        localStorage.setItem('robuste_cart', JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart:', e);
        showStatus('تعذر حفظ السلة، قد تكون ذاكرة التخزين ممتلئة', 'error');
    }
}

/**
 * Toggle cart offcanvas visibility
 */
function toggleCart() {
    if (cart.length === 0) {
        showStatus('سلة المشتريات فارغة', 'info');
        return;
    }
    
    try {
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    } catch (e) {
        console.error('Error opening cart:', e);
    }
}

// ============== PRODUCT MANAGEMENT SYSTEM ==============

/**
 * Load products from JSON file
 */
async function loadProductsFromJSON() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des produits');
        }
        const products = await response.json();
        console.log('Produits chargés:', products.length, 'produits');
        return products;
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Erreur lors du chargement des produits', 'error');
        return [];
    }
}

/**
 * Load and display special offers
 */
async function loadSpecialOffers() {
    try {
        const products = await loadProductsFromJSON();
        
        const specialOffers = products
            .filter(product => product.old_price && product.old_price > product.price)
            .slice(0, 3);
        
        console.log('Offres spéciales chargées:', specialOffers.length, 'produits');
        renderSpecialOffers(specialOffers);
    } catch (error) {
        console.error('Erreur lors du chargement des offres spéciales:', error);
    }
}

/**
 * Render special offers in the offers section
 */
function renderSpecialOffers(offers) {
    const offersContainer = document.querySelector('.offer-products');
    if (!offersContainer) return;
    
    if (offers.length === 0) {
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

                    <div id="carousel-offer-${product.id}" class="carousel slide" data-bs-ride="carousel">
                        <div class="carousel-indicators">
                            ${product.images.map((_, i) => `
                                <button type="button" data-bs-target="#carousel-offer-${product.id}" data-bs-slide-to="${i}" 
                                    ${i === 0 ? 'class="active"' : ''}></button>
                            `).join('')}
                        </div>
                        <div class="carousel-inner">
                            ${product.images.map((img, i) => `
                                <div class="carousel-item ${i === 0 ? 'active' : ''}">
                                    <img src="${img}" class="d-block w-100" alt="${product.title}" height="300" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#carousel-offer-${product.id}" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon"></span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#carousel-offer-${product.id}" data-bs-slide="next">
                            <span class="carousel-control-next-icon"></span>
                        </button>
                    </div>

                    <h4 class="offer-product-title">${product.title}</h4>
                    <div class="offer-product-price">${product.price.toLocaleString()} DA</div>
                    <div class="offer-product-old-price">${product.old_price.toLocaleString()} DA</div>
                    <a href="product.html?pid=${product.id}" class="offer-btn" style="display: block; text-decoration: none; text-align: center; color: inherit;">
                        Voir le produit
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// ============== ORDER MANAGEMENT SYSTEM ==============

/**
 * Show order modal for single product
 */
function showOrderModal(productName, productPrice, priceValue, productImages) {
    const mainImage = Array.isArray(productImages) ? productImages[0] : productImages;
    
    document.getElementById('productName').value = productName;
    document.getElementById('productPriceValue').value = priceValue;
    document.getElementById('productImageUrl').value = mainImage;
    
    document.getElementById('productNameDisplay').textContent = productName;
    document.getElementById('productPrice').textContent = productPrice;
    document.getElementById('productImage').src = mainImage;
    
    document.getElementById('orderForm').reset();
    document.getElementById('quantity').value = 1;
    document.getElementById('cashOnDelivery').checked = true;
    orderModal.show();
}

/**
 * Checkout process - show order modal for cart items
 */
async function checkout() {
    if (cart.length === 0) {
        showStatus('سلة المشتريات فارغة', 'error');
        return;
    }
    
    const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
    cartOffcanvas.hide();
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const firstItem = cart[0];
    
    document.getElementById('productName').value = `${cart.length} منتجات مختلفة`;
    document.getElementById('productPriceValue').value = total;
    document.getElementById('productImageUrl').value = firstItem.image;
    
    document.getElementById('productNameDisplay').textContent = `${cart.length} منتجات مختلفة`;
    document.getElementById('productPrice').textContent = `${total.toLocaleString()} د.ج`;
    document.getElementById('productImage').src = firstItem.image;
    
    orderModal.show();
}

/**
 * Submit order to Firebase and send email
 */
async function submitOrder() {
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value || 'لم يتم تقديمه';
    const wilaya = document.getElementById('wilaya').value;
    const address = document.getElementById('address').value || 'غير محدد';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (!fullName || !phone || !wilaya) {
        showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const phoneRegex = /^0[5-7][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
        showStatus('رقم الهاتف غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 05 أو 06 أو 07', 'error');
        return;
    }
    
    const orderData = {
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
    
    const submitBtn = document.getElementById('submitOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        جاري المعالجة...
    `;
    
    try {
        const docRef = await db.collection('orders').add(orderData);
        console.log("Commande enregistrée dans Firebase:", docRef.id);
        
        await sendOrderEmail(docRef.id, orderData);
        
        showSuccessMessage(docRef.id, fullName, phone, cart.length, total);
        
        cart = [];
        saveCart();
        updateCartCount();
        document.getElementById('orderForm').reset();
        orderModal.hide();
        
    } catch (error) {
        console.error('Erreur:', error);
        handleOrderError(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'تأكيد الطلب';
    }
}

/**
 * Send order confirmation email
 */
async function sendOrderEmail(orderId, orderData) {
    const productsList = orderData.products.map(item => `
        <div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee;">
            <strong>المنتج:</strong> ${item.name} <br>
            <strong>الكمية:</strong> ${item.quantity} <br>
            <strong>السعر:</strong> ${item.price.toLocaleString()} د.ج <br>
            <strong>المجموع:</strong> ${(item.price * item.quantity).toLocaleString()} د.ج
        </div>
    `).join('');
    
    await emailjs.send(ORDER_SERVICE_ID, ORDER_TEMPLATE_ID, {
        order_id: orderId,
        customer_name: orderData.customer,
        customer_phone: orderData.phone,
        customer_email: orderData.email,
        wilaya: orderData.wilaya,
        address: orderData.address,
        total_price: orderData.totalPrice.toLocaleString(),
        payment_method: orderData.payment,
        order_date: new Date().toLocaleString('ar-DZ'),
        products: productsList
    });
}

/**
 * Show success message after order submission
 */
function showSuccessMessage(orderId, customerName, phone, productsCount, total) {
    const whatsappMessage = encodeURIComponent(
        `استفسار عن الطلب ${orderId}\nالاسم: ${customerName}\nعدد المنتجات: ${productsCount}\nالمجموع: ${total.toLocaleString()} د.ج\nرقم الهاتف: ${phone}`
    );
    
    showStatus(`
        <div class="text-center">
            <i class="bi bi-check-circle-fill text-success fs-1"></i>
            <h5 class="mt-2">تم تأكيد طلبك بنجاح!</h5>
            <div class="text-start mt-3">
                <p><strong>رقم الطلب:</strong> ${orderId}</p>
                <p><strong>الاسم:</strong> ${customerName}</p>
                <p><strong>عدد المنتجات:</strong> ${productsCount} منتجات</p>
                <p><strong>المبلغ الإجمالي:</strong> ${total.toLocaleString()} د.ج</p>
                <p class="mt-3">سيتم التواصل معك على الرقم <strong>${phone}</strong> خلال 24 ساعة لتأكيد الشحن.</p>
            </div>
            <a href="https://wa.me/213656360457?text=${whatsappMessage}" class="btn whatsapp-contact-btn mt-2 w-100" target="_blank">
                <i class="bi bi-whatsapp"></i> تواصل عبر واتساب (اختياري)
            </a>
        </div>
    `, 'success');
}

/**
 * Handle order submission errors
 */
function handleOrderError(error) {
    if (error.code === 18 && navigator.userAgent.includes('Safari')) {
        console.warn("Safari false error ignoré");
        showStatus('تم إرسال رسالتك بنجاح! (Safari glitch)', 'success');
        return;
    }
    
    let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
    if (error.code) {
        errorMessage = `خطأ في النظام: ${error.code}`;
    } else if (error.message) {
        errorMessage = error.message;
    } else if (error.text) {
        errorMessage = error.text;
    }
    
    showStatus(`حدث خطأ أثناء إرسال الطلب: ${errorMessage}`, 'error');
}

// ============== CONTACT FORM SYSTEM ==============

/**
 * Send contact form message
 */
async function sendContactMessage() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value || 'لم يتم تقديمه';
    const message = document.getElementById('contactMessage').value;
    
    if (!name || !email || !message) {
        showStatus('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const contactSpinner = document.getElementById('contactSpinner');
    const contactSubmitText = document.getElementById('contactSubmitText');
    contactSpinner.classList.remove('d-none');
    contactSubmitText.textContent = 'جاري الإرسال...';
    
    try {
        await emailjs.send(ORDER_SERVICE_ID, CONTACT_TEMPLATE_ID, {
            from_name: name,
            from_email: email,
            phone_number: phone,
            message: message
        });
        
        showStatus('تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً.', 'success');
        document.getElementById('contactForm').reset();
        
    } catch (error) {
        console.error('Erreur:', error);
        handleContactError(error);
    } finally {
        contactSpinner.classList.add('d-none');
        contactSubmitText.textContent = 'إرسال الرسالة';
    }
}

/**
 * Handle contact form errors
 */
function handleContactError(error) {
    if (error.code === 18 && navigator.userAgent.includes('Safari')) {
        console.warn("Safari false error ignoré");
        showStatus('تم إرسال رسالتك بنجاح! (Safari glitch)', 'success');
        return;
    }
    
    let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
    if (error.code) {
        errorMessage = `خطأ في النظام: ${error.code}`;
    } else if (error.message) {
        errorMessage = error.message;
    } else if (error.text) {
        errorMessage = error.text;
    }
    
    showStatus(`حدث خطأ أثناء إرسال الرسالة: ${errorMessage}`, 'error');
}

// ============== UTILITY FUNCTIONS ==============

/**
 * Populate wilayas dropdown
 */
function populateWilayas() {
    const wilayaSelect = document.getElementById('wilaya');
    wilayas.forEach(wilaya => {
        const option = document.createElement('option');
        option.value = wilaya;
        option.textContent = wilaya;
        wilayaSelect.appendChild(option);
    });
}

/**
 * Start special offer countdown timer
 */
function startOfferTimer() {
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    
    function updateTimer() {
        const now = new Date();
        const difference = endDate - now;
        
        if (difference <= 0) {
            daysElement.textContent = '00';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            return;
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        daysElement.textContent = days.toString().padStart(2, '0');
        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

/**
 * Show status message
 */
function showStatus(message, type) {
    const indicator = document.getElementById('statusIndicator');
    const messageElement = document.getElementById('statusMessage');
    
    if (!indicator || !messageElement) return;
    
    messageElement.innerHTML = message;
    
    const alert = indicator.querySelector('.alert');
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

/**
 * Hide status message
 */
function hideStatus() {
    const indicator = document.getElementById('statusIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

/**
 * Check localStorage availability
 */
function isLocalStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

// ============== SLIDESHOW FUNCTIONS ==============

/**
 * Navigate slides
 */
function plusSlides1(n) {
    showSlides1(slideIndex1 += n);
}

/**
 * Go to specific slide
 */
function currentSlide1(n) {
    showSlides1(slideIndex1 = n);
}

/**
 * Show slides
 */
function showSlides1(n) {
    const slides = document.getElementsByClassName("mySlides1");
    const dots = document.getElementsByClassName("dot1");

    if (n > slides.length) slideIndex1 = 1;
    if (n < 1) slideIndex1 = slides.length;

    for (let s of slides) s.style.display = "none";
    for (let d of dots) d.className = d.className.replace(" active", "");

    if (slides[slideIndex1 - 1]) {
        slides[slideIndex1 - 1].style.display = "block";
    }
    if (dots[slideIndex1 - 1]) {
        dots[slideIndex1 - 1].className += " active";
    }
}

// ============== EVENT LISTENERS SETUP ==============

/**
 * Setup event listeners for the application
 */
function setupEventListeners() {
    // Status indicator close button
    const closeButton = document.querySelector('#statusIndicator .btn-close');
    if (closeButton) {
        closeButton.addEventListener('click', hideStatus);
    }
    
    // Category filters
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            this.classList.add('active');
            
            const category = this.dataset.category;
            currentCategory = category;
            // You'll need to implement renderProducts function
            // renderProducts(category);
        });
    });
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendContactMessage();
        });
    }
    
    // Image dimension handling
    document.querySelectorAll('.slideshow-container1 img').forEach(function(img) {
        if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
            if (img.naturalWidth && img.naturalHeight) {
                img.setAttribute('width', img.naturalWidth);
                img.setAttribute('height', img.naturalHeight);
            }
        }
    });
}

// ============== APPLICATION INITIALIZATION ==============

/**
 * Initialize the entire application
 */
function initializeApp() {
    // Initialize core systems
    initializeCart();
    populateWilayas();
    setupEventListeners();
    
    // Initialize modals
    orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
    
    // Load data
    loadSpecialOffers();
    
    // Start timers and animations
    startOfferTimer();
    showSlides1(slideIndex1);
    setInterval(() => plusSlides1(1), 4000);
    
    // Check localStorage availability
    if (!isLocalStorageAvailable()) {
        console.warn('localStorage غير متاح، سيتم استخدام تخزين مؤقت في الذاكرة فقط');
    }
    
    console.log('Robuste Eulma application initialized successfully');
}

// ============== GLOBAL EXPORTS ==============

// Make functions available globally for HTML onclick attributes
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.submitOrder = submitOrder;
window.plusSlides1 = plusSlides1;
window.currentSlide1 = currentSlide1;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeFromCart = removeFromCart;
window.showOrderModal = showOrderModal;
window.hideStatus = hideStatus;

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);