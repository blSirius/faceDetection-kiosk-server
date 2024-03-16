const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { fetch_face_data } = require("./dataService.js");
const mysqlDB = require('./database/mysql.js');
const faceApiService = require("./faceapiService.js");


require("./rutine.js");
require('dotenv').config();

const app = express();
const port = process.env.ENV_PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(fileUpload({ createParentPath: true }));

app.post("/prediction", async (req, res) => {

  if (!req.files || !req.files.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.file;
  const result = await faceApiService.detect(file);

  res.json(result);
});

app.post("/fetch_face_data", async (req, res) => {
  // console.log('hello server', req.body)
  const { newCard } = req.body;
  try {
    const data = await fetch_face_data(newCard);
    res.json(data);
  } catch (error) {
    console.error('Error reading the database file:', error.message);
    res.status(500).send(error.message);
  }
});

app.get('/fetch_expression', async (req, res) => {
  try {
    const results = await mysqlDB.query('SELECT * FROM expression');
    res.json(results);
  } catch (err) {
    console.error('Database query failed.', err);
    res.status(500).send('An error occurred');
  }
});

app.use('/fetch_face_image', express.static('./imageFolder/knownImgStore'));

app.get('/', (req, res) => {
  res.json('Face API server started !!!');
});

app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});