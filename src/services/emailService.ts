export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  message: string;
  resendError?: string;
  statusCode?: number;
}

export class EmailService {
  private static _instance: EmailService;

  constructor() {
    if (EmailService._instance) {
      return EmailService._instance;
    }
    EmailService._instance = this;
  }

  public static getInstance(): EmailService {
    if (!EmailService._instance) {
      EmailService._instance = new EmailService();
    }
    return EmailService._instance;
  }

  /// Envia um email utilizando a API do Resend.
  /// Utiliza proxy para contornar limitações de CORS no ambiente Web.
  async sendEmailDetailed({
    to,
    subject,
    htmlContent,
    from = 'onboarding@resend.dev', // Email padrão de teste do Resend
  }: SendEmailOptions): Promise<SendEmailResult> {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;

    if (!apiKey || apiKey === '' || apiKey === 'sua_api_key_do_resend_aqui') {
      const msg = 'Chave do Resend (VITE_RESEND_API_KEY) não configurada no arquivo .env';
      console.warn(`[Resend EmailService] ${msg}`);
      return {
        success: false,
        message: msg,
      };
    }

    // Tenta primeiro via proxy Vite local (/api-resend/emails) para evitar bloqueio de CORS do navegador.
    // Se falhar por rede/404, utiliza o fallback de proxy CORS.
    const endpointsToTry = [
      '/api-resend/emails',
      'https://corsproxy.io/?https://api.resend.com/emails',
      'https://api.resend.com/emails',
    ];

    let lastError: any = null;

    for (const endpoint of endpointsToTry) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject,
            html: htmlContent,
          }),
        });

        // Sucesso no envio
        if (response.status === 200 || response.status === 201) {
          console.log(`[Resend EmailService] Email enviado com sucesso para ${to} via ${endpoint}`);
          return {
            success: true,
            message: `E-mail enviado com sucesso para ${to}`,
            statusCode: response.status,
          };
        }

        // Se o servidor respondeu com status de erro (ex: 403, 422), extrai a mensagem do Resend
        const responseText = await response.text();
        let errorParsed: any = null;
        try {
          errorParsed = JSON.parse(responseText);
        } catch (_) {
          errorParsed = null;
        }

        const resendMsg = errorParsed?.message || responseText;
        console.warn(`[Resend EmailService] Resposta do Resend (${response.status}):`, resendMsg);

        let userFriendlyMsg = `Erro ${response.status} ao enviar e-mail via Resend: ${resendMsg}`;

        // Diagnóstico claro das limitações da conta de testes do Resend (onboarding@resend.dev)
        if (
          response.status === 403 ||
          response.status === 422 ||
          resendMsg.toLowerCase().includes('testing emails') ||
          resendMsg.toLowerCase().includes('own email address')
        ) {
          userFriendlyMsg =
            'O remetente de testes do Resend (onboarding@resend.dev) só permite entregar e-mails para o endereço proprietário cadastrado na sua conta Resend. Para enviar e-mails para terceiros, verifique seu domínio em resend.com/domains.';
        }

        return {
          success: false,
          message: userFriendlyMsg,
          resendError: resendMsg,
          statusCode: response.status,
        };
      } catch (fetchErr: any) {
        console.warn(`[Resend EmailService] Tentativa no endpoint '${endpoint}' falhou por rede/CORS:`, fetchErr);
        lastError = fetchErr;
        // Tenta o próximo endpoint na lista (ex: proxy fallback)
      }
    }

    return {
      success: false,
      message:
        'Não foi possível conectar à API do Resend devido a bloqueio de rede ou CORS no navegador. Verifique a conexão ou configure uma Supabase Edge Function.',
      resendError: String(lastError),
    };
  }

  /// Método simples que retorna boolean para compatibilidade
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const result = await this.sendEmailDetailed(options);
    return result.success;
  }

  // Atalhos estáticos
  public static async sendEmailDetailed(options: SendEmailOptions): Promise<SendEmailResult> {
    return EmailService.getInstance().sendEmailDetailed(options);
  }

  public static async sendEmail(options: SendEmailOptions): Promise<boolean> {
    return EmailService.getInstance().sendEmail(options);
  }
}

export const emailService = EmailService.getInstance();
