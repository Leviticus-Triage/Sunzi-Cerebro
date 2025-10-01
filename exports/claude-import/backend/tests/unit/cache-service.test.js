/**
 * Unit Tests for Cache Service
 * Tests Redis caching functionality with comprehensive scenarios
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import cacheService, { cacheHelpers } from '../../services/cache-service.js';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  mGet: jest.fn(),
  multi: jest.fn(),
  keys: jest.fn(),
  incr: jest.fn(),
  incrBy: jest.fn(),
  decr: jest.fn(),
  decrBy: jest.fn(),
  info: jest.fn(),
  quit: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  isOpen: true
};

// Mock Redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.isConnected = true;
    cacheService.client = mockRedisClient;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    test('should initialize Redis connection successfully', async () => {
      mockRedisClient.connect.mockResolvedValue();

      const result = await cacheService.initialize();

      expect(result).toBe(true);
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    test('should handle Redis connection failure', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheService.initialize();

      expect(result).toBe(false);
      expect(cacheService.isConnected).toBe(false);
    });

    test('should set up event handlers', async () => {
      mockRedisClient.connect.mockResolvedValue();

      await cacheService.initialize();

      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('end', expect.any(Function));
    });
  });

  describe('isAvailable', () => {
    test('should return true when connected and client is open', () => {
      cacheService.isConnected = true;
      cacheService.client = { isOpen: true };

      expect(cacheService.isAvailable()).toBe(true);
    });

    test('should return false when not connected', () => {
      cacheService.isConnected = false;
      cacheService.client = { isOpen: true };

      expect(cacheService.isAvailable()).toBe(false);
    });

    test('should return false when client is not open', () => {
      cacheService.isConnected = true;
      cacheService.client = { isOpen: false };

      expect(cacheService.isAvailable()).toBe(false);
    });
  });

  describe('get', () => {
    test('should retrieve and parse JSON value from cache', async () => {
      const testData = { message: 'test data' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('sunzi:cerebro:default:test-key');
    });

    test('should return string value as-is when not valid JSON', async () => {
      mockRedisClient.get.mockResolvedValue('plain string');

      const result = await cacheService.get('test-key');

      expect(result).toBe('plain string');
    });

    test('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('nonexistent-key');

      expect(result).toBeNull();
    });

    test('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    test('should return null when cache is not available', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    test('should use custom namespace', async () => {
      mockRedisClient.get.mockResolvedValue('test value');

      await cacheService.get('test-key', 'custom');

      expect(mockRedisClient.get).toHaveBeenCalledWith('sunzi:cerebro:custom:test-key');
    });
  });

  describe('set', () => {
    test('should store JSON data in cache with TTL', async () => {
      const testData = { message: 'test data' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testData, 3600);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'sunzi:cerebro:default:test-key',
        3600,
        JSON.stringify(testData)
      );
    });

    test('should store string data directly', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', 'string value', 1800);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'sunzi:cerebro:default:test-key',
        1800,
        'string value'
      );
    });

    test('should use default TTL when not specified', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      await cacheService.set('test-key', 'test value');

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'sunzi:cerebro:default:test-key',
        cacheService.ttlConfig.default,
        'test value'
      );
    });

    test('should handle Redis errors gracefully', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.set('test-key', 'test value');

      expect(result).toBe(false);
    });

    test('should return false when cache is not available', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.set('test-key', 'test value');

      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    test('should delete existing key', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheService.del('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('sunzi:cerebro:default:test-key');
    });

    test('should return false when key does not exist', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await cacheService.del('nonexistent-key');

      expect(result).toBe(false);
    });

    test('should handle Redis errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.del('test-key');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    test('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(true);
    });

    test('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheService.exists('nonexistent-key');

      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    test('should set expiration for existing key', async () => {
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await cacheService.expire('test-key', 3600);

      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('sunzi:cerebro:default:test-key', 3600);
    });

    test('should return false for non-existing key', async () => {
      mockRedisClient.expire.mockResolvedValue(0);

      const result = await cacheService.expire('nonexistent-key', 3600);

      expect(result).toBe(false);
    });
  });

  describe('mget', () => {
    test('should retrieve multiple values', async () => {
      const testData1 = { id: 1 };
      const testData2 = { id: 2 };
      mockRedisClient.mGet.mockResolvedValue([
        JSON.stringify(testData1),
        JSON.stringify(testData2),
        null
      ]);

      const result = await cacheService.mget(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        key1: testData1,
        key2: testData2
      });
    });

    test('should return empty object when no keys provided', async () => {
      const result = await cacheService.mget([]);

      expect(result).toEqual({});
      expect(mockRedisClient.mGet).not.toHaveBeenCalled();
    });
  });

  describe('mset', () => {
    const mockPipeline = {
      setEx: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([])
    };

    beforeEach(() => {
      mockRedisClient.multi.mockReturnValue(mockPipeline);
    });

    test('should set multiple values', async () => {
      const keyValuePairs = {
        key1: { id: 1 },
        key2: { id: 2 }
      };

      const result = await cacheService.mset(keyValuePairs, 1800);

      expect(result).toBe(true);
      expect(mockPipeline.setEx).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    test('should return false when no pairs provided', async () => {
      const result = await cacheService.mset({});

      expect(result).toBe(false);
      expect(mockRedisClient.multi).not.toHaveBeenCalled();
    });
  });

  describe('deletePattern', () => {
    test('should delete keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await cacheService.deletePattern('user:*');

      expect(result).toBe(3);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('sunzi:cerebro:default:user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    test('should return 0 when no keys match pattern', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await cacheService.deletePattern('nonexistent:*');

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('incr/decr operations', () => {
    test('should increment value by 1', async () => {
      mockRedisClient.incr.mockResolvedValue(5);

      const result = await cacheService.incr('counter');

      expect(result).toBe(5);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('sunzi:cerebro:default:counter');
    });

    test('should increment value by custom amount', async () => {
      mockRedisClient.incrBy.mockResolvedValue(15);

      const result = await cacheService.incr('counter', 10);

      expect(result).toBe(15);
      expect(mockRedisClient.incrBy).toHaveBeenCalledWith('sunzi:cerebro:default:counter', 10);
    });

    test('should decrement value by 1', async () => {
      mockRedisClient.decr.mockResolvedValue(3);

      const result = await cacheService.decr('counter');

      expect(result).toBe(3);
      expect(mockRedisClient.decr).toHaveBeenCalledWith('sunzi:cerebro:default:counter');
    });

    test('should decrement value by custom amount', async () => {
      mockRedisClient.decrBy.mockResolvedValue(5);

      const result = await cacheService.decr('counter', 5);

      expect(result).toBe(5);
      expect(mockRedisClient.decrBy).toHaveBeenCalledWith('sunzi:cerebro:default:counter', 5);
    });
  });

  describe('statistics', () => {
    test('should return cache statistics', () => {
      cacheService.stats = {
        hits: 100,
        misses: 20,
        sets: 80,
        deletes: 10,
        errors: 2
      };

      const stats = cacheService.getStats();

      expect(stats.hits).toBe(100);
      expect(stats.misses).toBe(20);
      expect(stats.hitRate).toBeCloseTo(0.833, 3);
      expect(stats.isConnected).toBe(true);
    });

    test('should handle zero operations gracefully', () => {
      cacheService.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      };

      const stats = cacheService.getStats();

      expect(stats.hitRate).toBe(0);
    });
  });

  describe('clearNamespace', () => {
    test('should clear all keys in namespace', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await cacheService.clearNamespace('test');

      expect(result).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('sunzi:cerebro:test:*');
    });
  });

  describe('getInfo', () => {
    test('should return Redis info', async () => {
      const mockInfo = 'redis_version:6.2.0\nused_memory:1024';
      mockRedisClient.info.mockResolvedValue(mockInfo);

      const result = await cacheService.getInfo();

      expect(result).toBe(mockInfo);
    });

    test('should return null on error', async () => {
      mockRedisClient.info.mockRejectedValue(new Error('Info error'));

      const result = await cacheService.getInfo();

      expect(result).toBeNull();
    });
  });

  describe('shutdown', () => {
    test('should gracefully quit Redis connection', async () => {
      mockRedisClient.quit.mockResolvedValue();

      await cacheService.shutdown();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    test('should disconnect on quit failure', async () => {
      mockRedisClient.quit.mockRejectedValue(new Error('Quit failed'));
      mockRedisClient.disconnect.mockResolvedValue();

      await cacheService.shutdown();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });
});

describe('CacheHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.isConnected = true;
    cacheService.client = mockRedisClient;
  });

  describe('getOrSet', () => {
    test('should return cached value when available', async () => {
      const cachedValue = { data: 'cached' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedValue));

      const fetchFn = jest.fn();
      const result = await cacheHelpers.getOrSet('test-key', fetchFn);

      expect(result).toEqual(cachedValue);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    test('should fetch and cache value when not cached', async () => {
      const fetchedValue = { data: 'fetched' };
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const fetchFn = jest.fn().mockResolvedValue(fetchedValue);
      const result = await cacheHelpers.getOrSet('test-key', fetchFn, 3600);

      expect(result).toEqual(fetchedValue);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'sunzi:cerebro:default:test-key',
        3600,
        JSON.stringify(fetchedValue)
      );
    });

    test('should not cache null or undefined values', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const fetchFn = jest.fn().mockResolvedValue(null);
      const result = await cacheHelpers.getOrSet('test-key', fetchFn);

      expect(result).toBeNull();
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
    });

    test('should propagate fetch function errors', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const fetchError = new Error('Fetch failed');
      const fetchFn = jest.fn().mockRejectedValue(fetchError);

      await expect(cacheHelpers.getOrSet('test-key', fetchFn)).rejects.toThrow('Fetch failed');
    });
  });

  describe('invalidateWithDeps', () => {
    test('should invalidate key and dependencies', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await cacheHelpers.invalidateWithDeps('main-key', ['dep1', 'dep2']);

      expect(mockRedisClient.del).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.del).toHaveBeenCalledWith('sunzi:cerebro:default:main-key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('sunzi:cerebro:default:dep1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('sunzi:cerebro:default:dep2');
    });
  });

  describe('warmCache', () => {
    test('should fetch and cache value', async () => {
      const warmValue = { data: 'warm' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const fetchFn = jest.fn().mockResolvedValue(warmValue);
      const result = await cacheHelpers.warmCache('warm-key', fetchFn, 1800);

      expect(result).toEqual(warmValue);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'sunzi:cerebro:default:warm-key',
        1800,
        JSON.stringify(warmValue)
      );
    });

    test('should propagate warm function errors', async () => {
      const warmError = new Error('Warm failed');
      const fetchFn = jest.fn().mockRejectedValue(warmError);

      await expect(cacheHelpers.warmCache('warm-key', fetchFn, 1800)).rejects.toThrow('Warm failed');
    });
  });
});