import { Controller, Post, Put, Get, Delete, Body, Param, Query, UseGuards, UsePipes, ValidationPipe, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './task.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { EditTaskDto } from './dto/edit-task.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async createTask(@Body() createTaskDto: CreateTaskDto, @Request() req): Promise<Task> {
    return this.taskService.createTask(createTaskDto.title, createTaskDto.description, req.user.id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async editTask(@Param('id') taskId: string, @Body() editTaskDto: EditTaskDto, @Request() req): Promise<Task> {
    return this.taskService.editTask(taskId, editTaskDto.title, editTaskDto.description, req.user.id);
  }

  @Put(':id/status')
  @UsePipes(new ValidationPipe())
  async updateStatus(
    @Param('id') taskId: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req,
  ): Promise<Task> {
    return this.taskService.updateStatus(
      taskId,
      updateStatusDto.status,
      req.user.id,
    );
  }

  @Get()
  async getTasks(
    @Request() req,
    @Query('search') search?: string,
    @Query('sort') sort: 'latest' | 'oldest' = 'latest',
  ): Promise<Task[]> {
    return this.taskService.getTasks(req.user.id, search, sort);
  }

  @Delete(':id')
  async deleteTask(@Param('id') taskId: string, @Request() req): Promise<void> {
    return this.taskService.deleteTask(taskId, req.user.id);
  }
}
