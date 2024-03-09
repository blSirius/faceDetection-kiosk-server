const axios = require('axios');
const fs = require('fs'); // For createReadStream
const fsp = require('fs').promises; // For promise-based operations
const path = require('path');
const FormData = require('form-data');

require('dotenv').config();

async function imageTransfer() {
    const imgStorePath = path.join(process.cwd(), 'imgStore');
    const files = await fsp.readdir(imgStorePath); // promise-based read

    for (const file of files) {
        const filePath = path.join(imgStorePath, file);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath)); // stream-based function

        try {
            const res = await axios.post(process.env.ENV_TARGET_PORT + '/imageTransfer', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            console.log(`Uploaded ${file} successfully:`, res.data);
            await fsp.unlink(filePath); // promise-based delete
        } catch (error) {
            console.error(`Failed to upload ${file}:`, error.message);
        }
    }
}

async function dataTransfer() {
    const jsonPath = path.join(process.cwd(), 'faceData.json');
    try {
        const data = JSON.parse(await fsp.readFile(jsonPath, 'utf8')); // promise-based read
        console.log(data);

        const res = await axios.post(process.env.ENV_TARGET_PORT + '/dataTransfer', { data });
        console.log(res.data);

        await fsp.writeFile(jsonPath, JSON.stringify([])); // promise-based write (clearing the file)
    } catch (error) {
        console.error('dataTransfer :', error);
    }
}

async function unknownImageTransfer() {
    const imgStorePath = path.join(process.cwd(), 'unknownImgStore');
    const files = await fsp.readdir(imgStorePath); // promise-based read

    for (const file of files) {
        const filePath = path.join(imgStorePath, file);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath)); // stream-based function

        try {
            const res = await axios.post(process.env.ENV_TARGET_PORT + '/unknownImageTransfer', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            console.log(`Uploaded ${file} successfully:`, res.data);
            await fsp.unlink(filePath); // promise-based delete
        } catch (error) {
            console.error(`Failed to upload ${file}:`, error.message);
        }
    }
}

async function unknownDataTransfer() {
    const jsonPath = path.join(process.cwd(), 'unknownFaceData.json');
    try {
        const data = JSON.parse(await fsp.readFile(jsonPath, 'utf8')); // promise-based read
        console.log(data);

        const res = await axios.post(process.env.ENV_TARGET_PORT + '/unknownDataTransfer', { data });
        console.log(res.data);

        await fsp.writeFile(jsonPath, JSON.stringify([])); // promise-based write (clearing the file)
    } catch (error) {
        console.error('unknownDataTransfer :', error);
    }
}

module.exports = {
    imageTransfer, dataTransfer, unknownImageTransfer, unknownDataTransfer
};
