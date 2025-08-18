import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API send-notification-email called');
    
    const body = await request.json();
    console.log('📧 Email request body:', body);
    
    const { 
      recipientEmail, 
      recipientName, 
      candidateName, 
      stageName, 
      processTitle, 
      movedBy 
    } = body;

    // Validar datos requeridos
    if (!recipientEmail || !candidateName || !stageName || !processTitle) {
      console.error('❌ Faltan datos requeridos:', { recipientEmail, candidateName, stageName, processTitle });
      return NextResponse.json(
        { error: 'Faltan datos requeridos', missingData: { recipientEmail, candidateName, stageName, processTitle } },
        { status: 400 }
      );
    }

    // Verificar configuración de Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY no configurada');
      return NextResponse.json(
        { error: 'RESEND_API_KEY no configurada' },
        { status: 500 }
      );
    }

    console.log('✅ Datos validados correctamente');

    // Crear el contenido del email
    const subject = `🎯 Nuevo candidato en tu etapa: ${stageName}`;
    const message = `El candidato ${candidateName} está ahora en tu etapa "${stageName}" para el puesto de ${processTitle}. Movido por: ${movedBy}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Notificación - AgendaPro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .email-container {
            background: white;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 8px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
          }
          .content {
            margin-bottom: 24px;
          }
          .highlight {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            border-left: 4px solid #6366f1;
            margin: 16px 0;
          }
          .candidate-info {
            background: #fef3c7;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
          }
          .footer {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🎯 AgendaPro</div>
            <div class="title">Nueva Notificación de Candidato</div>
          </div>
          
          <div class="content">
            <p>Hola <strong>${recipientName}</strong>,</p>
            
            <div class="highlight">
              <strong>📋 Resumen:</strong><br>
              ${message}
            </div>
            
            <div class="candidate-info">
              <strong>👤 Candidato:</strong> ${candidateName}<br>
              <strong>🎯 Etapa:</strong> ${stageName}<br>
              <strong>💼 Puesto:</strong> ${processTitle}<br>
              <strong>👤 Movido por:</strong> ${movedBy}
            </div>
            
            <p>Por favor, revisa el candidato y toma las acciones necesarias para continuar con el proceso de selección.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://recruitment.agendapro.com'}" class="button">
                Ver en AgendaPro →
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Este email fue enviado automáticamente por el sistema AgendaPro.<br>
            No responder a este email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email con Resend
    console.log('📤 Enviando email con Resend...');
    console.log('📧 From:', process.env.RESEND_FROM_EMAIL || 'notificaciones@agendapro.com');
    console.log('📧 To:', recipientEmail);
    console.log('📧 Subject:', subject);
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notificaciones@agendapro.com',
      to: recipientEmail,
      subject: subject,
      html: emailHtml,
      text: message, // Versión texto plano como fallback
    });

    console.log('📬 Respuesta de Resend - Data:', data);
    console.log('📬 Respuesta de Resend - Error:', error);

    if (error) {
      console.error('❌ Error enviando email con Resend:', error);
      return NextResponse.json(
        { error: 'Error enviando email', details: error, debugInfo: { recipientEmail, subject } },
        { status: 500 }
      );
    }

    console.log('✅ Email enviado exitosamente:', data);
    
    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Email enviado exitosamente',
      debugInfo: { recipientEmail, subject }
    });

  } catch (error) {
    console.error('❌ Error crítico en API send-notification-email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message || error },
      { status: 500 }
    );
  }
}
