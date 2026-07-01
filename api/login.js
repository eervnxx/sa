const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    try {
        const { data, error } = await db.from('restaurants').select('*').eq('admin_email', email).eq('admin_password', password).single();
        if (error || !data) return res.json({ error: 'Invalid credentials' });
        return res.json({ data: { id: data.id, name: data.name } });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
