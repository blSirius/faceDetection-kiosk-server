const { knownDataTransfer, knownImageTransfer, unknownImageTransfer, unknownDataTransfer, envImageTransfer } = require("./dataTransfer.js");
const { saveExpressionData } = require("./writeKnownData.js");
const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {

    try {
        console.log('Running a task every day at 12:00 AM');
        await knownDataTransfer();
        await knownImageTransfer();
        await unknownDataTransfer();
        await unknownImageTransfer();
        await saveExpressionData();
        await envImageTransfer();
    }
    catch (error) {
        console.log(error)
    }
});