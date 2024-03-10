const faceapi = require("@vladmandic/face-api/dist/face-api.node");
const tf = require("@tensorflow/tfjs-node");
const canvas = require("canvas");
const writeKnownData = require('./writeKnownData');
const fs = require('fs').promises;
const editUnknownData = require("./editUnknownData");

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

async function detect(envImg, envFile) {

  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);

  try {
    const detections = await faceapi.detectAllFaces(envImg)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors();

    const allExtractFaces = await faceapi.extractFaces(envImg, detections.map(det => det.detection));

    if (detections.length >= 1) {
      let knownData = [];
      let unknownData = [];
      let knowIndex = [];
      let unknowIndex = [];
      detections.map((detection, index) => {
        const faceMatch = faceMatcher.findBestMatch(detection.descriptor);
        if (faceMatch.label != 'unknown') {
          knownData.push({ detection, faceMatch });
          knowIndex.push(index);
        }
        else {
          unknownData.push(detection);
          unknowIndex.push(index)
        }
      });

      if (knownData.length > 0) {
        const extractFacesKnown = knowIndex.map(index => allExtractFaces[index]);
        writeKnownData.saveImageAndFaceData(knownData, extractFacesKnown, envFile);
      }

      if (unknownData.length > 0) {
        const extractFacesUnknown = unknowIndex.map(index => allExtractFaces[index]);
        editUnknownData.editUnknownData(unknownData, extractFacesUnknown,  envFile);
      }

      return knownData;
    }
  }
  catch (error) {
    console.log(error);
    return [];
  }
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
  console.log('Models loaded');

  modelsLoaded = true;
};

async function main(file) {

  await tf.setBackend("tensorflow");
  tf.enableProdMode();
  tf.ENV.set("DEBUG", false);
  await tf.ready();

  await loadModels();

  const tensor = await prepareImage(file.data);
  const result = await detect(tensor, file);

  tensor.dispose();

  return result;
};

module.exports = {
  detect: main,
};