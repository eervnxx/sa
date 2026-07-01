const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    try {
        const { data: restaurant } = await db.from('restaurants').select('*').eq('id', id).single();
        if (!restaurant) return res.json({ error: 'Not found' });

        const { data: categories } = await db.from('categories').select('*').eq('restaurant_id', id).order('sort_order');
        const { data: dishes } = await db.from('dishes').select('*').eq('restaurant_id', id).order('sort_order');

        const result = { restaurant, categories: categories || [], dishes: dishes || [] };

        // حفظ في public/data/
        const dataDir = path.join(process.cwd(), 'public', 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(path.join(dataDir, `${id}.json`), JSON.stringify(result));

        return res.json({ data: result, cached: false });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
