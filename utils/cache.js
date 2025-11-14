const { redisClient } = require('../config/redisClient');

async function cache(key, fetchFunction, ttl = 300) {
  try {
    // 1. Check if data exists in Redis
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      console.log(`[CACHE HIT] Key: ${key}`); // ✅ Log when data comes from Redis
      return JSON.parse(cachedData); 
    }

    console.log(`[CACHE MISS] Key: ${key} - fetching from DB...`);

    // 2. If not cached, fetch from DB
    const data = await fetchFunction();

    // 3. Save the data in Redis
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    console.log(`[CACHE SET] Key: ${key} stored in Redis for ${ttl} seconds`); // ✅ Log caching

    return data;
  } catch (err) {
    console.error('Redis caching error:', err);
    // fallback to DB if Redis fails
    const data = await fetchFunction();
    console.log(`[CACHE FALLBACK] Key: ${key} fetched from DB due to Redis error`);
    return data;
  }
}

module.exports = cache;
