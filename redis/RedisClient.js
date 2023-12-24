require("dotenv").config({ path: "./config.env" });
const logger = require("../logger/index");
const { createClient } = require("redis");
const { Repository } = require("redis-om");

class RedisClient {
    constructor() {
        this.repo = null;
        this.nodeClient = null;
    }

    getCurrentClient() {
        return this.nodeClient;
    }

    async flushDb() {
        if (this.nodeClient) {
            try {
                await this.nodeClient.flushDb("SYNC");
                logger.info("REDIS FLUSHED");
            } catch (e) {
                logger.error("Error flush Redis:%O", e);
            }
        }
    }

    createRedisRepository(schema) {
        if (this.nodeClient) {
            this.repo = new Repository(schema, this.nodeClient);
            return this.repo;
        } else {
            logger.error("node client not existed, create new Repository failed");
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
            logger.error("Error closing Redis connection:%O", e);
        }
    }

    async createRedisNodeConnection(REDIS_URL) {
        this.nodeClient = createClient({ url: REDIS_URL });

        try {
            await this.nodeClient.connect();
            return this.nodeClient;
        } catch (e) {
            logger.error("Error connecting redis node client:%O", e);
            this.nodeClient = null;
            return this.nodeClient;
        }
    }
}

module.exports = RedisClient;
