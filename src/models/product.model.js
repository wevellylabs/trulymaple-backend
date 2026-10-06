const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // কোন ভেন্ডরের (সেলার) প্রোডাক্ট, তা চেনার জন্য
    vendor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Vendor', 
        required: true 
    },
    // শপিফাইয়ের অরিজিনাল আইডি
    shopify_product_id: { 
        type: String, 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    status: { 
        type: String, 
        default: 'active' 
    },
    // ভবিষ্যতে AI ট্রান্সলেশন ট্র্যাক করার জন্য
    is_translated: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);