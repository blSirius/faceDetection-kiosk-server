const fs = require('fs');
const path = require('path');


const imgStorePath = path.join(process.cwd(), './imageFolder/unknownImgStore');
if (!fs.existsSync(imgStorePath)) {
    fs.mkdirSync(imgStorePath, { recursive: true });
}

async function saveUnknownImageAndFaceData(faceData, imageBuffer) {
    try {
        const timestamp = Date.now();
        const imgFilename = `unknown-${timestamp}.png`;
        const dataFilename = './faceData/unknownFaceData.json';
        const dataPath = path.join(process.cwd(), dataFilename);

        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().split(' ')[0];

        if (imageBuffer && typeof imageBuffer.toBuffer === 'function') {
            const buffer = imageBuffer.toBuffer();
            const imagePath = path.join(imgStorePath, imgFilename);
            fs.writeFileSync(imagePath, buffer);
            console.log(`Data and image for ${imgFilename} saved successfully.`);
        } else {
            console.error('Expected a Canvas object but received something else.');
            return;
        }

        let existingData = [];
        if (fs.existsSync(dataPath)) {
            const existingContent = fs.readFileSync(dataPath, 'utf8').trim();
            if (existingContent) {
                try {
                    existingData = JSON.parse(existingContent);
                } catch (parseError) {
                    console.error('Error parsing JSON from data file:', parseError);
                }
            }
        }

        const expression = Object.entries(faceData.expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        const expressionsPath = path.join(process.cwd(), './faceData/expressionData.json');

        let greeting = 'Hello';
        try {
            const expressionsContent = fs.readFileSync(expressionsPath, 'utf8');
            const expressionsData = JSON.parse(expressionsContent);
            const greetings = expressionsData.filter(item => item.emotion === expression);
            greeting = greetings[Math.floor(Math.random() * greetings.length)].greeting;


        } catch (readError) {
            console.error('Error reading expressions file:', readError);
        }

        const dataToStore = {
            name: 'unknown',
            expression: expression,
            age: faceData.age,
            gender: faceData.gender,
            date: date,
            time: time,
            path: imgFilename,
            greeting: greeting
        };

        existingData.push(dataToStore);
        fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

        console.log('Data updated successfully.');
    } catch (error) {
        console.error('Error saving unknown image and face data:', error);
    }
}

module.exports = { saveUnknownImageAndFaceData };