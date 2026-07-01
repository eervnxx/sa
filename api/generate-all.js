const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
    try {
        // جلب جميع المطاعم
        const { data: restaurants } = await db
            .from('restaurants')
            .select('id');

        if (!restaurants || restaurants.length === 0) {
            return res.json({ message: 'No restaurants found' });
        }

        const dataDir = path.join(process.cwd(), 'public', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const results = [];

        for (const rest of restaurants) {
            try {
                // جلب بيانات كل مطعم
                const { data: restaurant } = await db
                    .from('restaurants')
                    .select('*')
                    .eq('id', rest.id)
                    .single();

                const { data: categories } = await db
                    .from('categories')
                    .select('*')
                    .eq('restaurant_id', rest.id)
                    .order('sort_order');

                const { data: dishes } = await db
                    .from('dishes')
                    .select('*')
                    .eq('restaurant_id', rest.id)
                    .order('sort_order');

                const jsonData = {
                    restaurant: restaurant,
                    categories: categories || [],
                    dishes: dishes || [],
                    generated_at: new Date().toISOString()
                };

                const filePath = path.join(dataDir, `${rest.id}.json`);
                fs.writeFileSync(filePath, JSON.stringify(jsonData));

                results.push({ id: rest.id, status: 'success' });
            } catch (err) {
                results.push({ id: rest.id, status: 'error', error: err.message });
            }
        }

        return res.json({
            success: true,
            generated: results.length,
            details: results
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Generation failed',
            details: error.message
        });
    }
};
