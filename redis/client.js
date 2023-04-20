require("dotenv").config({ path: "./config.env" });
const { createClient } = require("redis");
const { Client } = require("redis-om");

module.exports.redisClient = async () => {
    const redisClient = await new Client().open(process.env.REDIS_URL);
    return redisClient;
};

module.exports.redisNodeClient = async () => {
    const url = process.env.REDIS_URL;
    const connection = createClient(url);
    await connection.connect();

    return connection;
};
