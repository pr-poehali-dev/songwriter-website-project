import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Отправка сообщения с контактной формы на почту автора."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '').strip()
    email = body.get('email', '').strip()
    message = body.get('message', '').strip()

    if not name or not email or not message:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Заполните все поля'}, ensure_ascii=False),
        }

    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    smtp_from = 'sethrift@yandex.ru'
    smtp_to = 'sethrift@yandex.ru'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Сообщение с сайта от {name}'
    msg['From'] = smtp_from
    msg['To'] = smtp_to

    html_body = f"""
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; color: #e8e0d0; padding: 40px;">
      <h2 style="color: #c9a84c; font-style: italic; margin-bottom: 24px;">Новое сообщение с сайта</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; padding: 8px 0; border-bottom: 1px solid #1e1e1e; width: 100px;">Имя</td>
          <td style="color: #e8e0d0; padding: 8px 0; border-bottom: 1px solid #1e1e1e;">{name}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; padding: 8px 0; border-bottom: 1px solid #1e1e1e;">Email</td>
          <td style="color: #e8e0d0; padding: 8px 0; border-bottom: 1px solid #1e1e1e;">{email}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; padding: 16px 0 8px; vertical-align: top;">Сообщение</td>
          <td style="color: #e8e0d0; padding: 16px 0 8px; line-height: 1.6;">{message.replace(chr(10), '<br>')}</td>
        </tr>
      </table>
      <p style="color: #444; font-size: 12px; margin-top: 40px; border-top: 1px solid #1e1e1e; padding-top: 16px;">
        Отправлено с официального сайта Александра Соколова
      </p>
    </div>
    """

    msg.attach(MIMEText(html_body, 'html'))

    with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
        server.login(smtp_from, smtp_password)
        server.sendmail(smtp_from, smtp_to, msg.as_string())

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}, ensure_ascii=False),
    }