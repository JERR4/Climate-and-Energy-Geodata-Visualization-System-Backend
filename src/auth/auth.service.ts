import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DbService } from '../db/db.service';
import { AuthDto } from './auth.schema';

type UserRow = {
  id: string;
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly jwt: JwtService,
  ) {}

  async register(data: AuthDto) {
    const { email, password } = data;

    const existing = await this.db.query<UserRow>(
      `SELECT * FROM users WHERE email = $1`,
      [email],
    );

    if (existing.rows.length) {
      throw new ConflictException('Email already registered');
    }

    const hash = await bcrypt.hash(password, 10);

    const r = await this.db.query<UserRow>(
      `
      INSERT INTO users (email, password)
      VALUES ($1,$2)
      RETURNING id, email, password
      `,
      [email, hash],
    );

    const user = r.rows[0];

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      id: user.id,
      email: user.email,
      token,
    };
  }

  async login(data: AuthDto) {
    const { email, password } = data;

    const r = await this.db.query<UserRow>(
      `SELECT * FROM users WHERE email = $1`,
      [email],
    );

    const user = r.rows[0];

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      id: user.id,
      email: user.email,
      token,
    };
  }
}