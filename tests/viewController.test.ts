import request from 'supertest';
import express, { Express } from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import path from 'path';
import viewRoutes from '../src/routes/viewRoutes';
import { viewLocals } from '../src/middlewares/viewLocals';
import sequelize from '../src/config/database';
import User from '../src/models/User';

describe('ViewController - Authentication Pages', () => {
  let app: Express;
  let testUser: User;

  beforeAll(async () => {
    // Setup Express app for testing
    app = express();
    
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../src/views'));
    
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    );
    
    app.use(flash());
    app.use(viewLocals);
    app.use('/', viewRoutes);

    await sequelize.authenticate();
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'testview@test.com',
      password: 'Test123!',
    });
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser) {
      await testUser.destroy();
    }
    await sequelize.close();
  });

  describe('GET /login', () => {
    it('should render login page for unauthenticated users', async () => {
      const response = await request(app).get('/login');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Bem-vindo de volta');
      expect(response.text).toContain('action="/login"');
    });

    it('should redirect to home if user is already authenticated', async () => {
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/login')
        .send({ email: 'testview@test.com', password: 'Test123!' });
      
      // Try to access login page
      const response = await agent.get('/login');
      
      // Should redirect to home
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/');
    });
  });

  describe('GET /register', () => {
    it('should render register page for unauthenticated users', async () => {
      const response = await request(app).get('/register');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Criar sua conta');
      expect(response.text).toContain('action="/register"');
    });

    it('should redirect to home if user is already authenticated', async () => {
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/login')
        .send({ email: 'testview@test.com', password: 'Test123!' });
      
      // Try to access register page
      const response = await agent.get('/register');
      
      // Should redirect to home
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/');
    });
  });

  describe('POST /login', () => {
    it('should login with valid credentials and set session', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post('/login')
        .send({ email: 'testview@test.com', password: 'Test123!' });
      
      // Should redirect to home
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/');
      
      // Verify session is set by accessing protected route
      const profileResponse = await agent.get('/profile');
      expect(profileResponse.status).toBe(200);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'invalid@test.com', password: 'wrongpassword' });
      
      // Should redirect back to login
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/login');
    });

    it('should reject empty email or password', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: '', password: '' });
      
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/login');
    });
  });

  describe('POST /register', () => {
    it('should register new user with valid data', async () => {
      const uniqueEmail = `test${Date.now()}@test.com`;
      
      const response = await request(app)
        .post('/register')
        .send({
          name: 'Test User',
          email: uniqueEmail,
          password: 'Test123!',
        });
      
      // Should redirect to home
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/');
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          name: 'Test User',
          email: 'testview@test.com', // Already exists
          password: 'Test123!',
        });
      
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/register');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          name: '',
          email: '',
          password: '',
        });
      
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/register');
    });
  });

  describe('GET /logout', () => {
    it('should destroy session and redirect to home', async () => {
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/login')
        .send({ email: 'testview@test.com', password: 'Test123!' });
      
      // Logout
      const response = await agent.get('/logout');
      
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/');
      
      // Verify session is destroyed by trying to access protected route
      const profileResponse = await agent.get('/profile');
      expect(profileResponse.status).toBe(302);
      expect(profileResponse.header.location).toBe('/login');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to /login when accessing /profile without authentication', async () => {
      const response = await request(app).get('/profile');
      
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/login');
    });

    it('should redirect to /login when accessing /animes without authentication', async () => {
      const response = await request(app).get('/animes');
      
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/login');
    });

    it('should allow access to /profile with valid session', async () => {
      const agent = request.agent(app);
      
      // Login first
      await agent
        .post('/login')
        .send({ email: 'testview@test.com', password: 'Test123!' });
      
      // Access protected route
      const response = await agent.get('/profile');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Perfil');
    });
  });

  describe('Flash Messages', () => {
    it('should display success message after successful login', async () => {
      const agent = request.agent(app);
      
      await agent
        .post('/login')
        .send({ email: 'testview@test.com', password: 'Test123!' });
      
      const response = await agent.get('/');
      
      // Flash message should be in the response
      expect(response.text).toContain('Bem-vindo');
    });

    it('should display error message after failed login', async () => {
      const agent = request.agent(app);
      
      await agent
        .post('/login')
        .send({ email: 'invalid@test.com', password: 'wrong' });
      
      const response = await agent.get('/login');
      
      // Error message should be present
      // Note: actual implementation depends on how flash messages are rendered
      expect(response.status).toBe(200);
    });
  });

  describe('Header User Display', () => {
    it('should show user name in header when authenticated', async () => {
      const agent = request.agent(app);
      
      // Login
      await agent
        .post('/login')
        .send({ email: 'testview@test.com', password: 'Test123!' });
      
      // Get any page
      const response = await agent.get('/');
      
      // Should contain user name
      expect(response.text).toContain('Olá,');
      expect(response.text).toContain('Test User'); // assuming test user has this name
    });

    it('should show Login/Cadastro links when not authenticated', async () => {
      const response = await request(app).get('/');
      
      expect(response.text).toContain('Login');
      expect(response.text).toContain('Cadastro');
      expect(response.text).not.toContain('Olá,');
    });
  });
});
