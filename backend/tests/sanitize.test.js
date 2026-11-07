import { describe, it, expect } from 'vitest';
import { sanitize, sanitizeMiddleware } from '../src/middleware/sanitize.js';

describe('Sanitizer Hardening Suite (NoSQL & Prototype Pollution)', () => {
  it('strips keys starting with "$" and keys containing "."', () => {
    const payload = {
      $where: 'sleep(1000)',
      $gt: 50,
      'nested.field': 'malicious',
      normalField: 'safeValue',
      validNumber: 42,
    };

    sanitize(payload);

    expect(payload).toEqual({
      normalField: 'safeValue',
      validNumber: 42,
    });
    expect(payload.$where).toBeUndefined();
    expect(payload.$gt).toBeUndefined();
    expect(payload['nested.field']).toBeUndefined();
  });

  it('strips __proto__, constructor, and prototype pollution keys', () => {
    const payload = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"polluted":true},"prototype":{"polluted":true},"title":"Good"}'
    );

    sanitize(payload);

    expect(payload.title).toBe('Good');
    expect(Object.prototype.polluted).toBeUndefined();
    expect(payload.__proto__).toBe(Object.prototype); // Unpolluted default
    expect(payload.prototype).toBeUndefined();
  });

  it('handles arrays and deeply nested arrays of objects', () => {
    const payload = {
      queryList: [
        { $regex: '.*admin.*', validKey: 'item1' },
        { constructor: 'evil', name: 'item2' },
        [
          { 'nested.dot': 'value', safe: true },
          { $ne: null, subArray: [{ $exists: true, clean: 'yes' }] },
        ],
      ],
      primitives: [1, 2, 'three', false, null],
    };

    sanitize(payload);

    expect(payload.queryList[0]).toEqual({ validKey: 'item1' });
    expect(payload.queryList[1]).toEqual({ name: 'item2' });
    expect(payload.queryList[2][0]).toEqual({ safe: true });
    expect(payload.queryList[2][1]).toEqual({ subArray: [{ clean: 'yes' }] });
    expect(payload.primitives).toEqual([1, 2, 'three', false, null]);
  });

  it('sanitizeMiddleware cleans req.body, req.query, and req.params', () => {
    const req = {
      body: { $in: [1, 2], name: 'student' },
      query: { 'search.type': 'advanced', term: 'placement' },
      params: { id: '123', $paramKey: 'bad' },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    sanitizeMiddleware(req, {}, next);

    expect(nextCalled).toBe(true);
    expect(req.body).toEqual({ name: 'student' });
    expect(req.query).toEqual({ term: 'placement' });
    expect(req.params).toEqual({ id: '123' });
  });

  it('returns primitives and null/undefined without error', () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
    expect(sanitize('string')).toBe('string');
    expect(sanitize(123)).toBe(123);
  });
});
