const faceapi = require("@vladmandic/face-api/dist/face-api.node");
const canvas = require("canvas");
const NodeCache = require("node-cache");
const writeUnknownData = require("./writeUnknownData");

const { Canvas, Image } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData: canvas.ImageData });

const unknownCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
let modelsLoaded = false;
let descriptions = [];

async function loadModels() {
  if (!modelsLoaded) {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk('./models'),
      faceapi.nets.faceLandmark68Net.loadFromDisk('./models'),
      faceapi.nets.faceRecognitionNet.loadFromDisk('./models'),
      faceapi.nets.faceExpressionNet.loadFromDisk('./models'),
      faceapi.nets.ageGenderNet.loadFromDisk('./models')
    ]);
    console.log('Models loaded');
    modelsLoaded = true;
  }
}

const editUnknownData = async (unknownData, extractFacesUnknown, envImgPath, envFile) => {
  if (!modelsLoaded) await loadModels();

  const labels = unknownCache.keys();

  if (labels.length === 0) {
    unknownData.forEach(async (data, i) => {
      const label = Date.now().toString() + i.toString();
      const newDescriptions = new Float32Array(data.descriptor);
      unknownCache.set(label, true);
      descriptions.push({ label, descriptions: newDescriptions });
      await writeUnknownData.saveUnknownImageAndFaceData(data, extractFacesUnknown[i], envImgPath, envFile);
    });
    return;
  }

  try {
    const labeledFaceDescriptors = await Promise.all(labels.map(label =>
      new faceapi.LabeledFaceDescriptors(label, [descriptions.find(d => d.label === label).descriptions])
    ));
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);

    unknownData.forEach(async (data, i) => {
      const faceMatch = faceMatcher.findBestMatch(data.descriptor);
      if (faceMatch.label === 'unknown') {
        const label = Date.now().toString() + i.toString();
        const newDescriptions = new Float32Array(data.descriptor);
        unknownCache.set(label, newDescriptions);
        descriptions.push({ label, descriptions: newDescriptions });
        await writeUnknownData.saveUnknownImageAndFaceData(data, extractFacesUnknown[i]);
      } else {
        unknownCache.ttl(faceMatch.label, 120);
      }
      console.log(faceMatch);
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { editUnknownData };