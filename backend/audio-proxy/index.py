import base64
import json
import urllib.request

def handler(event: dict, context) -> dict:
    """Проксирование аудиофайла с Яндекс.Диска для воспроизведения в браузере."""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    public_key = params.get('key')

    if not public_key:
        return {'statusCode': 400, 'headers': cors_headers, 'body': 'Missing key parameter'}

    try:
        # Шаг 1: получаем прямую ссылку через Яндекс API
        api_url = f'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key={urllib.request.quote(public_key, safe="")}'
        req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        download_url = data['href']

        # Шаг 2: скачиваем файл
        req2 = urllib.request.Request(download_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req2, timeout=25) as r:
            audio_data = r.read()

        audio_b64 = base64.b64encode(audio_data).decode('utf-8')

        return {
            'statusCode': 200,
            'isBase64Encoded': True,
            'headers': {
                **cors_headers,
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=3600',
            },
            'body': audio_b64,
        }

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}
