const path = require('path');
const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    console.error('エラー: .env に STRIPE_SECRET_KEY が設定されていません。');
    console.error('  .env.example をコピーして .env を作成し、Stripe のシークレットキーを設定してください。');
    process.exit(1);
}

const stripe = require('stripe')(stripeSecretKey);

const app = express();

app.use(cors());
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5500';

/**
 * Stripe Checkout Session 生成APIエンドポイント
 * カート情報を受け取り、Stripeが提供する決済画面の専用URLを発行してフロントエンドへ返します。
 */
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { cartItems, userName, pickupTime } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'カートが空です。' });
        }

        // 1. カート内の全商品をStripe用の「line_items」データ構造に変換
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'jpy',
                product_data: {
                    name: item.product.name,
                    description: item.product.description,
                    // Unsplashなどの画像リンクがStripeから見えるパブリックなものである必要があります
                    images: [item.product.image],
                },
                unit_amount: item.product.price, // 各商品の単価 (税込)
            },
            quantity: item.quantity,
        }));

        // 総決済額の計算
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // 2. Stripe Checkout セッションを作成
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            // 決済完了時の引き戻し先（パラメータに予約情報を乗せてリダイレクトします）
            success_url: `${CLIENT_URL}/index.html?success=true&name=${encodeURIComponent(userName)}&time=${encodeURIComponent(pickupTime)}&amount=${totalAmount}`,
            // 決済キャンセル時の引き戻し先
            cancel_url: `${CLIENT_URL}/index.html?cancel=true`,
        });

        // 3. 発行された安全な決済画面のURLをクライアントに返送
        res.json({ url: session.url });

    } catch (err) {
        console.error('Checkout Session作成失敗:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ポート3000番でサーバーを監視
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🍔 NEST BURGER CRAFT - Stripe Checkout Sessionサーバー起動！`);
    console.log(`   - APIポート: http://localhost:${PORT}`);
    console.log(`====================================================`);
});