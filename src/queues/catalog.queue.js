const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// Redis এর সাথে কানেকশন তৈরি
const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null
});

// ক্যাটালগ সিঙ্কের জন্য একটি লাইন বা Queue তৈরি
const catalogQueue = new Queue('catalog-sync', { connection });

// Worker (যে ব্যাকগ্রাউন্ডে ভারী কাজগুলো করবে)
const worker = new Worker('catalog-sync', async (job) => {
    console.log(`[Queue] ⚙️ Processing Background Job ID: ${job.id}`);
    console.log(`[Queue] 📦 Task Payload:`, job.data);
    
    // এখানে আমরা ভারী কাজের সিমুলেশন করছি (যেমন: ৫ সেকেন্ড ধরে শপিফাই থেকে ডেটা আনছে)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`[Queue] ✅ Job ${job.id} Completed successfully!`);
}, { connection });

worker.on('failed', (job, err) => {
    console.error(`[Queue] ❌ Job ${job.id} failed:`, err.message);
});

module.exports = { catalogQueue };