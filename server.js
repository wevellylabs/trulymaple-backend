const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// ----------------------------------------
// ROUTES IMPORT & SETUP
// ----------------------------------------
const authRoutes = require('./src/routes/auth.routes');
const catalogRoutes = require('./src/routes/catalog.routes'); // নতুন ইমপোর্ট

app.use('/v1/auth', authRoutes);
app.use('/v1/catalog', catalogRoutes); // নতুন রাউট

// Base Health Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'TrulyMaple SyncFlow Engine is running locally!',
        environment: process.env.NODE_ENV
    });
});

// Shopify Fallback Redirect Handler (Updated for OAuth Flow)
app.get('/', (req, res) => {
    const { shop, code } = req.query;

    // ১. যদি লিংকে code এবং shop দুটিই থাকে, তবে টোকেন জেনারেট করার রাউটে পাঠাও
    if (code && shop) {
        return res.redirect(`/v1/auth/shopify/callback?code=${code}&shop=${shop}`);
    }

    // ২. যদি লিংকে শুধু shop থাকে (অর্থাৎ ইনস্টলের প্রথম ধাপ), তবে পারমিশন পেজে পাঠাও
    if (shop) {
        const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_products,write_products&redirect_uri=http://localhost:3001/v1/auth/shopify/callback`;
        return res.redirect(authUrl);
    }

    // ৩. কোনো কিছুই না থাকলে সাধারণ মেসেজ দেখাও
    res.status(200).send('TrulyMaple Engine is running. Waiting for Shopify connection...');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🔒 CORS allowed for: ${process.env.FRONTEND_URL}`);
    console.log(`=================================`);
});