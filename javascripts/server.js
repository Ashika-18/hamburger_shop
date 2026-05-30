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
}

const stripe = require('stripe')(stripeSecretKey, {
    timeout: 60000 // 60秒
});

const app = express();

app.use(cors({
    origin: '*'
}));
app.use(express.json());

// =========================================================================
// 📁 【超堅牢パス解決】フロントエンド画面の配信制御
// =========================================================================
// server.js は javascripts フォルダ内にあるため、確実に1つ上のルートフォルダを絶対パスで指定します。
const publicPath = path.resolve(__dirname, '..');

// 読み込み先パスをRenderのログに出力して、ズレがないか監視できるようにします
console.log(`📂 [DEBUG] フロントエンド画面の配信ルートフォルダパス: ${publicPath}`);

app.use(express.static(publicPath));

// Stripe Checkout セッションを動的に作成するAPI（バックエンド処理）
app.post('/create-checkout-session', async (req, res, next) => {
    try {
        const { cartItems, userName, pickupTime } = req.body;

        if (!stripeSecretKey) {
            return res.status(500).json({ 
                error: 'サーバー側でStripeのAPIキー（秘密鍵）が設定されていません。' 
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

        // リクエスト元のドメインを動的に解決
        const referer = req.headers.referer || 'http://localhost:3000/';
        const redirectBase = referer.split('?')[0];

        // Stripe APIとダイナミックに通信して決済セッションを生成
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${redirectBase}?success=true&name=${encodeURIComponent(userName)}&time=${encodeURIComponent(pickupTime)}`,
            cancel_url: `${redirectBase}?cancel=true`,
        });

        res.json({ url: session.url });

    } catch (error) {
        // エラーハンドラーミドルウェアにエラーを安全に引き渡します
        next(error);
    }
});

// =========================================================================
// 🌐 【Cannot GET / 回避＆将来の互換性対策ミドルウェア】
// ルーティングエンジン（path-to-regexp）を介さない安全なフォールバック処理。
// これにより、Expressのどのバージョンでも絶対にクラッシュせずに
// 画面リソースの紐付けを行います。
// =========================================================================
app.use((req, res, next) => {
    // GETリクエストであり、かつ決済API（/create-checkout-session）以外のアクセスはすべて
    // 自動的にフロントエンド画面（index.html）へ安全に流し込みます。
    if (req.method === 'GET' && !req.path.startsWith('/create-checkout-session')) {
        const indexPath = path.join(publicPath, 'index.html');
        console.log(`📄 [DEBUG] フロントエンド画面を出力します (${indexPath})`);
        return res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('❌ [ERROR] フロントエンド画面の送信に失敗しました:', err.message);
                res.status(404).send('ハンバーガーショップ画面が見つかりません。フォルダ構成を確認してください。');
            }
        });
    }
    next();
});

// =========================================================================
// 🚨 【超重要：グローバル・JSONエラーハンドラーミドルウェア】
// システムのあらゆるエラー（Stripe通信失敗など）をここで強制的にキャッチし、
// ブラウザが解釈できる「綺麗なJSON形式」でエラー応答を100%返します。
// これにより「Unexpected token <」エラーの発生を完全に防止します！
// =========================================================================
app.use((err, req, res, next) => {
    console.error('❌ [FATAL ERROR] サーバー内部で例外が発生しました:', err.stack || err.message);
    
    // レスポンスのヘッダーをJSONに固定し、500エラーコードでJSONを返却します
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
        error: 'Stripe決済の処理中にエラーが発生しました。',
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