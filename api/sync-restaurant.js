const { createClient } = require('@supabase/supabase-js');

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

        return res.json({ data: { restaurant, categories: categories || [], dishes: dishes || [] } });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
