require("dotenv").config({ path: "./config.env" });
const { createClient } = require("redis");
const { Client, Repository } = require("redis-om");

class RedisClient {
    constructor() {
        this.repo = null;
        this.client = null;
        this.nodeClient = null;
    }

    async openNewRedisOMClient(REDIS_URL) {
        try {
            this.client = await new Client().open(REDIS_URL);
            return this.client;
        } catch (e) {
            console.log("error connecting to redis:", e);
            this.client = null;
            return;
        }
    }

    getCurrentClient() {
        return this.client;
    }

    createRedisOMRepository(schema) {
        if (this.client !== null) {
            this.repo = this.client.fetchRepository(schema);
            return this.repo;
        } else {
            return null;
        }
    }

    createRedisRepository(schema) {
        if (this.nodeClient) {
            this.repo = new Repository(schema, this.nodeClient);
            return this.repo;
        } else {
            console.error("node client not existed, create new Repository failed");
            this.repo = null;
            return this.repo;
        }
    }

    async closeConnection() {
        try {
            if (this.nodeClient) {
                await this.nodeClient.quit();
            }
        } catch (e) {
            console.error("Error closing Redis connection:", e);
        }
    }

    async createRedisNodeConnection(REDIS_PASSWORD, REDIS_HOST, REDIS_PORT) {
        this.nodeClient = createClient({
            password: REDIS_PASSWORD,
            socket: {
                host: REDIS_HOST,
                port: REDIS_PORT
            }
        });
        try {
            await this.nodeClient.connect();
            return this.nodeClient;
        } catch (e) {
            console.error("Error connecting redis node client:", e);
            this.nodeClient = null;
            return this.nodeClient;
        }
    }
}

module.exports = RedisClient;
