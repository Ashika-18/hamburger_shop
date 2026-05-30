// =========================================================================
// 🌐 【DNS接続エラー完全対策】
// Render上のNode.jsがStripeへのIPv6接続に失敗し、タイムアウトになる
// 「既知のバグ」を完全に回避するため、名前解決を「IPv4優先」に固定します。
// =========================================================================
const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

// 最上部で環境変数（.env）を確実に読み込みます
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// =========================================================================
// 🔒 【安全ガード】Stripe秘密鍵の自動検証と空白クリーニング処理
// =========================================================================
let stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error('❌ [ERROR] STRIPE_SECRET_KEY が環境変数に設定されていません！');
} else {
    stripeSecretKey = stripeSecretKey.trim();
    console.log('🔑 [INFO] Stripe秘密鍵を正常に検出しました。(自動クリーニング済)');
    // 開発用にAPIキーの最初と最後だけを安全にログ出力し、正しくセットされているか目視可能にします
    const maskedKey = stripeSecretKey.substring(0, 15) + '...' + stripeSecretKey.substring(stripeSecretKey.length - 8);
    console.log(`📂 [DEBUG] 現在ロードされているAPIキーの形式: [${maskedKey}] (総文字数: ${stripeSecretKey.length}文字)`);
}

// 【1回目の精査：Stripeの最大タイムアウトを「8秒」に極限短縮】
// Renderの30秒タイムアウトに引っかかるのを防ぐため、Stripeの通信制限を8秒に固定します。
const stripe = require('stripe')(stripeSecretKey, {
    timeout: 8000 // 8秒で強制クローズ
});

const app = express();

app.use(cors({
    origin: '*'
}));
app.use(express.json());

// =========================================================================
// 📁 【超堅牢パス解決】フロントエンド画面の配信制御
// =========================================================================
const publicPath = path.resolve(__dirname, '..');
console.log(`📂 [DEBUG] フロントエンド画面の配信ルートフォルダパス: ${publicPath}`);

app.use(express.static(publicPath));

// Stripe Checkout セッションを動的に作成するAPI（バックエンド処理）
app.post('/create-checkout-session', async (req, res, next) => {
    // 【2回目の精査：API処理全体の12秒強制タイムアウト監視】
    // 万が一Stripe以外の要因で処理がハングアップした場合に備え、12秒で強制遮断するセーフティタイマーを設定します。
    const apiTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('STRIPE_CONNECT_TIMEOUT')), 12000)
    );

    try {
        const { cartItems, userName, pickupTime } = req.body;

        if (!stripeSecretKey) {
            return res.status(500).json({ 
                error: 'サーバー側でStripeのAPIキー（秘密鍵）が設定されていません。Renderの「Environment」設定を確認してください。' 
            });
        }

        // 送信前にAPIキーの最低限のフォーマット検証（打ち間違い、コピペミス対策）
        if (!stripeSecretKey.startsWith('sk_test_') && !stripeSecretKey.startsWith('sk_live_')) {
            return res.status(400).json({
                error: '設定されているStripe秘密鍵の形式が不正です。鍵は「sk_test_」または「sk_live_」から始まる必要があります。'
            });
        }

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'カートが空です。' });
        }

        const lineItems = cartItems.map(item => {
            return {
                price_data: {
                    currency: 'jpy',
                    product_data: {
                        name: item.product.name,
                    },
                    unit_amount: item.product.price,
                },
                quantity: item.quantity,
            };
        });

        const referer = req.headers.referer || 'http://localhost:3000/';
        const redirectBase = referer.split('?')[0];

        // 実際のStripe通信処理を、タイムアウト監視（apiTimeout）と競争（race）させます！
        const session = await Promise.race([
            stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${redirectBase}?success=true&name=${encodeURIComponent(userName)}&time=${encodeURIComponent(pickupTime)}`,
                cancel_url: `${redirectBase}?cancel=true`,
            }),
            apiTimeout
        ]);

        res.json({ url: session.url });

    } catch (error) {
        // タイムアウトを検知した場合、わかりやすいエラーオブジェクトに変換してハンドラーに流します
        if (error.message === 'STRIPE_CONNECT_TIMEOUT') {
            return next(new Error('Stripeサーバーとの通信が規定時間（12秒）以内に完了しませんでした。ネットワーク環境またはAPI秘密鍵の有効性を確認してください。'));
        }
        next(error);
    }
});

// =========================================================================
// 🌐 【Cannot GET / 回避＆将来の互換性対策ミドルウェア】
// =========================================================================
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/create-checkout-session')) {
        const indexPath = path.join(publicPath, 'index.html');
        return res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('❌ [ERROR] フロントエンド画面の送信に失敗しました:', err.message);
                res.status(404).send('ハンバーガーショップ画面が見つかりません。');
            }
        });
    }
    next();
});

// =========================================================================
// 🚨 【超重要：グローバル・JSONエラーハンドラーミドルウェア】
// 【3回目の精査：Renderの30秒リミットより前に、必ず自前で綺麗なJSONエラーを返却】
// =========================================================================
app.use((err, req, res, next) => {
    console.error('❌ [FATAL ERROR] サーバー内部で例外が発生しました:', err.stack || err.message);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
        error: '決済の準備中にエラーが発生しました。',
        details: err.message || '内部サーバーエラー'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log(' NEST BURGER CRAFT - 動的Web決済アプリケーションサーバー起動！');
    console.log(` 稼働アドレス: http://localhost:${PORT}`);
    console.log('==================================================');
});