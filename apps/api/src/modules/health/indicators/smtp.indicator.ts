import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { HealthPersistenceService } from '../services/health-persistence.service';
import { RobustErrorLoggerService } from '../services/robust-error-logger.service';
import { ServiceStatus, ErrorCategory, ErrorLevel } from '../dto/health-check.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SmtpHealthIndicator {
  private readonly logger = new Logger(SmtpHealthIndicator.name);

  constructor(
    private healthIndicatorService: HealthIndicatorService,
    private configService: ConfigService,
    private healthPersistence: HealthPersistenceService,
    private errorLogger: RobustErrorLoggerService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startTime = Date.now();

    try {
      // Check if SMTP is configured
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const smtpPort = this.configService.get<number>('SMTP_PORT');
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');

      if (!smtpHost || !smtpPort) {
        const responseTime = Date.now() - startTime;
        await this.healthPersistence.updateServiceHealth(
          'SMTP',
          ServiceStatus.DOWN,
          responseTime,
          'SMTP not configured - check SMTP_HOST and SMTP_PORT environment variables',
        );

        return indicator.down({
          message: 'SMTP not configured - check SMTP_* environment variables',
          configured: false,
          responseTimeMs: responseTime,
        });
      }

      // Try to create a transport and verify connection
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: smtpUser && smtpPass ? {
          user: smtpUser,
          pass: smtpPass,
        } : undefined,
        // Short timeout for health checks
        connectionTimeout: 5000,
        greetingTimeout: 5000,
      });

      await transporter.verify();
      
      const responseTime = Date.now() - startTime;
      
      const status = responseTime > 3000 ? ServiceStatus.DEGRADED : ServiceStatus.UP;
      
      await this.healthPersistence.updateServiceHealth(
        'SMTP',
        status,
        responseTime,
      );

      if (status === ServiceStatus.DEGRADED) {
        return indicator.down({
          message: `SMTP response time slow (${responseTime}ms)`,
          configured: true,
          responseTimeMs: responseTime,
        });
      }

      return indicator.up({
        configured: true,
        host: smtpHost,
        port: smtpPort,
        responseTimeMs: responseTime,
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.healthPersistence.updateServiceHealth(
        'SMTP',
        ServiceStatus.DOWN,
        responseTime,
        errorMessage,
      );

      await this.errorLogger.logError({
        level: ErrorLevel.ERROR,
        category: ErrorCategory.EMAIL,
        message: `SMTP health check failed: ${errorMessage}`,
        error: error instanceof Error ? error : undefined,
        service: 'SmtpHealthIndicator',
      });

      return indicator.down({
        message: errorMessage,
        configured: true,
        responseTimeMs: responseTime,
      });
    }
  }
}
