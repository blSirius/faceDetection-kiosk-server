const axios = require('axios');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

require('dotenv').config();

async function imageTransfer() {
    const imgStorePath = path.join(process.cwd(), './imageFolder/knownImgStore');
    const files = await fsp.readdir(imgStorePath);

    for (const file of files) {
        const filePath = path.join(imgStorePath, file);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));

        try {
            const res = await axios.post(process.env.ENV_TARGET_PORT + '/imageTransfer', formData, {
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

async function dataTransfer() {
    const jsonPath = path.join(process.cwd(), './faceData/knownFaceData.json');
    try {
        const data = JSON.parse(await fsp.readFile(jsonPath, 'utf8'));
        console.log(data);

        const res = await axios.post(process.env.ENV_TARGET_PORT + '/dataTransfer', { data });
        console.log(res.data);

        await fsp.writeFile(jsonPath, JSON.stringify([]));
    } catch (error) {
        console.error('dataTransfer :', error);
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

async function unknownDataTransfer() {
    const jsonPath = path.join(process.cwd(), './faceData/unknownFaceData.json');
    try {
        const data = JSON.parse(await fsp.readFile(jsonPath, 'utf8'));
        console.log(data);

        const res = await axios.post(process.env.ENV_TARGET_PORT + '/unknownDataTransfer', { data });
        console.log(res.data);

        await fsp.writeFile(jsonPath, JSON.stringify([]));
    } catch (error) {
        console.error('unknownDataTransfer :', error);
    }
}

module.exports = {
    imageTransfer, dataTransfer, unknownImageTransfer, unknownDataTransfer
};
