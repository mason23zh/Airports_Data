require("dotenv").config({ path: "./config.env" });
const { createClient } = require("redis");
const { Client } = require("redis-om");

class RedisClient {
    constructor() {
        this.repo = null;
        this.client = null;
    }

    async openNewRedisOMClient(REDIS_URL) {
        this.client = await new Client().open(REDIS_URL);
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

    async createRedisNodeConnection(REDIS_URL, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT) {
        const connection = await createClient({
            password: REDIS_PASSWORD,
            socket: {
                host: REDIS_HOST,
                port: REDIS_PORT,
            },
        }).connect();
        return connection;
    }

    async createRedisNodeConnectionWithURL(REDIS_URL) {
        // const connection = await createClient(REDIS_URL).connect();
        const connection = createClient(REDIS_URL);
        await connection.connect();
        return connection;
    }

    getNewClient() {
        this.client = new Client();
        return this.client;
    }
}

module.exports = RedisClient;
