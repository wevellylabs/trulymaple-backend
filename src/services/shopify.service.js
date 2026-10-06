const axios = require('axios');

exports.fetchProducts = async (shopDomain, accessToken) => {
    try {
        let allProducts = [];
        // লিমিট ২৫০ করে দেওয়া হলো (এটি শপিফাইয়ের সর্বোচ্চ লিমিট)
        let url = `https://${shopDomain}/admin/api/2024-01/products.json?limit=250`;

        // যতক্ষণ পরের পেজ (Next URL) থাকবে, ততক্ষণ লুপ চলতে থাকবে
        while (url) {
            console.log(`[Shopify Service] Fetching data from: ${url.split('?')[0]}...`);
            
            const response = await axios.get(url, {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                }
            });
            
            // নতুন প্রোডাক্টগুলো আমাদের মেইন অ্যারেতে যোগ করা হচ্ছে
            allProducts = allProducts.concat(response.data.products);

            // শপিফাই হেডারে 'Link' পাঠায়, সেখানে পরের পেজের লিংক থাকে
            const linkHeader = response.headers.link;
            
            if (linkHeader && linkHeader.includes('rel="next"')) {
                // RegEx ব্যবহার করে 'next' পেজের আসল লিংকটি বের করে আনা
                const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                url = match ? match[1] : null;
            } else {
                // আর কোনো পেজ না থাকলে লুপ বন্ধ করে দাও
                url = null;
            }
        }
        
        return allProducts;
    } catch (error) {
        console.error("❌ Shopify API Error:", error.response ? error.response.data : error.message);
        throw error;
    }
};