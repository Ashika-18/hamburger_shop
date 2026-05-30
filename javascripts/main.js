// グローバルの多重読み込み防止フラグ
window.NEST_APP_LOADED = true;

// --- 1. 商品マスターデータ ---
const products = [
    {
        id: 'b1',
        name: 'ネスト・クラフトバーガー',
        englishName: 'Nest Craft Burger',
        price: 1280,
        category: 'burger',
        description: '当店特製。つなぎ不使用の国産牛100%の極厚パティと、濃厚なオリジナルBBQクラフトソースの極上マリアージュ。',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
        badge: '人気No.1'
    },
    {
        id: 'b2',
        name: 'アボカドチェダーチーズバーガー',
        englishName: 'Avocado Cheddar Burger',
        price: 1420,
        category: 'burger',
        description: '完熟したなめらかな最高級アボカドを贅沢に1/2個使用し、とろける濃厚チェダーチーズを豪快にトッピング。',
        image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
        badge: '女性に人気'
    },
    {
        id: 'b3',
        name: 'ダブルベーコンチーズバーガー',
        englishName: 'Double Bacon Cheese Burger',
        price: 1680,
        category: 'burger',
        description: '肉汁あふれるダブルパティとカリカリに焼き上げた厚切りスモークベーコン。ガツンと贅沢なアメリカンスタイル。',
        image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=600&q=80',
        badge: '大満足ボリューム'
    },
    {
        id: 'b4',
        name: 'テリヤキエッグバーガー',
        englishName: 'Teriyaki Egg Burger',
        price: 1180,
        category: 'burger',
        description: '和風だしのきいた自家製甘辛照り焼きソースに、絶妙な半熟加減の目玉焼きをサンドした至極の一品。',
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 's1',
        name: 'トリプルクランチポテト',
        englishName: 'Triple Crunch Fries',
        price: 450,
        category: 'side',
        description: '外側はクランチなカリカリ食感、中はほくほくのフレンチフライ。岩塩とハーブの香りが食欲をそそります。',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
        badge: '定番'
    },
    {
        id: 's2',
        name: '自家製オニオンリング',
        englishName: 'Homemade Onion Rings',
        price: 480,
        category: 'side',
        description: '甘みの強い国産タマネギを特製のビール酵母衣でサックサクに仕上げました。オリジナルのタルタル付き。',
        image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 's3',
        name: 'クラフト・コールスロー',
        englishName: 'Craft Coleslaw',
        price: 380,
        category: 'side',
        description: '細かく刻んだキャベツとニンジンを、爽やかな瀬戸内レモンの特製酸味マヨドレッシングで和えた箸休めにぴったりの一品。',
        image: 'https://images.unsplash.com/photo-1625938146369-adc83368bda7?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'd1',
        name: '自家製スパイスクラフトコーラ',
        englishName: 'Homemade Craft Cola',
        price: 500,
        category: 'drink',
        description: 'シナモン、カルダモン、バニラビーンズなど10種類以上のスパイスを独自ブレンドして手作りした無添加健康コーラ。',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
        badge: 'おすすめ'
    },
    {
        id: 'd2',
        name: '瀬戸内レモンレモネード',
        englishName: 'Organic Lemonade',
        price: 480,
        category: 'drink',
        description: '瀬戸内産レモンの果汁とはちみつを贅沢に使用。微炭酸が心地よく、ハンバーガーの後味をスッキリさせます。',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'd3',
        name: '水出しアイス珈琲',
        englishName: 'Cold Brew Coffee',
        price: 450,
        category: 'drink',
        description: '厳選された深煎りコーヒー豆から12時間かけてゆっくり抽出した、苦味が少なくすっきりコクのあるアイスコーヒー。',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80'
    }
];

// --- 2. 状態管理 (State) ---
let cart = [];
let currentCategory = 'all';

// --- 3. メニュー構築 & 描画 ---
window.renderProducts = function() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = products.filter(p => currentCategory === 'all' || p.category === currentCategory);

    filtered.forEach(p => {
        const card = document.createElement('div');
        // 【改善】インラインのTailwind表記を排除し、CSS設計されたコンポーネントクラスのみを付与！
        card.className = "product-card"; 
        
        const badgeHtml = p.badge 
            ? `<span class="absolute top-4 left-4 bg-nestGold text-nestDark text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-full shadow-md z-10">${p.badge}</span>` 
            : '';

        card.innerHTML = `
            <div class="relative h-56 w-full overflow-hidden bg-neutral-100">
                ${badgeHtml}
                <img src="${p.image}" 
                     alt="${p.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                     onerror="handleImageError(this, '${p.name}')">
            </div>
            <div class="p-6 flex flex-col flex-1">
                <div class="mb-3">
                    <span class="text-[10px] text-gray-400 font-bold tracking-widest uppercase block mb-0.5">${p.englishName}</span>
                    <h3 class="text-lg font-black text-nestDark leading-tight">${p.name}</h3>
                </div>
                <p class="text-xs text-gray-400 leading-relaxed flex-1 mb-6">${p.description}</p>
                <div class="flex items-center justify-between pt-4 border-t border-dashed border-neutral-100 mt-auto">
                    <span class="text-xl font-black text-nestDark">¥${p.price.toLocaleString()}</span>
                    <button onclick="addToCart('${p.id}')" class="bg-nestDark text-white hover:bg-nestGold hover:text-nestDark px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>カートに追加</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};

// 画像読み込み失敗時のフォールバック処理
window.handleImageError = function(img, name) {
    img.onerror = null;
    img.src = `data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23faf9f6%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22130%22%20r%3D%2250%22%20fill%3D%22%23fcf2d4%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2275%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%23b59124%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3E${encodeURIComponent(name)}%3C%2Ftext%3E%3C%2Fsvg%3E`;
};

// --- 4. カテゴリフィルター制御 ---
window.filterCategory = function(category) {
    currentCategory = category;
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('bg-nestGold', 'text-nestDark', 'shadow-sm');
        tab.classList.add('text-gray-500', 'font-medium');
    });
    const activeTab = document.getElementById(`tab-${category}`);
    if (activeTab) {
        activeTab.classList.remove('text-gray-500', 'font-medium');
        activeTab.classList.add('bg-nestGold', 'text-nestDark', 'shadow-sm', 'font-bold');
    }
    renderProducts();
};

// --- 5. カート機能ロジック ---
window.toggleCart = function(open) {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer || !overlay) return;
    if (open) {
        drawer.classList.remove('translate-x-full');
        overlay.classList.remove('pointer-events-none', 'opacity-0');
    } else {
        drawer.classList.add('translate-x-full');
        overlay.classList.add('pointer-events-none', 'opacity-0');
    }
};

window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.product.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ product, quantity: 1 });
    }
    updateCart();
    toggleCart(true);
};

window.updateQuantity = function(productId, delta) {
    const item = cart.find(item => item.product.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.product.id !== productId);
    }
    updateCart();
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    updateCart();
};

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
}

window.updateCart = function() {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyState = document.getElementById('cart-empty-state');
    const footer = document.getElementById('cart-footer');
    const badge = document.getElementById('cart-badge');
    const totalText = document.getElementById('cart-total');

    if (!cartItemsContainer || !emptyState || !footer || !badge || !totalText) return;

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalCount > 0) {
        badge.innerText = totalCount;
        badge.classList.remove('scale-0');
        badge.classList.add('scale-100');
    } else {
        badge.classList.remove('scale-100');
        badge.classList.add('scale-0');
    }

    if (cart.length === 0) {
        cartItemsContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        footer.classList.add('hidden');
    } else {
        cartItemsContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
        footer.classList.remove('hidden');

        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const el = document.createElement('div');
            // 【改善】カート内のアイテム装飾もCSS設計に完全移行！
            el.className = 'cart-item'; 
            
            el.innerHTML = `
                <img src="${item.product.image}" alt="${item.product.name}" class="w-16 h-16 object-cover rounded-xl bg-white" onerror="handleImageError(this, '${item.product.name}')">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-nestDark truncate">${item.product.name}</h4>
                    <span class="text-xs text-gray-400 block mb-1">¥${item.product.price.toLocaleString()}</span>
                    <div class="flex items-center gap-2 mt-1">
                        <button onclick="updateQuantity('${item.product.id}', -1)" class="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-xs font-bold">-</button>
                        <span class="text-sm font-bold text-gray-700 w-6 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.product.id}', 1)" class="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-xs font-bold">+</button>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end justify-between h-full">
                    <button onclick="removeFromCart('${item.product.id}')" class="text-gray-300 hover:text-red-500 transition-colors p-1" aria-label="削除">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    <span class="text-sm font-black text-nestDark mt-2">¥${(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
            `;
            cartItemsContainer.appendChild(el);
        });

        totalText.innerText = `¥${getCartTotal().toLocaleString()}`;
    }
};

// --- 6. お支払い方法関連の処理 ---
window.updatePaymentSelectionUI = function() {
    const storeLabel = document.getElementById('payment-payatstore-label');
    const creditLabel = document.getElementById('payment-credit-label');
    if(!storeLabel || !creditLabel) return;

    const storeRadio = storeLabel.querySelector('input');

    if (storeRadio.checked) {
        storeLabel.className = "relative flex flex-col p-3 border-2 border-nestGold rounded-xl cursor-pointer text-center bg-nestGold/5 text-nestDark font-bold";
        creditLabel.className = "relative flex flex-col p-3 border border-gray-200 rounded-xl cursor-pointer text-center hover:border-nestGold bg-white text-gray-500";
    } else {
        creditLabel.className = "relative flex flex-col p-3 border-2 border-nestGold rounded-xl cursor-pointer text-center bg-nestGold/5 text-nestDark font-bold";
        storeLabel.className = "relative flex flex-col p-3 border border-gray-200 rounded-xl cursor-pointer text-center hover:border-nestGold bg-white text-gray-500";
    }
};

window.togglePaymentFields = function(method) {
    const fields = document.getElementById('credit-card-fields');
    const cardNum = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCvc = document.getElementById('card-cvc');
    
    updatePaymentSelectionUI();

    if (method === 'credit-card') {
        fields.classList.remove('hidden');
        cardNum.setAttribute('required', 'true');
        cardExpiry.setAttribute('required', 'true');
        cardCvc.setAttribute('required', 'true');
    } else {
        fields.classList.add('hidden');
        cardNum.removeAttribute('required');
        cardExpiry.removeAttribute('required');
        cardCvc.removeAttribute('required');
    }
};

window.formatCardNumber = function(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
        input.value = parts.join(' ');
    } else {
        input.value = value;
    }
};

window.formatCardExpiry = function(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        input.value = value.slice(0, 2) + '/' + value.slice(2, 4);
    } else {
        input.value = value;
    }
};

// --- 7. 注文予約送信ハンドリング ---
window.handleOrderSubmit = function(event) {
    event.preventDefault();

    const name = document.getElementById('user-name').value;
    const time = document.getElementById('pickup-time').value;
    const paymentMethodRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'pay-at-store';
    
    const receiptId = 'NST-' + Math.floor(10000 + Math.random() * 90000);

    document.getElementById('receipt-id').innerText = receiptId;
    document.getElementById('receipt-name').innerText = `${name} 様`;
    document.getElementById('receipt-time').innerText = time;
    document.getElementById('receipt-total').innerText = `¥${getCartTotal().toLocaleString()}`;

    const paymentMethodText = document.getElementById('receipt-payment-method');
    const instructionText = document.getElementById('receipt-instruction');

    if (paymentMethod === 'credit-card') {
        paymentMethodText.innerText = 'クレジットカード決済完了';
        paymentMethodText.className = 'font-bold text-green-600';
        instructionText.innerText = '※WEB上でのクレジットカード決済が完了しています。お時間になりましたら店舗カウンターにお越しいただき、店員に注文予約番号をお見せの上、お品物をお受け取りください。';
    } else {
        paymentMethodText.innerText = '店頭でお支払い';
        paymentMethodText.className = 'font-bold text-gray-800';
        instructionText.innerText = '※お支払いは店舗受け取り時（現金/クレジットカード/各種QR決済）となります。お時間になりましたらカウンターまでお越しいただき、上記の予約番号をご提示ください。';
    }

    toggleCart(false);

    // カート状態を初期化
    cart = [];
    updateCart();
    document.getElementById('order-form').reset();
    togglePaymentFields('pay-at-store');

    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.transform').classList.remove('scale-95');
        }, 50);
    }
};

window.closeSuccessModal = function() {
    const modal = document.getElementById('success-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('.transform').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

// --- 8. 初期化処理 ---
window.addEventListener('DOMContentLoaded', () => {
    updatePaymentSelectionUI();
    renderProducts();
    updateCart();
});