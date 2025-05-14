import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    handleGoogleAuth: jest.fn(),
    logout: jest.fn(),
  };

  const mockRequest = {
    session: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup with correct parameters', async () => {
      // Arrange
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password',
        firstname: 'Test',
        lastname: 'User',
      };
      const expected = { status: 201, message: 'User created', data: { id: 'user_id' } };
      mockAuthService.signup.mockResolvedValue(expected);

      // Act
      const result = await controller.signup(signupDto, mockRequest as any);

      // Assert
      expect(authService.signup).toHaveBeenCalledWith(signupDto, mockRequest);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const expected = { status: 200, message: 'Login successful', data: { id: 'user_id' } };
      mockAuthService.login.mockResolvedValue(expected);

      // Act
      const result = await controller.login(loginDto, mockRequest as any);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto, mockRequest);
      expect(result).toEqual(expected);
    });
  });

  describe('googleAuth', () => {
    it('should not throw when calling googleAuth endpoint', () => {
      // Act & Assert
      expect(() => controller.googleAuth()).not.toThrow();
    });
  });

  describe('googleLogin', () => {
    it('should call authService.handleGoogleAuth with body and request', async () => {
      // Arrange
      const mockBody = { accessToken: 'valid_token' };
      const expected = { 
        status: 200, 
        message: 'Google login successful', 
        data: { id: 'user_id', token: 'jwt_token' } 
      };
      mockAuthService.handleGoogleAuth.mockResolvedValue(expected);

      // Act
      const result = await controller.googleLogin(mockBody, mockRequest as any);

      // Assert
      expect(authService.handleGoogleAuth).toHaveBeenCalledWith(mockBody, mockRequest);
      expect(result).toEqual(expected);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with request', async () => {
      // Arrange
      const expected = { status: 200, message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expected);

      // Act
      const result = await controller.logout(mockRequest as any);

      // Assert
      expect(authService.logout).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(expected);
    });
  });
});
