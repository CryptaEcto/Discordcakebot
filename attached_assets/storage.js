const fs = require('fs');
const path = require('path');

function loadJson(filename) {
    const filepath = path.resolve(__dirname, filename);
    if (!fs.existsSync(filepath)) return {};
    try {
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Failed to load ${filename}:`, err);
        return {};
    }
}

function saveJson(filename, data) {
    const filepath = path.resolve(__dirname, filename);
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 4));
    } catch (err) {
        console.error(`Failed to save ${filename}:`, err);
    }
}

module.exports = { loadJson, saveJson };
