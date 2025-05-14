import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let token: string = null;

    // Check for token in session
    if (request.session?.jwt) {
      token = request.session.jwt;
      this.logger.debug('Token found in session');
    } else {
      this.logger.debug('No token in session', { 
        hasSession: !!request.session,
        sessionKeys: request.session ? Object.keys(request.session) : 'no session'
      });
    }
    
    // If no token in session, check Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        this.logger.debug('Token found in Authorization header');
      } else {
        this.logger.debug('No token in Authorization header');
      }
    }
    
    // If still no token, check query parameters (useful for development)
    if (!token && request.query.token) {
      token = request.query.token;
      this.logger.debug('Token found in query parameter');
    }
    
    // If still no token, unauthorized
    if (!token) {
      this.logger.warn('No authentication token found', {
        url: request.url,
        method: request.method,
        cookies: request.cookies,
        headers: request.headers
      });
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch (error) {
      this.logger.error('Invalid authentication token', error.stack);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
} 