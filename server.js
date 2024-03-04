const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const faceApiService = require("./faceapiService.js");
require('dotenv').config()

const app = express();
const port = process.env.ENV_PORT;

app.use(express.json());
app.use(cors());
app.use(fileUpload());

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


app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});