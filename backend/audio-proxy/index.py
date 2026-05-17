import os
import re
import base64
import urllib.request
import urllib.error

def handler(event: dict, context) -> dict:
    """Проксирование аудиофайла с Google Drive для воспроизведения в браузере."""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    file_id = params.get('id')

    if not file_id:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': 'Missing id parameter',
        }

    # Прямая ссылка на скачивание с Google Drive
    download_url = f'https://drive.google.com/uc?export=download&id={file_id}&confirm=t'

    req = urllib.request.Request(download_url, headers={
        'User-Agent': 'Mozilla/5.0',
    })

    with urllib.request.urlopen(req, timeout=25) as response:
        audio_data = response.read()

    audio_b64 = base64.b64encode(audio_data).decode('utf-8')

    return {
        'statusCode': 200,
        'isBase64Encoded': True,
        'headers': {
            **cors_headers,
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
        },
        'body': audio_b64,
    }
