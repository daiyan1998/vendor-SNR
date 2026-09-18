import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { registerSchema, type RegisterDto } from './dto/register.dto.js';
import { resendOtpSchema, type ResendOtpDto } from './dto/resend-otp.dto.js';
import { verifyOtpSchema, type VerifyOtpDto } from './dto/verify-otp.dto.js';
import { IdentityAccessService } from './identity-access.service.js';

@Controller('identity-access')
export class IdentityAccessController {
  constructor(private readonly identityAccessService: IdentityAccessService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterDto) {
    const { expiresAt } = await this.identityAccessService.register(body);
    return { status: 'otp_sent', expiresAt };
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDto) {
    const { expiresAt } = await this.identityAccessService.login(body);
    return { status: 'otp_sent', expiresAt };
  }

  @Post('otp/resend')
  @UsePipes(new ZodValidationPipe(resendOtpSchema))
  async resendOtp(@Body() body: ResendOtpDto) {
    const { expiresAt } = await this.identityAccessService.resendOtp(body);
    return { status: 'otp_sent', expiresAt };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const { sessionToken, userId } = await this.identityAccessService.verifyOtp(body);
    return { sessionToken, userId };
  }
}
