const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { fetch_face_data } = require("./dataService.js");
const faceApiService = require("./faceapiService.js");
const cron = require('node-cron');
const { knownDataTransfer, knownImageTransfer, unknownImageTransfer, unknownDataTransfer } = require("./dataTransfer.js");
const mysqlDB = require('./database/mysql.js');
const { saveExpressionData } = require("./writeKnownData.js");
const path = require('path');
const fs = require("fs")

require('dotenv').config();

const app = express();
const port = process.env.ENV_PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(fileUpload({
  createParentPath: true,
}));


app.post("/prediction", async (req, res) => {

  if (!req.files || !req.files.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.file;

  const result = await faceApiService.detect(file, file.name);

  res.json({ detectedFaces: result });
});

app.get("/fetch_face_data", async (req, res) => {
  try {
    const data = await fetch_face_data();
    res.json(data);
  } catch (error) {
    console.error('Error reading the database file:', error.message);
    res.status(500).send(error.message);
  }
});

// Serving known face images statically
app.use('/fetch_face_image', express.static('./imageFolder/knownImageStore'));

// Fetch expression data from MySQL
app.get('/fetch_expression', async (req, res) => {
  try {
    const results = await mysqlDB.query('SELECT * FROM expression');
    res.json(results);
  } catch (err) {
    console.error('Database query failed.', err);
    res.status(500).send('An error occurred');
  }
});

// Scheduled tasks for data transfer
cron.schedule('0 0 * * *', () => {
  console.log('Running a task every day at 12:00 AM');
  knownDataTransfer();
  knownImageTransfer();
  unknownDataTransfer();
  unknownImageTransfer();
  saveExpressionData();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json('Face API server started !!!');
});

// Start the server
app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});
