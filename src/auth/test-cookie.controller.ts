import { Controller, Get, Req, Res, Post } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('test-cookie')
export class TestCookieController {
  
  @Get()
  testReadCookie(@Req() req: Request) {
    // Return session information for debugging
    return {
      hasSession: !!req.session,
      sessionData: req.session,
      cookies: req.headers.cookie,
    };
  }

  @Post()
  testSetCookie(@Req() req: Request, @Res() res: Response) {
    // Set a test cookie
    if (req.session) {
      req.session.testValue = 'test-session-value';
    } else {
      req.session = { testValue: 'test-session-value' };
    }
    
    // Send response
    return res.json({
      message: 'Test cookie set',
      session: req.session
    });
  }
} 