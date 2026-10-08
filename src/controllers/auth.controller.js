const Vendor = require('../models/vendor.model');
const jwt = require('jsonwebtoken');

// টোকেন জেনারেট করার ফাংশন
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// Register Logic
exports.register = async (req, res) => {
    try {
        const { name, email, password, store_name } = req.body;

        // চেক করা ইমেইলটি আগে থেকেই আছে কি না
        const vendorExists = await Vendor.findOne({ email });
        if (vendorExists) {
            return res.status(400).json({ status: "error", message: "Vendor with this email already exists" });
        }

        // নতুন ভেন্ডর তৈরি করে ডাটাবেসে সেভ করা
        const vendor = await Vendor.create({ name, email, password, store_name });

        res.status(201).json({
            status: "success",
            message: "Registration successful. Please check your email for the verification OTP.",
            data: {
                vendor_id: vendor._id
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// Login Logic
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ডাটাবেস থেকে ইমেইল দিয়ে ভেন্ডর খোঁজা
        const vendor = await Vendor.findOne({ email });

        // ভেন্ডর পাওয়া গেলে এবং পাসওয়ার্ড মিলে গেলে রেসপন্স দেওয়া
        if (vendor && (await vendor.matchPassword(password))) {
            res.status(200).json({
                status: "success",
                data: {
                    token: generateToken(vendor._id),
                    vendor: {
                        id: vendor._id,
                        name: vendor.name,
                        email: vendor.email,
                        store_name: vendor.store_name,
                        kyc_verified: vendor.kyc_verified,
                        shopify_connected: vendor.shopify_connected
                    }
                }
            });
        } else {
            res.status(401).json({ status: "error", message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// Get Logged-in Vendor Profile (Protected Route)
exports.getProfile = async (req, res) => {
    // Middleware আগেই req.vendor-এর ভেতর ইউজারের ডেটা বসিয়ে দিয়েছে
    res.status(200).json({
        status: "success",
        data: req.vendor
    });
};


const axios = require('axios');

// Shopify OAuth Callback (Production Ready)
exports.shopifyCallback = async (req, res) => {
    // শপিফাই এখন state-এর ভেতর ভেন্ডর আইডিটি ফেরত পাঠাবে
    const { shop, code, state } = req.query; 

    if (!shop || !code || !state) {
        return res.status(400).send("Missing shop, code, or state parameter.");
    }

    try {
        // ১. টোকেনের জন্য Shopify-তে রিকোয়েস্ট পাঠানো
        const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: process.env.SHOPIFY_CLIENT_ID,
            client_secret: process.env.SHOPIFY_CLIENT_SECRET,
            code: code
        });

        const accessToken = response.data.access_token;
        
        // ২. State থেকে ভেন্ডরের আইডিটি বের করে ডাটাবেস আপডেট করা
        const vendorId = state; // state-এর ভেতরেই ভেন্ডর আইডি আছে
        const vendor = await Vendor.findById(vendorId);

        if (vendor) {
            // ডাটাবেসে স্ট্যাটাস আপডেট করা
            vendor.shopify_connected = true;
            vendor.onboarding_status = 'COMPLETED';
            vendor.shopify_access_token = accessToken; // ভবিষ্যতের জন্য টোকেন সেভ রাখা
            vendor.shop_domain = shop;
            
            await vendor.save(); // 👈 এই হচ্ছে আপনার কাঙ্ক্ষিত সেভ ফাংশন!
            console.log(`[Shopify OAuth] ✅ Vendor ${vendorId} successfully connected! Database updated.`);
        }

        // ৩. কাজ শেষ হওয়ার পর ফ্রন্টএন্ডের ড্যাশবোর্ডে রিডাইরেক্ট করে দেওয়া
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?shopify=success`);

    } catch (error) {
        console.error("❌ Error generating token:", error.response ? error.response.data : error.message);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?shopify=error`);
    }
};