const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.translateProduct = async (title, description, targetLanguage = 'French') => {
    try {
        const prompt = `You are an expert e-commerce translator. Translate the following product title and description into ${targetLanguage}. 
        CRITICAL RULES:
        1. Keep all HTML tags exactly as they are.
        2. Only translate the text content.
        3. Return the response in valid JSON format with keys "translated_title" and "translated_description".
        
        Title: ${title}
        Description: ${description}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // বড় ক্যাটালগের জন্য এটি খুব ফাস্ট এবং কস্ট-ইফেক্টিভ
            response_format: { type: "json_object" }, // গ্যারান্টিড JSON রেসপন্স
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });

        // JSON স্ট্রিংকে পার্স করে অবজেক্টে রূপান্তর করা
        return JSON.parse(response.choices[0].message.content);
        
    } catch (error) {
        console.error("❌ AI Translation Error:", error.message);
        return null;
    }
};