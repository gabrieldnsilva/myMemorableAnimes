import request from 'supertest';
import app from '../src/server';
import sequelize from '../src/config/database';
import User from '../src/models/User';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test123!',
};

const testUser2 = {
  name: 'Another User',
  email: 'another@example.com',
  password: 'Pass123!',
};

describe('Authentication System', () => {
  // Setup: Clean database before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close database after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Clear users table before each test
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail to register with duplicate email', async () => {
      // Register first user
      await request(app).post('/api/auth/register').send(testUser);

      // Try to register again with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Email already registered');
    });

    it('should fail validation with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should fail validation with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should fail validation with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should fail validation with password without uppercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: 'test123!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: testUser.password });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should fail login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should fail validation with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: testUser.password });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should fail validation with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      authToken = res.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should fail without authorization header', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Access token required');
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logout successful');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before storing in database', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user).toBeDefined();
      expect(user?.password).not.toBe(testUser.password);
      expect(user?.password.length).toBeGreaterThan(20); // bcrypt hash is long
    });
  });

  describe('Multiple Users', () => {
    it('should handle multiple user registrations', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send(testUser2);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.user.email).toBe(testUser.email);
      expect(res2.body.data.user.email).toBe(testUser2.email);
    });

    it('should return different tokens for different users', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send(testUser2);

      expect(res1.body.data.token).not.toBe(res2.body.data.token);
    });
  });
});
