const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const webhookController = require('./src/controllers/webhook.controller');



// Connect to Database
connectDB();

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(morgan('dev'));

// ⚠️ Webhook Route (MUST be before express.json)
app.post('/v1/webhooks/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// Global Body Parser
app.use(express.json());

// ----------------------------------------
// ROUTES IMPORT & SETUP
// ----------------------------------------
const authRoutes = require('./src/routes/auth.routes');
const catalogRoutes = require('./src/routes/catalog.routes');
const kycRoutes = require('./src/routes/kyc.routes'); // নতুন ইমপোর্ট


app.use('/v1/auth', authRoutes);
app.use('/v1/catalog', catalogRoutes); 
app.use('/v1/kyc', kycRoutes); // নতুন রাউট


// Base Health Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'TrulyMaple SyncFlow Engine is running locally!',
        environment: process.env.NODE_ENV
    });
});

// Shopify Fallback Redirect Handler (Updated for Production Flow)
app.get('/', (req, res) => {
    // ফ্রন্টএন্ড থেকে আসার সময় shop এবং vendorId আসবে
    const { shop, code, state, vendorId } = req.query;

    // ১. শপিফাই থেকে ফিরে আসার ফ্লো (code এবং state থাকলে callback-এ পাঠাও)
    if (code && shop && state) {
        return res.redirect(`/v1/auth/shopify/callback?code=${code}&shop=${shop}&state=${state}`);
    }

    // ২. শপিফাইতে যাওয়ার ফ্লো (shop এবং vendorId থাকলে)
    if (shop && vendorId) {
        // ⚠️ লক্ষ্য করুন: state=${vendorId} দিয়ে আমরা ভেন্ডরের আইডিটি শপিফাইকে দিয়ে দিচ্ছি
        const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_products,write_products&redirect_uri=http://localhost:3001/v1/auth/shopify/callback&state=${vendorId}`;
        return res.redirect(authUrl);
    }

    res.status(200).send('TrulyMaple Engine is running. Please provide shop and vendorId in the URL to connect.');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🔒 CORS allowed for: ${process.env.FRONTEND_URL}`);
    console.log(`=================================`);
});