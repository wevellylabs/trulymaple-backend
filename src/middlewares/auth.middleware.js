const jwt = require('jsonwebtoken');
const Vendor = require('../models/vendor.model');

exports.protect = async (req, res, next) => {
    let token;

    // ১. চেক করা হেডারে Authorization আছে কি না এবং সেটি Bearer দিয়ে শুরু কি না
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // ২. 'Bearer <token>' থেকে শুধু টোকেনের অংশটুকু আলাদা করা
            token = req.headers.authorization.split(' ')[1];

            // ৩. টোকেনটি আসল কি না তা ভেরিফাই করা (আমাদের সিক্রেট কি দিয়ে)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // ৪. টোকেন থেকে পাওয়া ID দিয়ে ডাটাবেস থেকে ইউজারের সব ডেটা (পাসওয়ার্ড বাদে) বের করে আনা
            req.vendor = await Vendor.findById(decoded.id).select('-password');
            
            // ৫. সব ঠিক থাকলে সামনের কাজে (Next) যেতে দেওয়া
            next();
        } catch (error) {
            return res.status(401).json({ status: "error", message: "Not authorized, token failed or expired" });
        }
    }

    // যদি কোনো টোকেনই না দেওয়া হয়
    if (!token) {
        return res.status(401).json({ status: "error", message: "Not authorized, no token provided" });
    }
};