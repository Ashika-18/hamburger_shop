const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

// 最上部で環境変数（.env）を確実に読み込みます
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// =========================================================================
// 🔒 【安全ガード】Stripe秘密鍵の自動検証と空白クリーニング処理
// =========================================================================
let stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error('❌ [ERROR] STRIPE_SECRET_KEY が環境変数に設定されていません！');
    console.error('Renderの「Environment」設定画面で正しくキーが登録されているか確認してください。');
} else {
    // 前後にスペースや改行が混じっていても自動で100%綺麗に消去（トリム）します
    stripeSecretKey = stripeSecretKey.trim();
    console.log('🔑 [INFO] Stripe秘密鍵を正常に検出しました。(自動クリーニング済)');
}

// 通信タイムアウト時間を適切に制限（60秒）し、接続エラーを防止する設定を追加
const stripe = require('stripe')(stripeSecretKey, {
    timeout: 60000 // 60秒
});

const app = express();

// フロントエンド（ブラウザ）からのアクセスをすべて許可
app.use(cors({
    origin: '*'
}));
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5500';

// Stripe Checkout セッションを作成するAPI
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { cartItems, userName, pickupTime } = req.body;

        // APIキーが正常に読み込めていない場合の安全ガード
        if (!stripeSecretKey) {
            return res.status(500).json({ 
                error: 'サーバー側でStripeのAPIキー（秘密鍵）が設定されていません。Renderの設定を確認してください。' 
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${CLIENT_URL}/index.html?success=true&name=${encodeURIComponent(userName)}&time=${encodeURIComponent(pickupTime)}`,
            cancel_url: `${CLIENT_URL}/index.html?cancel=true`,
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('❌ Checkout Session作成失敗:', error.message);
        res.status(500).json({ error: 'Stripe決済の準備中にエラーが発生しました: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log(' NEST BURGER CRAFT - Stripe Checkout サーバー起動！');
    console.log(` APIポート: http://localhost:${PORT}`);
    console.log('==================================================');
});