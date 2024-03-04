const faceapi = require("@vladmandic/face-api/dist/face-api.node");
const tf = require("@tensorflow/tfjs-node");
const canvas = require("canvas");
const fs = require('fs').promises;
const db = require('./db.js');
const { log } = require("console");

const { Canvas, Image, loadImage } = canvas;
global.ImageData = canvas.ImageData;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData: global.ImageData });

let modelsLoaded = false;

async function prepareImage(file) {
  const decoded = tf.node.decodeImage(file);
  const casted = decoded.toFloat();
  const result = casted.expandDims(0);
  decoded.dispose();
  casted.dispose();
  return result;
};

async function detect(img) {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  try {
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors();

    if (detections.length >= 1) {
      const results = detections.map(detection => {
        const faceMatch = faceMatcher.findBestMatch(detection.descriptor);
        return { detection, faceMatch };
      });

      const extractFaces = await faceapi.extractFaces(img, detections.map(det => det.detection));

      db.save(results, extractFaces);

      return results;
    }
  }
  catch (error) {
    console.log('No found face');
    return [];
  }
};

async function main(file) {
  await tf.setBackend("tensorflow");
  tf.enableProdMode();
  tf.ENV.set("DEBUG", false);
  await tf.ready();

  await loadModels();

  const tensor = await prepareImage(file.data);
  const result = await detect(tensor);

  tensor.dispose();

  return result;
};

async function getLabeledFaceDescriptions() {
  const labels = await fs.readdir('./labels', { withFileTypes: true })
    .then(dirents => dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name));
  return Promise.all(labels.map(async label => {
    const descriptions = [];
    for (let i = 1; i <= 1; i++) {
      const imgPath = `./labels/${label}/${i}.jpg`;
      const img = await loadImage(imgPath);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detections) {
        descriptions.push(detections.descriptor);
      }
    }
    return new faceapi.LabeledFaceDescriptors(label, descriptions);
  }));
};

async function loadModels() {
  if (modelsLoaded) return;

  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
  await faceapi.nets.faceExpressionNet.loadFromDisk('./models');
  await faceapi.nets.ageGenderNet.loadFromDisk('./models');
  log('Models loaded');

  modelsLoaded = true;
};

module.exports = {
  detect: main,
};