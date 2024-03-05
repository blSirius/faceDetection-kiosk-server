const path = require("path");
const fs = require("fs").promises;

const fetch_face_data = async () => {
    const dbPath = path.join(process.cwd(), 'db.json')
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading the database file:');
        return [];
    }
}

module.exports = {
    fetch_face_data
};