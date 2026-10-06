const { catalogQueue } = require('../queues/catalog.queue');

exports.startSync = async (req, res) => {
    try {
        // Queue-তে একটি নতুন জব যুক্ত করা হচ্ছে
        const job = await catalogQueue.add('sync-shopify', {
            vendorId: req.vendor._id,
            store: req.vendor.store_name,
            task: 'DOWNLOAD_AND_AI_TRANSLATE'
        });

        res.status(202).json({
            status: "processing",
            message: "Catalog sync started in the background. We will notify you once done.",
            jobId: job.id
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};