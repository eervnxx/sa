const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// المفاتيح من Environment Variables في Vercel
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { restaurant_id } = req.body;

    if (!restaurant_id) {
        return res.status(400).json({ error: 'restaurant_id required' });
    }

    try {
        // جلب بيانات المطعم
        const { data: restaurant } = await db
            .from('restaurants')
            .select('*')
            .eq('id', restaurant_id)
            .single();

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // جلب التصنيفات
        const { data: categories } = await db
            .from('categories')
            .select('*')
            .eq('restaurant_id', restaurant_id)
            .order('sort_order');

        // جلب الأطباق
        const { data: dishes } = await db
            .from('dishes')
            .select('*')
            .eq('restaurant_id', restaurant_id)
            .order('sort_order');

        // تجميع البيانات
        const jsonData = {
            restaurant: restaurant,
            categories: categories || [],
            dishes: dishes || [],
            generated_at: new Date().toISOString()
        };

        // حفظ الملف في public/data/
        const dataDir = path.join(process.cwd(), 'public', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const filePath = path.join(dataDir, `${restaurant_id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

        return res.status(200).json({
            success: true,
            message: `JSON generated for restaurant ${restaurant_id}`,
            file: `/data/${restaurant_id}.json`
        });

    } catch (error) {
        console.error('Sync error:', error);
        return res.status(500).json({
            error: 'Sync failed',
            details: error.message
        });
    }
};
