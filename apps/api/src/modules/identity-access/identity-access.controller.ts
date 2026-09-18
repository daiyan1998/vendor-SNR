import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentSession, type AuthenticatedSession } from './current-session.decorator.js';
import { LoggedOutResponseDto } from './dto/logged-out-response.dto.js';
import { LoginRequestDto, loginSchema, type LoginDto } from './dto/login.dto.js';
import { OtpSentResponseDto } from './dto/otp-sent-response.dto.js';
import { RegisterRequestDto, registerSchema, type RegisterDto } from './dto/register.dto.js';
import { ResendOtpRequestDto, resendOtpSchema, type ResendOtpDto } from './dto/resend-otp.dto.js';
import { SessionResponseDto } from './dto/session-response.dto.js';
import { VerifyOtpRequestDto, verifyOtpSchema, type VerifyOtpDto } from './dto/verify-otp.dto.js';
import { IdentityAccessService } from './identity-access.service.js';
import { SessionGuard } from './session.guard.js';

@ApiTags('identity-access')
@Controller('identity-access')
export class IdentityAccessController {
  constructor(private readonly identityAccessService: IdentityAccessService) {}

  @Post('register')
  @ApiBody({ type: RegisterRequestDto })
  @ApiOkResponse({ type: OtpSentResponseDto })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterDto): Promise<OtpSentResponseDto> {
    const { expiresAt } = await this.identityAccessService.register(body);
    return { status: 'otp_sent', expiresAt };
  }

  @Post('login')
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: OtpSentResponseDto })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDto): Promise<OtpSentResponseDto> {
    const { expiresAt } = await this.identityAccessService.login(body);
    return { status: 'otp_sent', expiresAt };
  }

  @Post('otp/resend')
  @ApiBody({ type: ResendOtpRequestDto })
  @ApiOkResponse({ type: OtpSentResponseDto })
  @UsePipes(new ZodValidationPipe(resendOtpSchema))
  async resendOtp(@Body() body: ResendOtpDto): Promise<OtpSentResponseDto> {
    const { expiresAt } = await this.identityAccessService.resendOtp(body);
    return { status: 'otp_sent', expiresAt };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: VerifyOtpRequestDto })
  @ApiOkResponse({ type: SessionResponseDto })
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<SessionResponseDto> {
    const { sessionToken, userId } = await this.identityAccessService.verifyOtp(body);
    return { sessionToken, userId };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: LoggedOutResponseDto })
  async logout(@CurrentSession() session: AuthenticatedSession): Promise<LoggedOutResponseDto> {
    await this.identityAccessService.logout(session.id);
    return { status: 'logged_out' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: LoggedOutResponseDto })
  async logoutAll(@CurrentSession() session: AuthenticatedSession): Promise<LoggedOutResponseDto> {
    await this.identityAccessService.logoutAllDevices(session.userId);
    return { status: 'logged_out' };
  }
}
