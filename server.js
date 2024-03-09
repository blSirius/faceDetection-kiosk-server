const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const { fetch_face_data } = require("./dataService.js")
const faceApiService = require("./faceapiService.js");
const cron = require('node-cron');
const { imageTransfer, dataTransfer, unknownImageTransfer, unknownDataTransfer } = require("./dataTransfer.js");
const mysqlDB = require('./mysql.js');
const { saveExpressionData } = require("./writeJson.js")

require('dotenv').config()

const app = express();
const port = process.env.ENV_PORT;

app.use(express.json());
app.use(cors());
app.use(fileUpload());

//model
app.post("/prediction", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.file;
  const result = await faceApiService.detect(file);

  res.json({
    detectedFaces: result,
  });
});

app.get("/fetch_face_data", async (req, res) => {
  try {
    const data = await fetch_face_data();
    res.json(data)
  } catch (error) {
    console.error('Error reading the database file:');
    res.json(error.message)
  }
});

//imgStore
app.use('/fetch_face_image', express.static('./imgStore'));

//mysql
app.get('/fetch_expression', async (req, res) => {
  try {
    const results = await mysqlDB.query('SELECT * FROM expression ');
    res.json(results);
  } catch (err) {
    console.error('Database query failed.', err);
    res.status(500).send('An error occurred');
  }
});

//auto transfer data every 12.00 am.
cron.schedule('0 0 * * *', () => {
  console.log('Running a task every day at 12:00 AM');
  imageTransfer();
  dataTransfer();
  unknownDataTransfer();
  unknownImageTransfer();
  saveExpressionData();
});

app.get('/', async (req, res) => {
  res.json('face api server started !!!')
});

app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});