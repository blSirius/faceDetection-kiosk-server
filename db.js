const fs = require('fs').promises;
const { log } = require('console');
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const path = require('path');

async function save(results, extractFaces) {
    let db;
    let nextId;

    try {
        const data = await fs.readFile('./db.json', 'utf8');
        db = JSON.parse(data);
        nextId = db.length + 1;
    } catch (error) {
        // Handle specific error (e.g., file not found) if needed
        db = [];
        nextId = 1;
    }

    await Promise.all(results.map(async ({ detection: { expressions, age, gender }, faceMatch: { label } }, index) => {
        if (!myCache.has(label)) {
            myCache.set(label, true, 120);

            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toTimeString().split(' ')[0];
            const expression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];

            db.push({
                id: nextId++, name: label, age, gender, date, time, expression
            });

            // Ensure the directory exists
            const imgDir = path.resolve(__dirname, './imgStore');
            await fs.mkdir(imgDir, { recursive: true });

            // Save face image if available
            if (extractFaces[index]) {
                const outPath = path.join(imgDir, `face_${label}_${Date.now()}_${index}.png`);
                const data = extractFaces[index].toBuffer('image/png');
                await fs.writeFile(outPath, data);
                log(`Saved face image to ${outPath}`);
            }
        } else {
            myCache.ttl(label, 120);
        }
    }));

    try {
        await fs.writeFile('./db.json', JSON.stringify(db, null, 2));
        log('Results saved to db.json');
    } catch (error) {
        console.error('Error writing to db.json:', error);
    }
}

module.exports = { save };