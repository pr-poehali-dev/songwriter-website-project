import json
import os
import base64
import boto3

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def handler(event: dict, context) -> dict:
    """Multipart-загрузка аудиофайла в S3. Действия: start, upload_part, complete."""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    try:
        raw_body = event.get('body') or '{}'
        if event.get('isBase64Encoded') and raw_body:
            raw_body = base64.b64decode(raw_body).decode('utf-8')
        body = json.loads(raw_body)

        action = body.get('action')
        s3 = get_s3()
        bucket = 'files'

        # --- Шаг 1: начать загрузку ---
        if action == 'start':
            filename = body.get('filename')
            if not filename:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'filename required'})}

            key = f'tracks/{filename}'
            resp = s3.create_multipart_upload(Bucket=bucket, Key=key, ContentType='audio/mpeg')
            upload_id = resp['UploadId']

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'upload_id': upload_id, 'key': key}),
            }

        # --- Шаг 2: загрузить одну часть ---
        elif action == 'upload_part':
            key = body.get('key')
            upload_id = body.get('upload_id')
            part_number = body.get('part_number')
            data_b64 = body.get('data')

            if not all([key, upload_id, part_number, data_b64]):
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'missing fields'})}

            part_data = base64.b64decode(data_b64)
            resp = s3.upload_part(
                Bucket=bucket,
                Key=key,
                UploadId=upload_id,
                PartNumber=part_number,
                Body=part_data,
            )
            etag = resp['ETag']

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'etag': etag, 'part_number': part_number}),
            }

        # --- Шаг 3: завершить загрузку ---
        elif action == 'complete':
            key = body.get('key')
            upload_id = body.get('upload_id')
            parts = body.get('parts')  # [{part_number, etag}, ...]

            if not all([key, upload_id, parts]):
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'missing fields'})}

            s3.complete_multipart_upload(
                Bucket=bucket,
                Key=key,
                UploadId=upload_id,
                MultipartUpload={
                    'Parts': [{'PartNumber': p['part_number'], 'ETag': p['etag']} for p in parts]
                },
            )

            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'url': cdn_url}),
            }

        else:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'unknown action'})}

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)}),
        }
