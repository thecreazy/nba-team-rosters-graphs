const redis = require("redis");

const client = redis.createClient({
    url: process.env.REDIS_CONNECTION
});

const enableClient = async () => {
    await client.connect();
    console.log("connection redis ok")
}

module.exports.enableClient = enableClient;
module.exports.client = client;
module.exports.GRAPH_NAME = "NBA_ROSTER"
