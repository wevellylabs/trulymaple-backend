const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Vendor = require('../models/vendor.model');

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ⚠️ পরিবর্তন: যখন ভেন্ডর তার KYC কমপ্লিট করবে, তখন Stripe এই ইভেন্টটি পাঠাবে
    if (event.type === 'account.updated') {
        const account = event.data.object;
        
        // details_submitted মানে হলো ভেন্ডর তার ফর্ম এবং ডকুমেন্টস ঠিকঠাক সাবমিট করেছে
        // payouts_enabled মানে হলো সে টাকা রিসিভ করার জন্য প্রস্তুত
        if (account.details_submitted || account.payouts_enabled) {
            try {
                await Vendor.findOneAndUpdate(
                    { stripe_account_id: account.id },
                    { 
                        kyc_verified: true,
                        onboarding_status: 'PENDING_SHOPIFY_AUTH'
                    }
                );
                console.log(`[Webhook] ✅ KYC successful! kyc_verified updated to TRUE.`);
            } catch (error) {
                console.error(`[Webhook] ❌ Database update failed:`, error.message);
            }
        }
    }

    res.status(200).json({ received: true });
};