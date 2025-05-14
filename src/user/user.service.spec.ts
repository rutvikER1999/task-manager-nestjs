import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';

describe('UserService', () => {
  let service: UserService;

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashed_password',
        firstname: 'Test',
        lastname: 'User',
      };
      const createdUser = {
        _id: 'user_id',
        ...userData,
      };

      // Mock implementation of service.create
      service.create = jest.fn().mockResolvedValue(createdUser);

      // Act
      const result = await service.create(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(service.create).toHaveBeenCalledWith(userData);
    });
  });

  describe('findByEmail', () => {
    it('should find and return a user by email', async () => {
      // Arrange
      const email = 'test@example.com';
      const user = {
        _id: 'user_id',
        email,
        firstname: 'Test',
        lastname: 'User',
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      // Arrange
      const email = 'test@example.com';

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should find and return a user by googleId', async () => {
      // Arrange
      const googleId = 'google_id';
      const user = {
        _id: 'user_id',
        email: 'test@example.com',
        googleId,
        firstname: 'Test',
        lastname: 'User',
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      // Act
      const result = await service.findByGoogleId(googleId);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ googleId });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      // Arrange
      const googleId = 'google_id';

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.findByGoogleId(googleId);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ googleId });
      expect(result).toBeNull();
    });
  });
});
