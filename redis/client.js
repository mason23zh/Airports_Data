require("dotenv").config({ path: "./config.env" });
const { createClient } = require("redis");
const { Client } = require("redis-om");

module.exports.redisClient = () => {
    // const redisClient = await new Client().open(process.env.REDISCLOUD_URL);
    //const redisClient = await new Client().open(process.env.REDIS_URL);
    const client = new Client();
    return client;
};

module.exports.redisNodeClient = async () => {
    // const url = process.env.REDISCLOUD_URL;
    // const connection = createClient({
    //     password: process.env.REDISCLOUD_PASSWORD,
    //     socket: {
    //         host: process.env.REDISCLOUD_HOST,
    //         port: process.env.REDISCLOUD_PORT,
    //     },
    // });
    const connection = createClient(process.env.REDIS_URL);
    await connection.connect();

    return connection;
};
