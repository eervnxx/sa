const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const filePath = path.join('/tmp', 'data', `${id}.json`);
    
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return res.json({ data, source: 'cache' });
    }
    
    return res.json({ error: 'Not cached yet', redirect: `/api/get-restaurant` });
};
