import json
import os
import re
import base64
import boto3

def parse_multipart(body_bytes: bytes, boundary: bytes):
    """Парсит multipart/form-data и возвращает dict полей."""
    parts = body_bytes.split(b'--' + boundary)
    fields = {}
    for part in parts:
        if b'Content-Disposition' not in part:
            continue
        header_end = part.find(b'\r\n\r\n')
        if header_end == -1:
            continue
        headers_raw = part[:header_end].decode('utf-8', errors='ignore')
        data = part[header_end + 4:]
        if data.endswith(b'\r\n'):
            data = data[:-2]
        name_match = re.search(r'name="([^"]+)"', headers_raw)
        if name_match:
            fields[name_match.group(1)] = data
    return fields

def handler(event: dict, context) -> dict:
    """Загрузка аудиофайла в S3 через multipart/form-data."""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    try:
        content_type = ''
        for k, v in (event.get('headers') or {}).items():
            if k.lower() == 'content-type':
                content_type = v
                break

        body_raw = event.get('body') or ''
        if event.get('isBase64Encoded') and body_raw:
            body_bytes = base64.b64decode(body_raw)
        else:
            body_bytes = body_raw.encode('latin-1') if isinstance(body_raw, str) else body_raw

        boundary_match = re.search(r'boundary=([^\s;]+)', content_type)
        if not boundary_match:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Expected multipart/form-data'})}

        boundary = boundary_match.group(1).encode()
        fields = parse_multipart(body_bytes, boundary)

        filename_bytes = fields.get('filename')
        file_bytes = fields.get('file')

        if not filename_bytes or file_bytes is None:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': f'Missing fields, got: {list(fields.keys())}'})}

        filename = filename_bytes.decode('utf-8').strip()

        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )

        key = f'tracks/{filename}'
        s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType='audio/mpeg')

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'url': cdn_url, 'size': len(file_bytes)}),
        }

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}
