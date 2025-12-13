// ============== تهيئة Firebase ==============

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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// تهيئة EmailJS
(function() {
    emailjs.init("k77vdaUWPpnLrfTnS");
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

// ============== نظام المنتجات الديناميكي ==============

// دالة جلب وعرض المنتجات من JSON
async function loadAndDisplayProducts(category = 'all') {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des produits');
        }
        const products = await response.json();
        
        // تصفية المنتجات حسب الفئة
        const filteredProducts = category === 'all' 
            ? products 
            : products.filter(product => product.category === category);
        
       renderProducts(filteredProducts);
setupClickableCards();
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Erreur lors du chargement des produits', 'error');
    }
}

// دالة عرض المنتجات
// في دالة renderProducts، نعدل كود البطاقات
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">Aucun produit trouvé</div>';
        return;
    }
    
    products.forEach(product => {
        const discountBadge = product.old_price && product.old_price > product.price ? `
            <div class="discount-badge">
                -${Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
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
        
        // تصميم بطاقة المنتج المحدثة
        const productCard = `
<div class="col-6 col-md-4 col-lg-3 mb-4">
  <div class="product-card clickable-card h-100 position-relative"
       data-href="product.html?pid=${product.id}">

    ${productBadge}
    ${discountBadge}

    <div id="carousel-${product.id}" 
         class="carousel slide product-carousel"
         data-bs-ride="carousel">
      <div class="carousel-inner">
        ${carouselItems}
      </div>
    </div>

    <div class="card-body py-2">
      <h6 class="card-title mb-1">${product.title}</h6>

      <div class="price-row d-flex align-items-center gap-1">
        ${oldPrice}
        <span class="fw-bold text-primary">
          ${product.price.toLocaleString()} DA
        </span>
      </div>
    </div>

    <div class="card-footer bg-transparent border-0 pt-0">
      <button class="btn btn-orange w-100 add-to-cart-btn"
              data-id="${product.id}">
        <i class="bi bi-cart-plus"></i> Ajouter au panier
      </button>
    </div>

  </div>
</div>
`;
        container.innerHTML += productCard;
    });
    
    // إضافة مستمعات الأحداث للبطاقات القابلة للنقر
    setupClickableCards();
}
// دالة تحميل العروض الخاصة
async function loadSpecialOffers() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des produits');
        }
        const products = await response.json();
        
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
    if (setupAddToCartButtons._initialized) return;
    setupAddToCartButtons._initialized = true;

    document.addEventListener('click', function(e) {
        // نلتقط فقط أقرب زر add-to-cart-btn بدون تفرع
        const button = e.target.closest('.add-to-cart-btn');
        if (!button) return;

        // حماية مؤقتة لكل زر لمنع النقرات المتكررة السريعة
        if (button.dataset.processing === 'true') return;
        button.dataset.processing = 'true';
        setTimeout(() => { delete button.dataset.processing; }, 300); // 300ms debounce

        e.preventDefault();

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
    
    const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    cartCount.textContent = count;
    checkoutBtn.disabled = count === 0;
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
    
    if (cart.length === 0) {
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
                <img src="${item.image || ''}" alt="${item.name || 'منتج'}" class="cart-item-img me-3">
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
        
        // منع الإدخال غير الرقمي
        input.addEventListener('keydown', function(e) {
            if (!/[\d\b\t\n]|Arrow|Delete|Backspace|Tab/.test(e.key) && 
                !(e.ctrlKey || e.metaKey)) {
                e.preventDefault();
            }
        });
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
    if (cart.length === 0) {
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
    if (cart.length === 0) {
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
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPriceValue').value;
    const productImage = document.getElementById('productImageUrl').value;
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value || 'لم يتم تقديمه';
    const wilaya = document.getElementById('wilaya').value;
    const address = document.getElementById('address').value || 'غير محدد';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
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
        payment: paymentMethod,
        totalPrice: total,
        timestamp: new Date().toISOString(),
        status: 'جديد'
    };
    
    // عرض حالة التحميل
    showStatus('جاري معالجة طلبك...', 'loading');
    
    // تعطيل زر الإرسال أثناء المعالجة
    const submitBtn = document.getElementById('submitOrderBtn');
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
        submitBtn.innerHTML = 'تأكيد الطلب';
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
    contactSpinner.classList.remove('d-none');
    contactSubmitText.textContent = 'جاري الإرسال...';
    
    try {
        // إرسال رسالة الاتصال عبر EmailJS
        await emailjs.send("service_lc1q5k8", "template_11pkq0k", {
            from_name: name,
            from_email: email,
            phone_number: phone,
            message: message
        });
        
        console.log("تم إرسال رسالة الاتصال");
        
        showStatus('تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً.', 'success');
        document.getElementById('contactForm').reset();
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
        contactSpinner.classList.add('d-none');
        contactSubmitText.textContent = 'إرسال الرسالة';
    }
}

// ============== وظائف مساعدة ==============

// تعبئة قائمة الولايات
function populateWilayas() {
    const wilayaSelect = document.getElementById('wilaya');
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
    
    // تحديث المؤثر كل ثانية
    updateTimer();
    setInterval(updateTimer, 1000);
}

// عرض حالة الطلب
function showStatus(message, type) {
    const indicator = document.getElementById('statusIndicator');
    const messageElement = document.getElementById('statusMessage');
    
    // إعداد الرسالة
    messageElement.innerHTML = message;
    
    // إعداد التصميم حسب النوع
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
    document.getElementById('statusIndicator').style.display = 'none';
}

// ============== السلايدر ==============
let slideIndex1 = 1;
showSlides1(slideIndex1);

// التحكم بالأزرار
function plusSlides1(n) {
  showSlides1(slideIndex1 += n);
}

// التحكم بالنقاط
function currentSlide1(n) {
  showSlides1(slideIndex1 = n);
}

function showSlides1(n) {
  const slides = document.getElementsByClassName("mySlides1");
  const dots = document.getElementsByClassName("dot1");

  if (n > slides.length) slideIndex1 = 1;
  if (n < 1) slideIndex1 = slides.length;

  for (let s of slides) s.style.display = "none";
  for (let d of dots) d.className = d.className.replace(" active", "");

  slides[slideIndex1 - 1].style.display = "block";
  dots[slideIndex1 - 1].className += " active";
}

// تشغيل تلقائي
setInterval(() => {
  plusSlides1(1);
}, 4000);

// ============== وظيفة تبديل وضع الظلام ==============
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // تغيير السمة
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // تحديث أيقونة الزر
    const themeIcon = document.querySelector('#themeToggle i');
    if (newTheme === 'dark') {
        themeIcon.className = 'bi bi-sun';
        themeIcon.parentElement.title = 'تفعيل وضع النهار';
    } else {
        themeIcon.className = 'bi bi-moon';
        themeIcon.parentElement.title = 'تفعيل وضع الظلام';
    }
    
    // حفظ التفضيل في localStorage
    localStorage.setItem('theme', newTheme);
}

// تهيئة وضع الظلام عند تحميل الصفحة
function initDarkMode() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.querySelector('#themeToggle i');
    if (savedTheme === 'dark') {
        themeIcon.className = 'bi bi-sun';
        themeIcon.parentElement.title = 'تفعيل وضع النهار';
    } else {
        themeIcon.className = 'bi bi-moon';
        themeIcon.parentElement.title = 'تفعيل وضع الظلام';
    }
    
    // إضافة مستمع الحدث
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
}

// تهيئة وضع الظلام عند تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    
    // باقي تهيئة الصفحة...
    loadCart();
    loadAndDisplayProducts();
    setupCategoryFilters();
    setupAddToCartButtons();
    loadSpecialOffers();
    populateWilayas();
    startOfferTimer();
    orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendContactMessage();
    });
    updateCartCount();
    renderCart();
});

// ============== تكييف حجم نموذج الطلب للأجهزة الصغيرة ==============

// دالة لتقليل حجم وتكييف النموذج للأجهزة الصغيرة
function adjustOrderModalForMobile() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    
    // التأكد من أن النموذج متاح
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            // تحديث موقع النموذج
            modal.classList.add('modal-mobile-optimized');
        }
    }
    
    // التحقق إذا كنا على جهاز محمول
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // تكييف النموذج للأجهزة المحمولة
        optimizeModalForMobile();
        
        // تكييف حقول الإدخال
        adjustInputFieldsForMobile();
        
        // تكييف أزرار الراديو
        adjustRadioButtonsForMobile();
        
        // تكييف قائمة الولايات
        adjustWilayaSelectForMobile();
        
        // تكييف الأزرار
        adjustButtonsForMobile();
        
        // تكييف ملخص الطلب
        adjustOrderSummaryForMobile();
    } else {
        // إعادة التعيين للشاشات الكبيرة
        resetModalForDesktop();
    }
}

// تكييف النموذج للأجهزة المحمولة
function optimizeModalForMobile() {
    const modal = document.getElementById('orderModal');
    const modalContent = modal.querySelector('.modal-content');
    const modalBody = modal.querySelector('.modal-body');
    const modalFooter = modal.querySelector('.modal-footer');
    
    // إضافة فئات التكييف
    modal.classList.add('mobile-optimized');
    if (modalContent) modalContent.classList.add('mobile-content');
    if (modalBody) modalBody.classList.add('mobile-body');
    if (modalFooter) modalFooter.classList.add('mobile-footer');
    
    // تعديل الهوامش والحشوات
    if (modalBody) {
        modalBody.style.padding = '15px';
        modalBody.style.maxHeight = '70vh';
        modalBody.style.overflowY = 'auto';
    }
    
    // إضافة شريط تمرير مخصص
    addCustomScrollbar(modalBody);
}

// تكييف حقول الإدخال للأجهزة المحمولة
function adjustInputFieldsForMobile() {
    const inputs = document.querySelectorAll('#orderForm .form-control, #orderForm .form-select');
    
    inputs.forEach(input => {
        // إضافة فئة خاصة للأجهزة المحمولة
        input.classList.add('mobile-input');
        
        // ضبط الحشوات والارتفاع
        input.style.padding = '10px 12px';
        input.style.height = '44px';
        input.style.fontSize = '16px'; // منع تكبير iOS
        
        // إضافة تأثير التركيز المحسن
        input.addEventListener('focus', function() {
            this.style.borderColor = 'var(--primary)';
            this.style.boxShadow = '0 0 0 2px rgba(255, 107, 53, 0.2)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
    });
    
    // تكييف خاص لحقول النصوص الكبيرة
    const textarea = document.getElementById('address');
    if (textarea) {
        textarea.style.minHeight = '80px';
        textarea.style.maxHeight = '120px';
        textarea.style.resize = 'vertical';
    }
}

// تكييف أزرار الراديو للأجهزة المحمولة
function adjustRadioButtonsForMobile() {
    const radioButtons = document.querySelectorAll('#orderForm .form-check');
    
    radioButtons.forEach(radio => {
        radio.classList.add('mobile-radio');
        
        // تكبير مساحة اللمس
        const label = radio.querySelector('.form-check-label');
        const input = radio.querySelector('.form-check-input');
        
        if (label && input) {
            // جعل التسمية قابلة للنقر بالكامل
            label.style.padding = '10px 15px 10px 35px';
            label.style.borderRadius = '8px';
            label.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            label.style.cursor = 'pointer';
            label.style.transition = 'all 0.2s ease';
            
            // إضافة تأثير hover
            label.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
            });
            
            label.addEventListener('mouseleave', function() {
                if (!input.checked) {
                    this.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                }
            });
            
            // تحديث التصميم عند التحديد
            input.addEventListener('change', function() {
                const allLabels = document.querySelectorAll('#orderForm .form-check-label');
                allLabels.forEach(l => {
                    l.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                    l.style.color = '';
                });
                
                if (this.checked) {
                    label.style.backgroundColor = 'rgba(255, 107, 53, 0.15)';
                    label.style.color = 'var(--primary)';
                    label.style.fontWeight = '600';
                }
            });
            
            // تحسين وضع الراديو
            input.style.width = '20px';
            input.style.height = '20px';
            input.style.marginTop = '0';
            input.style.position = 'absolute';
            input.style.left = '10px';
            input.style.top = '50%';
            input.style.transform = 'translateY(-50%)';
        }
    });
}

// تكييف قائمة الولايات للأجهزة المحمولة
function adjustWilayaSelectForMobile() {
    const wilayaSelect = document.getElementById('wilaya');
    if (!wilayaSelect) return;
    
    wilayaSelect.classList.add('mobile-select');
    
    // تحسين مظهر القائمة
    wilayaSelect.style.padding = '10px 35px 10px 12px';
    wilayaSelect.style.backgroundPosition = 'left 12px center';
    wilayaSelect.style.fontSize = '16px';
    
    // تحسين خيارات القائمة
    const options = wilayaSelect.options;
    for (let i = 0; i < options.length; i++) {
        options[i].style.padding = '8px 12px';
        options[i].style.fontSize = '14px';
    }
    
    // إضافة تأثير التركيز
    wilayaSelect.addEventListener('focus', function() {
        this.style.borderColor = 'var(--primary)';
        this.style.boxShadow = '0 0 0 2px rgba(255, 107, 53, 0.2)';
    });
    
    wilayaSelect.addEventListener('blur', function() {
        this.style.borderColor = '';
        this.style.boxShadow = '';
    });
}

// تكييف الأزرار للأجهزة المحمولة
function adjustButtonsForMobile() {
    const submitBtn = document.getElementById('submitOrderBtn');
    const cancelBtn = document.querySelector('#orderModal .btn-secondary');
    
    // تكييف زر التأكيد
    if (submitBtn) {
        submitBtn.classList.add('mobile-submit-btn');
        submitBtn.style.padding = '12px 20px';
        submitBtn.style.fontSize = '1rem';
        submitBtn.style.fontWeight = '600';
        submitBtn.style.borderRadius = '8px';
        submitBtn.style.marginBottom = '8px';
        submitBtn.style.width = '100%';
        submitBtn.style.height = '48px';
        submitBtn.style.display = 'flex';
        submitBtn.style.alignItems = 'center';
        submitBtn.style.justifyContent = 'center';
        submitBtn.style.gap = '8px';
        
        // منع مشاكل اللمس على iOS
        submitBtn.style.webkitTapHighlightColor = 'transparent';
        submitBtn.style.userSelect = 'none';
        submitBtn.style.touchAction = 'manipulation';
    }
    
    // تكييف زر الإلغاء
    if (cancelBtn) {
        cancelBtn.classList.add('mobile-cancel-btn');
        cancelBtn.style.padding = '12px 20px';
        cancelBtn.style.fontSize = '1rem';
        cancelBtn.style.fontWeight = '500';
        cancelBtn.style.borderRadius = '8px';
        cancelBtn.style.width = '100%';
        cancelBtn.style.height = '48px';
        
        // منع مشاكل اللمس على iOS
        cancelBtn.style.webkitTapHighlightColor = 'transparent';
        cancelBtn.style.userSelect = 'none';
        cancelBtn.style.touchAction = 'manipulation';
    }
}

// تكييف ملخص الطلب للأجهزة المحمولة
function adjustOrderSummaryForMobile() {
    const orderSummary = document.querySelector('.order-summary');
    if (!orderSummary) return;
    
    orderSummary.classList.add('mobile-summary');
    orderSummary.style.padding = '12px';
    orderSummary.style.marginBottom = '15px';
    orderSummary.style.borderRadius = '10px';
    
    // تكييف صورة المنتج
    const productImage = document.getElementById('productImage');
    if (productImage) {
        productImage.style.width = '50px';
        productImage.style.height = '50px';
        productImage.style.objectFit = 'cover';
    }
    
    // تكييف نص المنتج
    const productName = document.getElementById('productNameDisplay');
    if (productName) {
        productName.style.fontSize = '0.95rem';
        productName.style.lineHeight = '1.3';
        productName.style.marginBottom = '4px';
    }
    
    const productPrice = document.getElementById('productPrice');
    if (productPrice) {
        productPrice.style.fontSize = '0.9rem';
        productPrice.style.fontWeight = '700';
    }
}

// إضافة شريط تمرير مخصص
function addCustomScrollbar(element) {
    if (!element) return;
    
    // إضافة أنماط شريط التمرير
    const scrollbarStyles = `
        .mobile-body::-webkit-scrollbar {
            width: 4px;
        }
        
        .mobile-body::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 2px;
        }
        
        .mobile-body::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 2px;
        }
        
        .mobile-body::-webkit-scrollbar-thumb:hover {
            background: var(--primary-dark);
        }
        
        [data-theme="dark"] .mobile-body::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        
        [data-theme="dark"] .mobile-body::-webkit-scrollbar-thumb {
            background: var(--primary);
        }
    `;
    
    // إضافة الأنماط إذا لم تكن موجودة
    if (!document.getElementById('mobile-scrollbar-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'mobile-scrollbar-styles';
        styleEl.textContent = scrollbarStyles;
        document.head.appendChild(styleEl);
    }
}

// إعادة تعيين النموذج للشاشات الكبيرة
function resetModalForDesktop() {
    const modal = document.getElementById('orderModal');
    
    // إزالة فئات التكييف
    modal.classList.remove('mobile-optimized', 'mobile-optimized');
    
    // إزالة الأنماط المضافة
    const mobileElements = document.querySelectorAll('.mobile-input, .mobile-radio, .mobile-select, .mobile-submit-btn, .mobile-cancel-btn, .mobile-summary');
    mobileElements.forEach(el => {
        el.classList.remove('mobile-input', 'mobile-radio', 'mobile-select', 'mobile-submit-btn', 'mobile-cancel-btn', 'mobile-summary');
        el.removeAttribute('style');
    });
    
    // إزالة معالجات الأحداث
    const inputs = document.querySelectorAll('#orderForm .form-control, #orderForm .form-select');
    inputs.forEach(input => {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });
    
    // إزالة معالجات أزرار الراديو
    const radios = document.querySelectorAll('#orderForm .form-check-input');
    radios.forEach(radio => {
        const newRadio = radio.cloneNode(true);
        radio.parentNode.replaceChild(newRadio, radio);
    });
}

// ============== إدارة أحداث النموذج ==============

// استدعاء التكييف عند فتح النموذج
document.addEventListener('DOMContentLoaded', function() {
    const orderModal = document.getElementById('orderModal');
    
    if (orderModal) {
        orderModal.addEventListener('show.bs.modal', function() {
            setTimeout(() => {
                adjustOrderModalForMobile();
            }, 50);
        });
        
        orderModal.addEventListener('shown.bs.modal', function() {
            // إعادة حساب الأحجام بعد عرض النموذج
            adjustOrderModalForMobile();
        });
    }
    
    // تكييف عند تغيير حجم النافذة
    window.addEventListener('resize', function() {
        if (document.getElementById('orderModal').classList.contains('show')) {
            adjustOrderModalForMobile();
        }
    });
    
    // تكييف عند تغيير وضع Dark Mode
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'data-theme') {
                if (document.getElementById('orderModal').classList.contains('show')) {
                    setTimeout(adjustOrderModalForMobile, 100);
                }
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});

// ============== منع مشاكل الأزرار الكبيرة ==============

// ============== التحسينات النهائية ==============

// تشغيل التكييف الأولي
setTimeout(() => {
    if (document.getElementById('orderModal').classList.contains('show')) {
        adjustOrderModalForMobile();
    }
}, 1000);

// إضافة دعم لـ Fast Click (تحسين الاستجابة على الهواتف)
document.addEventListener('DOMContentLoaded', function() {
    // تقليل تأخير النقر على الروابط والأزرار
    if ('ontouchstart' in window) {
        document.documentElement.style.cursor = 'pointer';
    }
});
// دالة إعداد البطاقات القابلة للنقر
function setupClickableCards() {
    document.querySelectorAll('.clickable-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // منع الانتقال إذا النقر كان على زر الإضافة إلى السلة
            if (e.target.closest('.add-to-cart-btn')) {
                return;
            }
            
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                window.location.href = `product.html?pid=${productId}`;
            }
        });
    });
}

// تعديل دالة تهيئة أزرار الإضافة إلى السلة
function setupAddToCartButtons() {
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.add-to-cart-btn');
        if (!button) return;

        // منع انتشار الحدث إلى البطاقة الأصلية
        e.stopPropagation();
        
        const productId = button.getAttribute('data-id');
        if (!productId) return;

        // منع النقرات المتكررة السريعة
        if (button.dataset.processing === 'true') return;
        button.dataset.processing = 'true';
        
        setTimeout(() => {
            delete button.dataset.processing;
        }, 300);

        // جلب بيانات المنتج وإضافته إلى السلة
        fetch('products.json')
            .then(response => response.json())
            .then(products => {
                const product = products.find(p => p.id == productId);
                if (product) {
                    addToCart(
                        product.title,
                        `${product.price.toLocaleString()} DA`,
                        product.price,
                        product.images,
                        product.id
                    );
                    
                    // تأثير بسيط لتأكيد الإضافة
                    button.innerHTML = '<i class="bi bi-check"></i> Ajouté!';
                    button.style.background = '#28a745';
                    
                    setTimeout(() => {
                        button.innerHTML = '<i class="bi bi-cart-plus"></i> Ajouter au panier';
                        button.style.background = '';
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showStatus('Error loading product details', 'error');
            });
    });
}

function setupClickableCards() {
  document.addEventListener('click', function (e) {

    // لو ضغط على زر الإضافة → نوقف الانتشار
    if (e.target.closest('.add-to-cart-btn')) {
      e.stopPropagation();
      return;
    }

    // لو ضغط على البطاقة
    const card = e.target.closest('.clickable-card');
    if (!card) return;

    const href = card.getAttribute('data-href');
    if (href) {
      window.location.href = href;
    }
  });
}