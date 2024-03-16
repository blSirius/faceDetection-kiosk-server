const axios = require('axios');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const db = require('./database/mysql')

require('dotenv').config();

async function knownImageTransfer() {
    const imgStorePath = path.join(process.cwd(), './imageFolder/knownImgStore');
    const files = await fsp.readdir(imgStorePath);

    for (const file of files) {
        const filePath = path.join(imgStorePath, file);
        const formData = new FormData();
        formData.append('image', await fs.createReadStream(filePath));

        try {
            const res = await axios.post(process.env.ENV_TARGET_PORT + '/knownImageTransfer', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            console.log(`Uploaded ${file} successfully:`, res.data);
            await fsp.unlink(filePath);
        } catch (error) {
            console.error(`Failed to upload ${file}:`, error.message);
        }
    }
}

async function unknownImageTransfer() {
    const imgStorePath = path.join(process.cwd(), './imageFolder/unknownImgStore');
    const files = await fsp.readdir(imgStorePath);

    for (const file of files) {
        const filePath = path.join(imgStorePath, file);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));

        try {
            const res = await axios.post(process.env.ENV_TARGET_PORT + '/unknownImageTransfer', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            console.log(`Uploaded ${file} successfully:`, res.data);
            await fsp.unlink(filePath);
        } catch (error) {
            console.error(`Failed to upload ${file}:`, error.message);
        }
    }
}

async function knownDataTransfer() {
    const jsonPath = path.join(process.cwd(), './faceData/knownFaceData.json'); // Use __dirname to ensure the path is correctly resolved.
    try {
        const data = JSON.parse(await fsp.readFile(jsonPath, 'utf8'));

        if (data.length === 0) {
            console.log('No data to transfer.');
            return;
        }
        const updatedData = data.map(({ id, ...rest }) => rest);

        let sql = 'INSERT INTO face_detection (name, expression, age, gender, date, time, path, env_path, greeting) VALUES ?';
        let values = updatedData.map(item => [item.name, item.expression, item.age, item.gender, item.date, item.time, item.path, item.env_path, item.greeting]);

        await db.query(sql, [values]).then(result => {
            console.log('Data transferred successfully:', result);
        }).catch(err => {
            throw err;
        });

        await fsp.writeFile(jsonPath, JSON.stringify([]));
        console.log('unknownDataTransfer is successful');
    } catch (error) {
        console.error('DataTransfer error:', error);
    }
}

async function unknownDataTransfer() {
    const jsonPath = path.join(process.cwd(), './faceData/unknownFaceData.json'); // Use __dirname to ensure the path is correctly resolved.
    try {
        const data = JSON.parse(await fsp.readFile(jsonPath, 'utf8'));
        if (data.length === 0) {
            console.log('No data to transfer.');
            return;
        }

        let sql = 'INSERT INTO face_detection (name, expression, age, gender, date, time, path, env_path, greeting) VALUES ?';
        let values = data.map(item => [item.name, item.expression, item.age, item.gender, item.date, item.time, item.path, item.env_path, item.greeting]);

        await db.query(sql, [values]).then(result => {
            console.log('Data transferred successfully:', result);
        }).catch(err => {
            throw err;
        });

        await fsp.writeFile(jsonPath, JSON.stringify([]));
        console.log('unknownDataTransfer is successful');
    } catch (error) {
        console.error('DataTransfer error:', error);
    }
}

async function envImageTransfer() {
    const imgStorePath = path.join(process.cwd(), './imageFolder/envImgStore');
    const files = await fsp.readdir(imgStorePath);

    for (const file of files) {
        const filePath = path.join(imgStorePath, file);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));

        try {
            const res = await axios.post(process.env.ENV_TARGET_PORT + '/envImageTransfer', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            console.log(`Uploaded ${file} successfully:`, res.data);
            await fsp.unlink(filePath);
        } catch (error) {
            console.error(`Failed to upload ${file}:`, error.message);
        }
    }
}

module.exports = {
    knownImageTransfer, knownDataTransfer, unknownImageTransfer, unknownDataTransfer, envImageTransfer
};