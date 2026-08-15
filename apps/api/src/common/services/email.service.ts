import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host:
        this.configService.get<string>("SMTP_HOST") ?? "smtp.ethereal.email",
      port: this.configService.get<number>("SMTP_PORT") ?? 587,
      secure: false,
      auth: {
        user: this.configService.get<string>("SMTP_USER") ?? "",
        pass: this.configService.get<string>("SMTP_PASS") ?? "",
      },
    });
  }

  async sendPasswordReset(email: string, resetUrl: string, name: string) {
    const from =
      this.configService.get<string>("SMTP_FROM") ??
      "Hassad Platform <noreply@hassad.sa>";

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ltr; text-align: left; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #121936; font-size: 24px; margin: 0;">Hassad</h1>
          <p style="color: #6F7485; font-size: 12px; margin: 4px 0 0;">Hassad Platform</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #CFD0D6; border-radius: 16px; padding: 32px;">
          <h2 style="color: #121936; font-size: 18px; margin: 0 0 16px;">Reset your password</h2>
          <p style="color: #6F7485; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Hello ${name},<br><br>
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #121936; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500;">
            Reset password
          </a>
          <p style="color: #6F7485; font-size: 12px; margin: 24px 0 0;">
            Or copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #121936;">${resetUrl}</span>
          </p>
          <p style="color: #9FA2AD; font-size: 12px; margin: 24px 0 0;">
            This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
        <p style="color: #9FA2AD; font-size: 12px; text-align: center; margin-top: 24px;">
          © Hassad Platform 2026 — All rights reserved
        </p>
      </div>
    `;

    const text = `
      Reset your password - Hassad Platform

      Hello ${name},

      We received a request to reset your password.
      Open the following link to create a new password:
      ${resetUrl}

      This link is valid for 1 hour.
      If you did not request a password reset, you can safely ignore this email.

      © Hassad Platform 2026
    `;

    await this.transporter.sendMail({
      from,
      to: email,
      subject: "Reset your password - Hassad Platform",
      text,
      html,
    });
  }
}
