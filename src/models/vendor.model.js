const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    store_name: { type: String, required: true },
    kyc_verified: { type: Boolean, default: false },
    shopify_connected: { type: Boolean, default: false },
    shopify_access_token: { type: String },
    shop_domain: { type: String },
    // নতুন যুক্ত করা ৩টি ফিল্ড
    accepts_promos_and_offers: {
        type: Boolean,
        default: false
    },
    solicitation_status: {
        type: String,
        enum: ['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    onboarding_status: {
        type: String,
        enum: [
            'REGISTERED',           // প্রথমবার একাউন্ট খুললে
            'PAYMENT_PENDING',      // পেমেন্ট পেজে গেলে
            'PENDING_SHOPIFY_AUTH', // Stripe থেকে পেমেন্ট সাকসেস হলে
            'COMPLETED'             // শপিফাই কানেক্ট হওয়ার পর
        ],
        default: 'REGISTERED'
    },
    // নতুন ফিল্ড: Stripe Connect Account ID সেভ রাখার জন্য
    stripe_account_id: { 
        type: String 
    }
}, { timestamps: true });

// ডাটাবেসে সেভ হওয়ার আগে পাসওয়ার্ড এনক্রিপ্ট বা হ্যাশ করা (Updated)
vendorSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// লগইন করার সময় পাসওয়ার্ড মেলানোর ফাংশন
vendorSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Vendor', vendorSchema);