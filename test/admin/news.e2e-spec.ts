import { describe, expect, it, beforeAll } from '@jest/globals';
import request from 'supertest';
import {
  APP_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  TESTER_EMAIL,
  TESTER_PASSWORD,
} from '../utils/constants';

describe('News Module', () => {
  const app = APP_URL;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .then(({ body }) => {
        adminToken = body.data.token;
      });

    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: TESTER_EMAIL, password: TESTER_PASSWORD })
      .then(({ body }) => {
        userToken = body.data.token;
      });
  });

  describe('List', () => {
    it('should get news list without auth: /api/v1/news (GET)', () => {
      return request(app)
        .get('/api/v1/news')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect(({ body }) => {
          expect(body.code).toBe(200);
          expect(body.data.data).toBeInstanceOf(Array);
          expect(typeof body.data.hasNextPage).toBe('boolean');
          expect(typeof body.data.total).toBe('number');
        });
    });

    it('should filter by category: /api/v1/news (GET)', async () => {
      const { body: categoriesBody } = await request(app)
        .get('/api/v1/news/categories')
        .expect(200);

      const categories = categoriesBody.data as Array<{ name: string }>;
      if (!categories.length) {
        return;
      }

      const category = categories[0].name;
      const { body } = await request(app)
        .get('/api/v1/news')
        .query({ category, limit: 10 })
        .expect(200);

      for (const article of body.data.data) {
        expect(article.category).toBe(category);
        expect(article.coverColor).toBeUndefined();
      }
    });
  });

  describe('Categories', () => {
    it('should get category list without auth: /api/v1/news/categories (GET)', () => {
      return request(app)
        .get('/api/v1/news/categories')
        .expect(200)
        .expect(({ body }) => {
          expect(body.code).toBe(200);
          expect(body.data).toBeInstanceOf(Array);
          if (body.data.length) {
            expect(body.data[0]).toEqual(
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                sortOrder: expect.any(Number),
              }),
            );
          }
        });
    });
  });

  describe('Fetch', () => {
    it('should fail without auth: /api/v1/news/fetch (POST)', () => {
      return request(app).post('/api/v1/news/fetch').expect(401);
    });

    it('should fail for non-admin user: /api/v1/news/fetch (POST)', () => {
      return request(app)
        .post('/api/v1/news/fetch')
        .auth(userToken, { type: 'bearer' })
        .expect(403);
    });

    it('should allow admin to trigger fetch: /api/v1/news/fetch (POST)', () => {
      return request(app)
        .post('/api/v1/news/fetch')
        .auth(adminToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.code).toBe(200);
          expect(body.data).toBeInstanceOf(Array);
          expect(body.data.length).toBeGreaterThan(0);
          expect(body.data[0]).toEqual(
            expect.objectContaining({
              source: expect.any(String),
              added: expect.any(Number),
              skipped: expect.any(Number),
            }),
          );
        });
    }, 60000);
  });
});
