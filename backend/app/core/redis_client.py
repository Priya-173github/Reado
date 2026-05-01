import redis
from app.core.config import settings

# Create a Redis connection pool
redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis_client() -> redis.Redis:
    """Returns a new Redis client instance from the connection pool."""
    return redis.Redis(connection_pool=redis_pool)
