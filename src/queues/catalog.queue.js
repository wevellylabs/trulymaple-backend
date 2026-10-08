const { translationQueue } = require('./translation.queue');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const shopifyService = require('../services/shopify.service');
const Product = require('../models/product.model'); // প্রোডাক্ট মডেল ইমপোর্ট

const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null
});

// এই ৩ লাইন যুক্ত করুন
connection.on('error', (err) => {
    // console.log('[Redis] Background connection reset. Auto-reconnecting...');
});

const catalogQueue = new Queue('catalog-sync', { connection });

const worker = new Worker('catalog-sync', async (job) => {
    console.log(`\n[Queue] ⚙️ Processing Job ID: ${job.id} for Vendor: ${job.data.vendorId}`);

    try {
        // ১. শপিফাই থেকে প্রোডাক্ট ফেচ করা
        const products = await shopifyService.fetchProducts(
            process.env.SHOPIFY_TEST_DOMAIN,
            process.env.SHOPIFY_TEST_TOKEN
        );
        console.log(`[Queue] 📥 Downloaded ${products.length} products from Shopify.`);
        console.log(`[Queue] 💾 Saving to MongoDB...`);

        // ২. ডাটাবেসে সেভ করা বা আপডেট করা
        let savedCount = 0;
        for (const item of products) {
            // findOneAndUpdate এবং upsert: true ব্যবহারের সুবিধা হলো, 
            // যদি প্রোডাক্টটি আগে থেকেই থাকে তবে আপডেট হবে, না থাকলে নতুন তৈরি হবে (Duplicate হবে না)
            await Product.findOneAndUpdate(
                { shopify_product_id: item.id.toString(), vendor: job.data.vendorId },
                {
                    vendor: job.data.vendorId,
                    shopify_product_id: item.id.toString(),
                    title: item.title,
                    description: item.body_html,
                    status: item.status
                },
                { upsert: true, returnDocument: 'after' }
            );
            savedCount++;
        }

        console.log(`[Queue] ✅ Successfully saved/updated ${savedCount} products in MongoDB!`);
        
        // AI ট্রান্সলেশনের কাজ শুরু
        console.log(`[Queue] 🚀 Fetching untranslated products to send to AI...`);
        const untranslated = await Product.find({ vendor: job.data.vendorId, is_translated: false });
        
        // টেস্টিং এবং API টোকেন ব্যালেন্স বাঁচানোর জন্য আপাতত প্রথম ৩টি প্রোডাক্ট এআই-কে দিচ্ছি
        // (ভবিষ্যতে প্রোডাকশনে আমরা untranslated.forEach ব্যবহার করব)
        const testBatch = untranslated.slice(0, 3); 

        for (const prod of testBatch) {
            await translationQueue.add('translate', { productId: prod._id });
        }
        console.log(`[Queue] 🤖 Sent ${testBatch.length} products to AI Translation Queue!`);

        console.log(`[Queue] 🎉 Job ${job.id} Completed!\n`);

    } catch (error) {
        console.error(`[Queue] ❌ Job ${job.id} failed:`, error.message);
    }
}, { connection });

worker.on('failed', (job, err) => {
    console.error(`[Queue] ❌ Job ${job.id} completely failed:`, err.message);
});

module.exports = { catalogQueue };