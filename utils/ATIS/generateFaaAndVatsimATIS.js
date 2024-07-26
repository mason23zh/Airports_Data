// const { generateFAAResponseATIS } = require("./generateFAAResponseATIS");
const VatsimData = require("../Vatsim_data/VatsimData");
const { getFaaAtis } = require("./getFaaAtis");

module.exports.generateGeneralATIS = async (icao) => {
    const vatsimData = new VatsimData(icao);
    await vatsimData.requestVatsimData();

    const faaATIS = await getFaaAtis(icao.toUpperCase());
    const vatsimATIS = vatsimData.getATIS(icao.toUpperCase());

    const ATIS = {
        faa: faaATIS.data,
        vatsim: vatsimATIS.data
    };

    return ATIS;
};
