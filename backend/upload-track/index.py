import json
import os
import base64
import boto3

def handler(event: dict, context) -> dict:
    """Загрузка аудиофайла в S3. Принимает бинарный файл с именем в заголовке X-Filename."""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Filename',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    try:
        # Имя файла из query параметра
        params = event.get('queryStringParameters') or {}
        filename = params.get('filename')
        if not filename:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'filename query param required'})}

        # Тело — бинарный файл (платформа кодирует в base64)
        body_raw = event.get('body') or ''
        if event.get('isBase64Encoded') and body_raw:
            audio_bytes = base64.b64decode(body_raw)
        else:
            audio_bytes = body_raw.encode('latin-1') if isinstance(body_raw, str) else body_raw

        if not audio_bytes:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Empty body'})}

        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )

        key = f'tracks/{filename}'
        s3.put_object(Bucket='files', Key=key, Body=audio_bytes, ContentType='audio/mpeg')

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'url': cdn_url, 'size': len(audio_bytes)}),
        }

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}