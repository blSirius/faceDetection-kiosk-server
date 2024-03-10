const { knownDataTransfer, knownImageTransfer, unknownImageTransfer, unknownDataTransfer } = require("./dataTransfer.js");
const { saveExpressionData } = require("./writeKnownData.js");
const cron = require('node-cron');

cron.schedule('0 0 * * *', () => {
    console.log('Running a task every day at 12:00 AM');
    knownDataTransfer();
    knownImageTransfer();
    unknownDataTransfer();
    unknownImageTransfer();
    saveExpressionData();
});