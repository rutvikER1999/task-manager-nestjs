import { Body, Controller, Post, UsePipes, ValidationPipe, Req, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async signup(@Body() signupDto: SignupDto, @Req() req: Request) {
    return this.authService.signup(signupDto, req);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Post('google-login')
  async googleLogin(@Body() body: any, @Req() req: Request) {
    return this.authService.handleGoogleAuth(body, req);
  }

  @Get('logout')
  async logout(@Req() req: Request) {
    return this.authService.logout(req);
  }
}
