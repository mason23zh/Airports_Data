require("dotenv").config({ path: "./config.env" });
const { createClient } = require("redis");
const { Client } = require("redis-om");

module.exports.redisClient = async () => {
    const redisClient = await new Client().open(process.env.REDISCLOUD_URL);
    return redisClient;
};

module.exports.redisNodeClient = async () => {
    // const url = process.env.REDISCLOUD_URL;
    const connection = createClient({
        password: process.env.REDISCLOUD_PASSWORD,
        socket: {
            host: process.env.REDISCLOUD_HOST,
            port: process.env.REDISCLOUD_PORT,
        },
    });
    await connection.connect();

    return connection;
};
