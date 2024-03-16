const fs = require('fs').promises;
const { createCanvas, loadImage } = require('canvas');

const imagePath = "C:\\Users\\ACER\\Desktop\\version 8\\server\\labels\\กกก\\1.jpg";

async function loadImageWithCanvas() {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const img = await loadImage(imageBuffer);
    console.log('Image loaded into canvas successfully.');

    // Example usage with canvas
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Further processing...
  } catch (error) {
    console.error('Error loading image into canvas:', error);
  }
}

loadImageWithCanvas();
