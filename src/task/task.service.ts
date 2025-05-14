import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './task.schema';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async createTask(title: string, description: string, userId: string): Promise<Task> {
    const existingTask = await this.taskModel.findOne({
      title: title.trim(),
      userId: userId,
    }).lean();
   
    if (existingTask) {
      throw new HttpException('Task with the same title already exists', HttpStatus.CONFLICT);
    }
    const task = new this.taskModel({ title, description, userId });
    return task.save();
  }

  async editTask(taskId: string, title: string, description: string, userId: string): Promise<Task> {
    const task = await this.taskModel.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundException('Task not found or unauthorized');
    }
    task.title = title;
    task.description = description;
    return task.save();
  }

  async updateStatus(taskId: string, status: TaskStatus, userId: string): Promise<Task> {
    const task = await this.taskModel.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundException('Task not found or unauthorized');
    }
    task.status = status;
    return task.save();
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: taskId, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found or unauthorized');
    }
  }

  async getTasks(
    userId: string,
    search?: string,
    sort: 'latest' | 'oldest' = 'latest',
  ): Promise<Task[]> {
    const query: any = { userId };
  
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const sortOption = sort === 'latest' ? -1 : 1;
    return this.taskModel.find(query).sort({ createdAt: sortOption }).exec();
  }

  async getTasksByStatus(userId: string, searchString?: string): Promise<{ created: Task[], inprogress: Task[], completed: Task[] }> {
    // Get all tasks for the user, with optional search filter
    let allTasks: Task[];
    
    if (searchString && searchString.trim() !== '') {
      // Allow Regular expression
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeSearch = escapeRegex(searchString);
      // If search string is provided, use it to filter tasks
      allTasks = await this.taskModel.find({
        userId,
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
        ],
      }).exec();
    } else {
      // Otherwise, get all tasks for the user
      allTasks = await this.taskModel.find({ userId }).exec();
    }
    
    // Group tasks by status
    const createdTasks = allTasks.filter(task => task.status === TaskStatus.CREATED);
    const inProgressTasks = allTasks.filter(task => task.status === TaskStatus.INPROGRESS);
    const completedTasks = allTasks.filter(task => task.status === TaskStatus.COMPLETED);
    
    // Sort each group by updatedAt time (newest first)
    const sortByUpdatedAt = (a: Task, b: Task) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    };
    
    const grouped = {
      created: createdTasks.sort(sortByUpdatedAt),
      inprogress: inProgressTasks.sort(sortByUpdatedAt),
      completed: completedTasks.sort(sortByUpdatedAt),
    };
    
    return grouped;
  }
} 