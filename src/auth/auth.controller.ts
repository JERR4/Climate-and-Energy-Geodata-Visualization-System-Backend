import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthSchema, type AuthDto } from './auth.schema';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/register')
  async register(@Body(new ZodValidationPipe(AuthSchema)) body: AuthDto) {
    return this.auth.register(body);
  }

  @Post('/login')
  async login(@Body(new ZodValidationPipe(AuthSchema)) body: AuthDto) {
    return this.auth.login(body);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: express.Request) {
    if (!req?.user) throw new UnauthorizedException();
    return { id: req.user.sub, email: req.user.email };
  }
}
