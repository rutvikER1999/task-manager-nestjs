import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRequest = {
    session: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should throw BadRequestException if email already registered', async () => {
      // Arrange
      const signupDto = {
        email: 'test@example.com',
        password: 'password',
        firstname: 'Test',
        lastname: 'User',
      };
      mockUserService.findByEmail.mockResolvedValue({ email: signupDto.email });

      // Act & Assert
      await expect(service.signup(signupDto, mockRequest as any)).rejects.toThrow(BadRequestException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(signupDto.email);
    });

    it('should throw BadRequestException if password not provided for normal signup', async () => {
      // Arrange
      const signupDto = {
        email: 'test@example.com',
        firstname: 'Test',
        lastname: 'User',
      };
      mockUserService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.signup(signupDto as any, mockRequest as any)).rejects.toThrow(BadRequestException);
    });

    it('should create a new user with hashed password and set session', async () => {
      // Arrange
      const signupDto = {
        email: 'test@example.com',
        password: 'password',
        firstname: 'Test',
        lastname: 'User',
      };
      const hashedPassword = 'hashed_password';
      const createdUser = {
        _id: 'user_id',
        email: signupDto.email,
        firstname: signupDto.firstname,
        lastname: signupDto.lastname,
      };
      const token = 'jwt_token';
      
      mockUserService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.signup(signupDto, mockRequest as any);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(signupDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(mockUserService.create).toHaveBeenCalledWith({
        firstname: signupDto.firstname,
        lastname: signupDto.lastname,
        email: signupDto.email,
        password: hashedPassword,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ id: createdUser._id });
      expect(mockRequest.session).toEqual({ jwt: token });
      expect(result).toEqual({
        status: 201,
        message: 'User created',
        data: { id: createdUser._id, token },
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      mockUserService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest as any)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw UnauthorizedException if password not provided', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
      };
      mockUserService.findByEmail.mockResolvedValue({
        email: loginDto.email,
        password: 'hashed_password',
      });

      // Act & Assert
      await expect(service.login(loginDto as any, mockRequest as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      mockUserService.findByEmail.mockResolvedValue({
        email: loginDto.email,
        password: 'hashed_password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto, mockRequest as any)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashed_password');
    });

    it('should login user and set session if credentials valid', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const user = {
        _id: 'user_id',
        email: loginDto.email,
        password: 'hashed_password',
      };
      const token = 'jwt_token';
      
      mockUserService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.login(loginDto, mockRequest as any);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ id: user._id });
      expect(mockRequest.session).toEqual({ jwt: token });
      expect(result).toEqual({
        status: 200,
        message: 'Login successful',
        data: { id: user._id, token },
      });
    });
  });

  describe('logout', () => {
    it('should clear session', async () => {
      // Arrange
      mockRequest.session = { jwt: 'token' };

      // Act
      const result = await service.logout(mockRequest as any);

      // Assert
      expect(mockRequest.session).toBeNull();
      expect(result).toEqual({
        status: 200,
        message: 'Logged out successfully',
      });
    });
  });

  describe('handleGoogleAuth', () => {
    it('should throw InternalServerErrorException for invalid token', async () => {
      // Arrange
      const mockBody = { accessToken: 'invalid_token' };
      const mockResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('Invalid token'),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.handleGoogleAuth(mockBody, mockRequest as any)).rejects.toThrow(InternalServerErrorException);
    });

    it('should create new user if not exists and set session', async () => {
      // Arrange
      const mockBody = { accessToken: 'valid_token' };
      const googleUser = {
        sub: 'google_id',
        email: 'test@example.com',
        email_verified: true,
        given_name: 'Test',
        family_name: 'User',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(googleUser),
      };
      
      const createdUser = { 
        _id: 'user_id', 
        googleId: googleUser.sub,
        email: googleUser.email,
        firstname: googleUser.given_name,
        lastname: googleUser.family_name
      };
      
      const token = 'jwt_token';
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.handleGoogleAuth(mockBody, mockRequest as any);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${mockBody.accessToken}`,
        },
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(googleUser.email);
      expect(mockUserService.create).toHaveBeenCalledWith({
        firstname: googleUser.given_name,
        lastname: googleUser.family_name,
        email: googleUser.email,
        googleId: googleUser.sub,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ id: createdUser._id });
      expect(mockRequest.session).toEqual({ jwt: token });
      expect(result).toEqual({
        status: 200,
        message: 'Google login successful',
        data: { id: createdUser._id, token },
      });
    });

    it('should login existing user and set session', async () => {
      // Arrange
      const mockBody = { accessToken: 'valid_token' };
      const googleUser = {
        sub: 'google_id',
        email: 'test@example.com',
        email_verified: true,
        given_name: 'Test',
        family_name: 'User',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(googleUser),
      };
      
      const existingUser = { 
        _id: 'user_id', 
        googleId: googleUser.sub,
        email: googleUser.email,
        firstname: googleUser.given_name,
        lastname: googleUser.family_name
      };
      
      const token = 'jwt_token';
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      mockUserService.findByEmail.mockResolvedValue(existingUser);
      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.handleGoogleAuth(mockBody, mockRequest as any);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${mockBody.accessToken}`,
        },
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(googleUser.email);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ id: existingUser._id });
      expect(mockRequest.session).toEqual({ jwt: token });
      expect(result).toEqual({
        status: 200,
        message: 'Google login successful',
        data: { id: existingUser._id, token },
      });
    });
  });
});
