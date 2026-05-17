import json
import os
import boto3
from botocore.config import Config

def handler(event: dict, context) -> dict:
    """Генерация presigned URL для загрузки аудиофайла напрямую в S3."""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    try:
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body)
        filename = body.get('filename')

        if not filename:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'filename is required'}),
            }

        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            config=Config(signature_version='s3v4'),
        )

        key = f'tracks/{filename}'

        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': 'files',
                'Key': key,
                'ContentType': 'audio/mpeg',
            },
            ExpiresIn=300,
        )

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'upload_url': presigned_url, 'cdn_url': cdn_url}),
        }

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)}),
        }
