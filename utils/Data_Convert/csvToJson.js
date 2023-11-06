const fs = require("fs");
const csv = require("csvtojson");

class CSVToJson {
    constructor(csvFilePath, outputFilePath) {
        this.csvFilePath = csvFilePath;
        this.outputFilePath = outputFilePath;
    }

    csvToJson() {
        csv()
            .fromFile(this.csvFilePath)
            .then((data) => {
                fs.writeFileSync(`${this.outputFilePath}`, JSON.stringify(data));
            });
    }
}

module.exports = CSVToJson;
