const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const Product = require('../models/product.model');
const aiService = require('../services/ai.service');

const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
connection.on('error', () => {}); // Idle connection error হাইড করার জন্য

const translationQueue = new Queue('ai-translation', { connection });

const worker = new Worker('ai-translation', async (job) => {
    const { productId } = job.data;
    
    // ডাটাবেস থেকে প্রোডাক্ট খুঁজে বের করা
    const product = await Product.findById(productId);
    if (!product || product.is_translated) return;

    console.log(`\n[AI Worker] 🧠 Translating: "${product.title}"`);

    // AI সার্ভিস কল করা (ফ্রেঞ্চ ভাষার জন্য)
    const translatedData = await aiService.translateProduct(product.title, product.description, 'French');

    if (translatedData) {
        // ডাটাবেসে ট্রান্সলেশন সেভ করা
        product.translated_title = translatedData.translated_title;
        product.translated_description = translatedData.translated_description;
        product.is_translated = true;
        await product.save();
        
        console.log(`[AI Worker] ✅ Success! Saved as: "${product.translated_title}"`);
    }
    
    // API Rate Limit থেকে বাঁচতে প্রতিটি রিকোয়েস্টের পর ২ সেকেন্ড ব্রেক
    await new Promise(resolve => setTimeout(resolve, 2000));

}, { connection });

worker.on('failed', (job, err) => {
    console.error(`[AI Worker] ❌ Job failed for Product ID ${job.data.productId}:`, err.message);
});

module.exports = { translationQueue };