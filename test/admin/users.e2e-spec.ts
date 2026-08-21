import { describe, expect, it, beforeAll } from '@jest/globals';
import { APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/constants';
import request from 'supertest';
import { RoleEnum } from '../../src/roles/roles.enum';
import { StatusEnum } from '../../src/statuses/statuses.enum';

describe('Users Module', () => {
  const app = APP_URL;
  let apiToken: string;

  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .then(({ body }) => {
        apiToken = body.data.token;
      });
  });

  describe('Update', () => {
    let newUser: { id: number };
    const newUserEmail = `user-first.${Date.now()}@example.com`;
    const newUserChangedEmail = `user-first-changed.${Date.now()}@example.com`;
    const newUserPassword = `secret`;
    const newUserChangedPassword = `new-secret`;

    beforeAll(async () => {
      await request(app)
        .post('/api/v1/auth/email/register')
        .send({
          email: newUserEmail,
          password: newUserPassword,
          nickname: `userfirst${Date.now()}`,
        });

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .then(({ body }) => {
          newUser = body.data.user;
        });
    });

    describe('User with "Admin" role', () => {
      it('should change password for existing user: /api/v1/users/:id (PATCH)', () => {
        return request(app)
          .patch(`/api/v1/users/${newUser.id}`)
          .auth(apiToken, {
            type: 'bearer',
          })
          .send({
            email: newUserChangedEmail,
            password: newUserChangedPassword,
          })
          .expect(200);
      });

      describe('Guest', () => {
        it('should login with changed password: /api/v1/auth/email/login (POST)', () => {
          return request(app)
            .post('/api/v1/auth/email/login')
            .send({
              email: newUserChangedEmail,
              password: newUserChangedPassword,
            })
            .expect(200)
            .expect(({ body }) => {
              expect(body.data.token).toBeDefined();
            });
        });
      });
    });
  });

  describe('Create', () => {
    const newUserByAdminEmail = `user-created-by-admin.${Date.now()}@example.com`;
    const newUserByAdminPassword = `secret`;

    describe('User with "Admin" role', () => {
      it('should fail to create new user with invalid email: /api/v1/users (POST)', () => {
        return request(app)
          .post(`/api/v1/users`)
          .auth(apiToken, {
            type: 'bearer',
          })
          .send({ email: 'fail-data' })
          .expect(422);
      });

      it('should successfully create new user: /api/v1/users (POST)', () => {
        return request(app)
          .post(`/api/v1/users`)
          .auth(apiToken, {
            type: 'bearer',
          })
          .send({
            email: newUserByAdminEmail,
            password: newUserByAdminPassword,
            role: {
              id: RoleEnum.user,
            },
            status: {
              id: StatusEnum.active,
            },
          })
          .expect(201);
      });

      describe('Guest', () => {
        it('should successfully login via created by admin user: /api/v1/auth/email/login (GET)', () => {
          return request(app)
            .post('/api/v1/auth/email/login')
            .send({
              email: newUserByAdminEmail,
              password: newUserByAdminPassword,
            })
            .expect(200)
            .expect(({ body }) => {
              expect(body.data.token).toBeDefined();
            });
        });
      });
    });
  });

  describe('Get many', () => {
    describe('User with "Admin" role', () => {
      it('should get list of users: /api/v1/users (GET)', () => {
        return request(app)
          .get(`/api/v1/users`)
          .auth(apiToken, {
            type: 'bearer',
          })
          .expect(200)
          .send()
          .expect(({ body }) => {
            expect(body.data.data[0].provider).toBeDefined();
            expect(body.data.data[0].email).toBeDefined();
            expect(body.data.data[0].hash).not.toBeDefined();
            expect(body.data.data[0].password).not.toBeDefined();
            expect(typeof body.data.total).toBe('number');
            expect(body.data.total).toBeGreaterThanOrEqual(
              body.data.data.length,
            );
          });
      });

      it('should return users sorted by createdAt DESC by default: /api/v1/users (GET)', async () => {
        const stamp = Date.now();
        await request(app)
          .post(`/api/v1/users`)
          .auth(apiToken, { type: 'bearer' })
          .send({
            email: `user-sort-older.${stamp}@example.com`,
            password: 'secret',
            role: { id: RoleEnum.user },
            status: { id: StatusEnum.active },
          })
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 20));

        await request(app)
          .post(`/api/v1/users`)
          .auth(apiToken, { type: 'bearer' })
          .send({
            email: `user-sort-newer.${stamp}@example.com`,
            password: 'secret',
            role: { id: RoleEnum.user },
            status: { id: StatusEnum.active },
          })
          .expect(201);

        const { body } = await request(app)
          .get(`/api/v1/users`)
          .auth(apiToken, { type: 'bearer' })
          .expect(200);

        const users = body.data.data as Array<{ createdAt: string }>;
        expect(users.length).toBeGreaterThanOrEqual(2);

        for (let i = 0; i < users.length - 1; i++) {
          expect(new Date(users[i].createdAt).getTime()).toBeGreaterThanOrEqual(
            new Date(users[i + 1].createdAt).getTime(),
          );
        }
      });
    });
  });
});
