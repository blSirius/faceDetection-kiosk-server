const path = require('path');
const fs = require('fs').promises;
const NodeCache = require("node-cache");
const mysqlDB = require('./database/mysql.js');

const knowCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

async function saveImageAndFaceData(results, extractFaces, envFile) {

    let db;
    let nextId;

    try {
        const data = await fs.readFile(path.join(process.cwd(), './faceData/knownFaceData.json'), 'utf8');
        db = JSON.parse(data);
        nextId = db.length + 1;
    } catch (error) {
        db = [];
        nextId = 1;
    }

    await Promise.all(results.map(async ({ detection: { expressions, age, gender }, faceMatch: { label } }, index) => {

        if (!knowCache.has(label)) {
            knowCache.set(label, true, 120);

            const saved = path.join(process.cwd(), './imageFolder/envImgStore/' + envFile.name);
            envFile.mv(saved);

            const date = new Date().toISOString().split('T')[0];
            const parts = date.split('-');
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

            const time = new Date().toTimeString().split(' ')[0];
            const expression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];

            const imgDir = path.resolve(process.cwd(), './imageFolder/knownImgStore');
            await fs.mkdir(imgDir, { recursive: true });

            const newPath = 'face' + label + Date.now() + index + '.jpg';
            const outPath = path.join(imgDir, newPath);
            if (extractFaces[index]) {
                const data = extractFaces[index].toBuffer('image/png');
                await fs.writeFile(outPath, data);
                console.log(`Saved face image to ${outPath}`);
            }

            const expressionData = path.join(process.cwd(), './faceData/expressionData.json');
            const data = await fs.readFile(expressionData, 'utf8');
            const greetings = JSON.parse(data).filter(item => item.emotion === expression);
            const greeting = greetings[Math.floor(Math.random() * greetings.length)].greeting

            db.push({
                id: nextId++, name: label, expression, age, gender, date: formattedDate, time, path: newPath, env_path: envFile.name, greeting: greeting,
            });

            await fs.writeFile(path.join(process.cwd(), './faceData/knownFaceData.json'), JSON.stringify(db, null, 2));
            console.log('Results saved to faceData.json');

        } else {
            knowCache.ttl(label, 120);
        }
    }));
};

async function saveExpressionData() {
    try {
        const greeting = await mysqlDB.query('SELECT * FROM expression');
        await fs.writeFile(path.join(process.cwd(), './faceData/expressionData.json'), JSON.stringify(greeting, null, 2));
        console.log('Update ExpressionData');
    } catch (error) {
        console.log(error);
    }
}

module.exports = { saveImageAndFaceData, saveExpressionData };