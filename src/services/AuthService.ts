import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  id: number;
  email: string;
  name: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async createUser(data: RegisterData): Promise<User> {
    const { name, email, password } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new user (password will be hashed by beforeCreate hook)
    const user = await User.create({ name, email, password });
    return user;
  }

  /**
   * Validate user credentials and return user if valid
   */
  async validateCredentials(data: LoginData): Promise<User> {
    const { email, password } = data;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Compare password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    return user;
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(payload, secret, { expiresIn } as SignOptions);
  }

  /**
   * Verify JWT token and return payload
   */
  verifyToken(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    
    try {
      const payload = jwt.verify(token, secret) as TokenPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }
}

export default new AuthService();
