import crypto from 'crypto';

class EmailService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    if (!this.apiKey) {
      console.warn('BREVO_API_KEY não configurada. Emails serão simulados.');
    }
  }

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<boolean> {
    const baseUrl = process.env.REPLIT_DOMAINS || 'http://localhost:5000';
    const verificationLink = `${baseUrl}/verify-email/${verificationToken}`;

    if (!this.apiKey) {
      console.log(`📧 [SIMULADO] Email de verificação enviado para: ${email}`);
      console.log(`🔗 Token de verificação: ${verificationToken}`);
      console.log(`🌐 Link: ${verificationLink}`);
      return true;
    }

    try {
      const emailData = {
        sender: { 
          name: "FinanceFlow", 
          email: process.env.BREVO_SENDER_EMAIL || "noreply@financeflow.com" 
        },
        to: [{ email, name: firstName }],
        subject: "Confirme seu email - FinanceFlow",
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Bem-vindo ao FinanceFlow!</h1>
                </div>
                <div class="content">
                  <h2>Olá, ${firstName}!</h2>
                  <p>Obrigado por se cadastrar no FinanceFlow. Para ativar sua conta e começar a organizar suas finanças, clique no botão abaixo:</p>
                  
                  <div style="text-align: center;">
                    <a href="${verificationLink}" class="button">✅ Confirmar Email</a>
                  </div>
                  
                  <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                  <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationLink}</p>
                  
                  <p><strong>Por que confirmar?</strong></p>
                  <ul>
                    <li>🔒 Segurança da sua conta</li>
                    <li>📊 Acesso completo às funcionalidades</li>
                    <li>🤖 Insights de IA personalizados</li>
                    <li>📧 Notificações importantes</li>
                  </ul>
                  
                  <p>Se você não se cadastrou no FinanceFlow, pode ignorar este email.</p>
                </div>
                <div class="footer">
                  <p>Este email foi enviado pelo FinanceFlow<br>
                  Se tiver dúvidas, entre em contato conosco.</p>
                </div>
              </div>
            </body>
          </html>
        `
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log(`✅ Email de verificação enviado para: ${email}`);
        return true;
      } else {
        console.error('❌ Erro ao enviar email:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean> {
    const baseUrl = process.env.REPLIT_DOMAINS || 'http://localhost:5000';
    const resetLink = `${baseUrl}/reset-password/${resetToken}`;

    if (!this.apiKey) {
      console.log(`📧 [SIMULADO] Email de recuperação enviado para: ${email}`);
      console.log(`🔗 Token de reset: ${resetToken}`);
      console.log(`🌐 Link: ${resetLink}`);
      return true;
    }

    try {
      const emailData = {
        sender: { 
          name: "FinanceFlow", 
          email: process.env.BREVO_SENDER_EMAIL || "noreply@financeflow.com" 
        },
        to: [{ email, name: firstName }],
        subject: "Redefinir senha - FinanceFlow",
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f56565; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #f56565; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Redefinir Senha</h1>
                </div>
                <div class="content">
                  <h2>Olá, ${firstName}!</h2>
                  <p>Recebemos uma solicitação para redefinir a senha da sua conta no FinanceFlow.</p>
                  
                  <div style="text-align: center;">
                    <a href="${resetLink}" class="button">🔑 Redefinir Senha</a>
                  </div>
                  
                  <p>Se o botão não funcionar, copie e cole este link:</p>
                  <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetLink}</p>
                  
                  <p><strong>⚠️ Importante:</strong></p>
                  <ul>
                    <li>Este link expira em 1 hora</li>
                    <li>Se você não solicitou, ignore este email</li>
                    <li>Sua senha atual permanece ativa até você alterá-la</li>
                  </ul>
                </div>
              </div>
            </body>
          </html>
        `
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log(`✅ Email de recuperação enviado para: ${email}`);
        return true;
      } else {
        console.error('❌ Erro ao enviar email de recuperação:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();