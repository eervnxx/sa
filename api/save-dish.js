const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { id, restaurant_id, name, price, description, category_id, is_available } = req.body;
    if (!restaurant_id || !name || !price) return res.status(400).json({ error: 'missing fields' });

    try {
        const dishData = {
            restaurant_id,
            name,
            price,
            description: description || '',
            category_id: category_id || null,
            is_available: is_available !== false,
            sort_order: Date.now()
        };

        let savedId = id;
        if (id) {
            await db.from('dishes').update(dishData).eq('id', id);
        } else {
            const { data: newDish } = await db.from('dishes').insert(dishData).select();
            if (newDish && newDish.length > 0) savedId = newDish[0].id;
        }

        // تحديث ملف JSON للمطعم
        await updateRestaurantJSON(restaurant_id);

        return res.json({ success: true, id: savedId });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

async function updateRestaurantJSON(restaurant_id) {
    const { data: restaurant } = await db.from('restaurants').select('*').eq('id', restaurant_id).single();
    const { data: categories } = await db.from('categories').select('*').eq('restaurant_id', restaurant_id).order('sort_order');
    const { data: dishes } = await db.from('dishes').select('*').eq('restaurant_id', restaurant_id).order('sort_order');
    
    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, `${restaurant_id}.json`), JSON.stringify({ restaurant, categories: categories || [], dishes: dishes || [] }));
}
