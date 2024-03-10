const faceapi = require("@vladmandic/face-api/dist/face-api.node");
const writeUnknownData = require("./writeUnknownData");
const NodeCache = require("node-cache");
const canvas = require("canvas");

const { Canvas, Image } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData: canvas.ImageData });

const unknownCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
let descriptions = [];

const editUnknownData = async (unknownData, extractFacesUnknown, envImgPath, envFile) => {

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

        console.log('Create new unknown user id', label);
      } else {
        unknownCache.ttl(faceMatch.label, 120);

        console.log('The unknown user matching with id', faceMatch.label);
      }

    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { editUnknownData };