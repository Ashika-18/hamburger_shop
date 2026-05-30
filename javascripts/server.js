const path = require('path');

// プロジェクト直下の .env を確実に読み込む（起動場所に依存しない）
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Windows で SSL 検査がある環境向け（.env で STRIPE_DEV_INSECURE=true のときのみ）
if (process.env.STRIPE_DEV_INSECURE === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const https = require('https');
const tls = require('tls');
const express = require('express');
const cors = require('cors');

const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
    console.error('❌ .env の STRIPE_SECRET_KEY が未設定または形式が不正です。');
    console.error('   例: STRIPE_SECRET_KEY=sk_test_...（ダッシュボードのシークレットキーをコピー）');
    process.exit(1);
}

function getMergedCaCertificates() {
    const seen = new Set();
    const merged = [];
    const add = (certs) => {
        for (const cert of certs || []) {
            if (!seen.has(cert)) {
                seen.add(cert);
                merged.push(cert);
            }
        }
    };
    add(tls.rootCertificates);
    if (typeof tls.getCACertificates === 'function') {
        add(tls.getCACertificates('system'));
        add(tls.getCACertificates('default'));
    }
    return merged;
}

function createStripeHttpAgent() {
    const ca = getMergedCaCertificates();
    return new https.Agent({
        ca: ca.length > 0 ? ca : undefined,
        minVersion: 'TLSv1.2',
        keepAlive: true,
    });
}

const stripe = require('stripe')(stripeSecretKey, {
    httpAgent: createStripeHttpAgent(),
    maxNetworkRetries: 2,
});

function stripeErrorMessage(error) {
    if (error.type === 'StripeAuthenticationError') {
        return 'Stripe APIキーが無効です。.env の STRIPE_SECRET_KEY をダッシュボードで再コピーし、サーバーを再起動してください。';
    }
    if (
        error.type === 'StripeConnectionError' ||
        error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        /connection to Stripe/i.test(error.message || '')
    ) {
        return 'Stripeへの接続に失敗しました（SSL証明書）。.env に STRIPE_DEV_INSECURE=true を追加してサーバーを再起動するか、npm start で起動してください。';
    }
    return error.message;
}

async function verifyStripeConnection() {
    const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:5500';
    try {
        await stripe.balance.retrieve();
        await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'jpy',
                    product_data: { name: '接続テスト' },
                    unit_amount: 100,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${clientUrl}/index.html?success=true`,
            cancel_url: `${clientUrl}/index.html?cancel=true`,
        });
        console.log('✅ Stripe API 接続 OK（残高・Checkout 両方）');
    } catch (error) {
        console.error('❌ Stripe 接続エラー:', stripeErrorMessage(error));
        console.error('   詳細:', error.type, error.message);
        console.error('   → https://dashboard.stripe.com/test/apikeys でシークレットキーを再表示し、.env に貼り付けてください。');
        process.exit(1);
    }
}

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use((req, res, next) => {
    if (req.method === 'POST' && req.path === '/create-checkout-session') {
        console.log(`[${new Date().toLocaleTimeString()}] 決済リクエスト受信（商品数: ${req.body?.cartItems?.length ?? 0}）`);
    }
    next();
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://127.0.0.1:5500';

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { cartItems, userName, pickupTime } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'カートが空です。' });
        }

        const lineItems = cartItems.map((item) => ({
            price_data: {
                currency: 'jpy',
                product_data: { name: item.product.name },
                unit_amount: Math.round(Number(item.product.price)),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${CLIENT_URL}/index.html?success=true&name=${encodeURIComponent(userName || '')}&time=${encodeURIComponent(pickupTime || '')}`,
            cancel_url: `${CLIENT_URL}/index.html?cancel=true`,
        });

        console.log(`[${new Date().toLocaleTimeString()}] Checkout セッション作成 OK`);
        res.json({ url: session.url });
    } catch (error) {
        console.error('❌ Checkout Session 作成失敗:', error.type, error.message);
        res.status(500).json({
            error: 'Stripe決済の準備中にエラーが発生しました: ' + stripeErrorMessage(error),
        });
    }
});

const PORT = process.env.PORT || 3000;
verifyStripeConnection().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('==================================================');
        console.log(' NEST BURGER CRAFT - Stripe Checkout サーバー起動！');
        console.log(` APIポート: http://localhost:${PORT}`);
        console.log(' ※このターミナルは閉じずに、ブラウザで決済を試してください');
        console.log('==================================================');
    });
});
