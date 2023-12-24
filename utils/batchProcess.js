/* eslint-disable prettier/prettier */
const logger = require("../logger");
module.exports.batchProcess = async (promiseArray, batchSize) => {
    const results = []; // Array to hold the results
    const errors = []; // Array to collect errors

    for (let i = 0; i < promiseArray.length; i += batchSize) {
        const batch = promiseArray.slice(i, i + batchSize);
        const promises = batch.map(
            (promise) =>
                promise && promise.then && promise.catch
                    ? promise.catch((error) => {
                        errors.push(error); // Catch and store the error
                        return null;
                    })
                    : Promise.resolve(promise) // If not a promise, resolve it as is
        );

        const batchResults = await Promise.all(promises);
        results.push(...batchResults); // Collect results
    }

    if (errors.length) {
        logger.error("Errors encountered:%O", errors);
        // Handle errors here, such as logging them or taking corrective action
    }

    return results; // Return the results, including any nulls for failed promises
};

