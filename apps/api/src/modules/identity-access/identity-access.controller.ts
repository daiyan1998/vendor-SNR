import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  ChangePhoneNumberRequestDto,
  changePhoneNumberSchema,
  type ChangePhoneNumberDto,
} from './dto/change-phone-number.dto.js';
import { CurrentSession, type AuthenticatedSession } from './current-session.decorator.js';
import { LoggedOutResponseDto } from './dto/logged-out-response.dto.js';
import { LoginRequestDto, loginSchema, type LoginDto } from './dto/login.dto.js';
import { OtpSentResponseDto } from './dto/otp-sent-response.dto.js';
import { PhoneNumberChangedResponseDto } from './dto/phone-number-changed-response.dto.js';
import { RegisterRequestDto, registerSchema, type RegisterDto } from './dto/register.dto.js';
import { ResendOtpRequestDto, resendOtpSchema, type ResendOtpDto } from './dto/resend-otp.dto.js';
import { SessionResponseDto } from './dto/session-response.dto.js';
import { SessionRevokedResponseDto } from './dto/session-revoked-response.dto.js';
import { SessionSummaryDto } from './dto/session-summary.dto.js';
import { VerifyOtpRequestDto, verifyOtpSchema, type VerifyOtpDto } from './dto/verify-otp.dto.js';
import {
  VerifyPhoneNumberChangeRequestDto,
  verifyPhoneNumberChangeSchema,
  type VerifyPhoneNumberChangeDto,
} from './dto/verify-phone-number-change.dto.js';
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

  @Get('sessions')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: SessionSummaryDto, isArray: true })
  async listSessions(
    @CurrentSession() session: AuthenticatedSession,
  ): Promise<SessionSummaryDto[]> {
    return this.identityAccessService.listSessions(session.userId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: SessionRevokedResponseDto })
  async revokeSession(
    @CurrentSession() session: AuthenticatedSession,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionRevokedResponseDto> {
    await this.identityAccessService.revokeSession(session.userId, sessionId);
    return { status: 'revoked' };
  }

  // Scoped to @Body() rather than method-level @UsePipes: this handler also
  // takes @CurrentSession(), and ZodValidationPipe validates whatever value
  // it's given regardless of parameter type — a method-level pipe would
  // validate the session object against this body schema too.
  @Post('phone-number/change')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiBody({ type: ChangePhoneNumberRequestDto })
  @ApiOkResponse({ type: OtpSentResponseDto })
  async changePhoneNumber(
    @CurrentSession() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(changePhoneNumberSchema)) body: ChangePhoneNumberDto,
  ): Promise<OtpSentResponseDto> {
    const { expiresAt } = await this.identityAccessService.changePhoneNumber(session.userId, body);
    return { status: 'otp_sent', expiresAt };
  }

  @Post('phone-number/change/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiBody({ type: VerifyPhoneNumberChangeRequestDto })
  @ApiOkResponse({ type: PhoneNumberChangedResponseDto })
  async verifyPhoneNumberChange(
    @CurrentSession() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(verifyPhoneNumberChangeSchema)) body: VerifyPhoneNumberChangeDto,
  ): Promise<PhoneNumberChangedResponseDto> {
    await this.identityAccessService.verifyPhoneNumberChange(session.userId, session.id, body);
    return { status: 'phone_number_changed' };
  }
}
