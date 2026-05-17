import json
import base64
import os
import boto3

def handler(event: dict, context) -> dict:
    """Загрузка аудиофайла трека в S3-хранилище. Принимает base64-encoded файл и имя."""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    filename = body.get('filename')
    file_data = body.get('data')

    if not filename or not file_data:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'filename and data are required'}),
        }

    audio_bytes = base64.b64decode(file_data)

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    key = f'tracks/{filename}'
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=audio_bytes,
        ContentType='audio/mpeg',
        ACL='public-read',
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({'url': cdn_url, 'filename': filename}),
    }
