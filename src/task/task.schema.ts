import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TaskStatus {
  CREATED = 'CREATED',
  INPROGRESS = 'INPROGRESS',
  COMPLETED = 'COMPLETED',
}

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.CREATED })
  status: TaskStatus;

  @Prop({ required: true })
  userId: string;
  
  // Mongoose automatically adds these with timestamps: true
  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task); 