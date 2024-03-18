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

app.delete('/deleteLabelImage', (req, res) => {
  const { labelName, imageName } = req.body;
  const folderName = 'labels/' + labelName;
  const imagePath = path.join(process.cwd(), folderName, imageName);

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error('Error deleting image:', err);
      return res.status(500).send('Error deleting image');
    }

    fs.readdir(path.join(process.cwd(), folderName), (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return res.status(500).send('Error deleting image');
      }

      if (files.length === 0) {
        fs.rmdir(path.join(process.cwd(), folderName), (err) => {
          if (err) {
            console.error('Error deleting folder:', err);
            return res.status(500).send('Error deleting image');
          }
          console.log('Folder deleted successfully');
          res.send('Image and folder deleted successfully');
        });
      } else {
        console.log('Image deleted successfully');
        res.send('Image deleted successfully');
      }
    });
  });
});

app.post('/addLabelImage', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  const uploadedImage = req.files.image;
  const labelName = req.body.labelName;
  const uploadPath = path.join(process.cwd(), 'labels', labelName, uploadedImage.name);

  const directoryPath = path.join(process.cwd(), 'labels', labelName);
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  uploadedImage.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    res.send('File uploaded successfully.');
  });
});

app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});