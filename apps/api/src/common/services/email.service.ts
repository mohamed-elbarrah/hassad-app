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
      <div style="font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #121936; font-size: 24px; margin: 0;">مسار</h1>
          <p style="color: #6F7485; font-size: 12px; margin: 4px 0 0;">MSAR</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #CFD0D6; border-radius: 16px; padding: 32px;">
          <h2 style="color: #121936; font-size: 18px; margin: 0 0 16px;">إعادة تعيين كلمة المرور</h2>
          <p style="color: #6F7485; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            مرحباً ${name}،<br><br>
            لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #121936; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500;">
            إعادة تعيين كلمة المرور
          </a>
          <p style="color: #6F7485; font-size: 12px; margin: 24px 0 0;">
            أو انسخ هذا الرابط والصقه في متصفحك:<br>
            <span style="word-break: break-all; color: #121936;">${resetUrl}</span>
          </p>
          <p style="color: #9FA2AD; font-size: 12px; margin: 24px 0 0;">
            هذا الرابط صالح لمدة 1 ساعة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.
          </p>
        </div>
        <p style="color: #9FA2AD; font-size: 12px; text-align: center; margin-top: 24px;">
          © نظام مسار 2026 — جميع الحقوق محفوظة
        </p>
      </div>
    `;

    const text = `
      إعادة تعيين كلمة المرور - مسار

      مرحباً ${name}،

      لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.
      انقر على الرابط التالي لإنشاء كلمة مرور جديدة:
      ${resetUrl}

      هذا الرابط صالح لمدة 1 ساعة فقط.
      إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.

      © نظام مسار 2026
    `;

    await this.transporter.sendMail({
      from,
      to: email,
      subject: "إعادة تعيين كلمة المرور - مسار",
      text,
      html,
    });
  }
}
