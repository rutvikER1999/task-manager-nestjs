import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { EditTaskDto } from './dto/edit-task.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { TaskStatus } from './task.schema';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Create a mock JwtAuthGuard
jest.mock('../auth/jwt-auth.guard', () => {
  return {
    JwtAuthGuard: jest.fn().mockImplementation(() => {
      return {
        canActivate: jest.fn().mockReturnValue(true),
      };
    }),
  };
});

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;

  const mockTaskService = {
    createTask: jest.fn(),
    editTask: jest.fn(),
    updateStatus: jest.fn(),
    getTasks: jest.fn(),
    deleteTask: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUser = {
    id: 'user_id',
    email: 'test@example.com',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTask', () => {
    it('should call taskService.createTask with correct parameters', async () => {
      // Arrange
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'This is a test task',
      };
      const createdTask = {
        _id: 'task_id',
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: TaskStatus.CREATED,
        userId: mockUser.id,
      };
      mockTaskService.createTask.mockResolvedValue(createdTask);

      // Act
      const result = await controller.createTask(createTaskDto, mockRequest);

      // Assert
      expect(taskService.createTask).toHaveBeenCalledWith(
        createTaskDto.title,
        createTaskDto.description,
        mockUser.id,
      );
      expect(result).toEqual(createdTask);
    });
  });

  describe('editTask', () => {
    it('should call taskService.editTask with correct parameters', async () => {
      // Arrange
      const taskId = 'task_id';
      const editTaskDto: EditTaskDto = {
        title: 'Updated Task',
        description: 'This is an updated task',
      };
      const updatedTask = {
        _id: taskId,
        title: editTaskDto.title,
        description: editTaskDto.description,
        status: TaskStatus.CREATED,
        userId: mockUser.id,
      };
      mockTaskService.editTask.mockResolvedValue(updatedTask);

      // Act
      const result = await controller.editTask(taskId, editTaskDto, mockRequest);

      // Assert
      expect(taskService.editTask).toHaveBeenCalledWith(
        taskId,
        editTaskDto.title,
        editTaskDto.description,
        mockUser.id,
      );
      expect(result).toEqual(updatedTask);
    });
  });

  describe('updateStatus', () => {
    it('should call taskService.updateStatus with correct parameters', async () => {
      // Arrange
      const taskId = 'task_id';
      const updateStatusDto: UpdateStatusDto = {
        status: TaskStatus.INPROGRESS,
      };
      const updatedTask = {
        _id: taskId,
        title: 'Test Task',
        description: 'This is a test task',
        status: updateStatusDto.status,
        userId: mockUser.id,
      };
      mockTaskService.updateStatus.mockResolvedValue(updatedTask);

      // Act
      const result = await controller.updateStatus(taskId, updateStatusDto, mockRequest);

      // Assert
      expect(taskService.updateStatus).toHaveBeenCalledWith(
        taskId,
        updateStatusDto.status,
        mockUser.id,
      );
      expect(result).toEqual(updatedTask);
    });
  });

  describe('getTasks', () => {
    it('should call taskService.getTasks with correct parameters', async () => {
      // Arrange
      const search = 'test';
      const sort = 'latest';
      
      const tasks = [
        {
          _id: 'task_id_1',
          title: 'Task 1',
          description: 'Description 1',
          status: TaskStatus.CREATED,
          userId: mockUser.id,
        },
        {
          _id: 'task_id_2',
          title: 'Task 2',
          description: 'Description 2',
          status: TaskStatus.INPROGRESS,
          userId: mockUser.id,
        },
      ];
      mockTaskService.getTasks.mockResolvedValue(tasks);

      // Act
      const result = await controller.getTasks(mockRequest, search, sort);

      // Assert
      expect(taskService.getTasks).toHaveBeenCalledWith(mockUser.id, search, sort);
      expect(result).toEqual(tasks);
    });
    
    it('should call taskService.getTasks with default parameters when not provided', async () => {
      // Arrange
      const tasks = [
        {
          _id: 'task_id_1',
          title: 'Task 1',
          description: 'Description 1',
          status: TaskStatus.CREATED,
          userId: mockUser.id,
        },
        {
          _id: 'task_id_2',
          title: 'Task 2',
          description: 'Description 2',
          status: TaskStatus.INPROGRESS,
          userId: mockUser.id,
        },
      ];
      mockTaskService.getTasks.mockResolvedValue(tasks);

      // Act
      const result = await controller.getTasks(mockRequest);

      // Assert
      expect(taskService.getTasks).toHaveBeenCalledWith(mockUser.id, undefined, 'latest');
      expect(result).toEqual(tasks);
    });
  });

  describe('deleteTask', () => {
    it('should call taskService.deleteTask with correct parameters', async () => {
      // Arrange
      const taskId = 'task_id';
      mockTaskService.deleteTask.mockResolvedValue(undefined);

      // Act
      await controller.deleteTask(taskId, mockRequest);

      // Assert
      expect(taskService.deleteTask).toHaveBeenCalledWith(taskId, mockUser.id);
    });
  });
}); 