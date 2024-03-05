const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

require('dotenv').config()

async function imageTransfer() {
    const imgStorePath = path.join(process.cwd(), 'imgStore')
    const files = fs.readdirSync(imgStorePath);

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
        } catch (error) {
            console.error(`Failed to upload ${file}:`, error.message);
        }
    }
}

async function dataTransfer() {
    try {
        const jsonPath = path.join(process.cwd(), 'db.json')
        const readFile = await fs.readFile(jsonPath, 'utf8');
        const data = JSON.parse(readFile);

        console.log(data);

        const res = await axios.post(process.env.ENV_TARGET_PORT + '/dataTransfer', { data });
        console.log(res.data)

    } catch (error) {
        console.log('dataTransfer :', error);
    }
}

module.exports = {
    imageTransfer, dataTransfer
};