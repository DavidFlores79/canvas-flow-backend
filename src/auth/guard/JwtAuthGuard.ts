// ABOUTME: JWT authentication guard using Passport JWT strategy
// ABOUTME: Protects routes by validating the Bearer token in the Authorization header

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
