require("dotenv").config({ path: "./config.env" });
const { createClient } = require("redis");
const { Client } = require("redis-om");
const CustomError = require("../common/errors/custom-error");

class RedisClient {
    constructor() {
        this.repo = null;
        this.client = null;
    }

    async openNewRedisOMClient(REDIS_URL) {
        try {
            this.client = await new Client().open(REDIS_URL);
        } catch (e) {
            throw new CustomError(e.message, 500);
        }
        return this.client;
    }

    getCurrentClient() {
        return this.client;
    }

    createRedisOMRepository(schema) {
        if (this.client !== null) {
            return (this.repo = this.client.fetchRepository(schema));
        } else {
            throw new Error("Client initialization required");
        }
    }

    async createRedisNodeConnection(REDIS_PASSWORD, REDIS_HOST, REDIS_PORT) {
        const connection = createClient({
            password: REDIS_PASSWORD,
            socket: {
                host: REDIS_HOST,
                port: REDIS_PORT,
            },
        });
        await connection.connect();
        return connection;
    }

    async createRedisNodeConnectionWithURL(REDIS_URL) {
        const connection = createClient(REDIS_URL);
        await connection.connect();
        return connection;
    }
}

module.exports = RedisClient;
