// config/redisClient.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

function connectRedis() {
  return redisClient.connect();
}

module.exports = { redisClient, connectRedis };
