const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Vendor = require('../models/vendor.model');

exports.generateKycLink = async (req, res) => {
    try {
        const { vendorId } = req.body;
        const vendor = await Vendor.findById(vendorId);

        if (!vendor) {
            return res.status(404).json({ status: 'error', message: 'Vendor not found' });
        }

        let stripeAccountId = vendor.stripe_account_id;

        // ১. যদি ভেন্ডরের Stripe অ্যাকাউন্ট না থাকে, তবে নতুন তৈরি করা
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                email: vendor.email,
                capabilities: {
                    transfers: { requested: true }, // টাকা রিসিভ করার পারমিশন
                },
            });
            stripeAccountId = account.id;
            
            // ডাটাবেসে সেভ করে রাখা
            vendor.stripe_account_id = stripeAccountId;
            await vendor.save();
        }

        // ২. Stripe থেকে KYC অনবোর্ডিং লিংক তৈরি করা
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${process.env.FRONTEND_URL}/dashboard/kyc-refresh`,
            return_url: `${process.env.FRONTEND_URL}/dashboard?kyc=success`,
            type: 'account_onboarding',
        });

        // ৩. ফ্রন্টএন্ডে লিংকটি পাঠানো
        res.status(200).json({
            status: 'success',
            kycUrl: accountLink.url
        });

    } catch (error) {
        console.error('❌ KYC Link Generation Error:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
};