const path = require("path");
const fs = require("fs").promises;

const fetch_face_data = async () => {
    const dbPath = path.join(process.cwd(), 'db.json')
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        const users = JSON.parse(data);

        const filteredUsers = users
            .filter(user => user.name.toLowerCase() !== "unknown")
            .sort((a, b) => b.id - a.id)
            .slice(0, 5);

        return filteredUsers;
    } catch (error) {
        console.error('Error reading the database file:', error);
        return [];
    }
}

module.exports = {
    fetch_face_data
};