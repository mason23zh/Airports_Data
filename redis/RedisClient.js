require("dotenv").config({ path: "./config.env" });
const { createClient } = require("redis");
const { Client } = require("redis-om");

class RedisClient {
    constructor() {
        this.repo = null;
        this.client = null;
    }

    async openNewRedisOMClient(REDIS_URL) {
        try {
            this.client = await new Client().open(REDIS_URL);
        } catch (e) {
            this.client = null;
            return;
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
            // throw new Error("Client initialization required");
            return null;
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
        try {
            await connection.connect();
            return connection;
        } catch (e) {
            return null;
        }
    }

    async createRedisNodeConnectionWithURL(REDIS_URL) {
        try {
            const connection = createClient(REDIS_URL);
            await connection.connect();
            return connection;
        } catch (e) {
            return null;
        }
    }
}

module.exports = RedisClient;
