#!/usr/bin/env python3
"""
라즈베리파이 TTS 서버
espeak을 사용하여 한국어 TTS를 제공하는 웹 서버
"""

import os
import tempfile
import subprocess
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # CORS 허용

@app.route('/api/tts', methods=['POST'])
def generate_tts():
    try:
        data = request.get_json()
        text = data.get('text', '')
        lang = data.get('lang', 'ko-KR')
        rate = data.get('rate', 0.8)
        pitch = data.get('pitch', 1.0)
        volume = data.get('volume', 0.9)
        
        if not text:
            return jsonify({'error': '텍스트가 없습니다'}), 400
        
        # 임시 오디오 파일 생성
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # espeak 명령어 구성
            # 한국어 설정
            if lang.startswith('ko'):
                voice = 'ko'
            else:
                voice = 'en'
            
            # espeak 실행
            cmd = [
                'espeak',
                '-v', voice,
                '-s', str(int(rate * 150)),  # 속도 (기본 150)
                '-p', str(int(pitch * 50)),  # 음높이 (기본 50)
                '-a', str(int(volume * 200)),  # 볼륨 (기본 200)
                '-w', temp_path,
                text
            ]
            
            print(f"TTS 명령어 실행: {' '.join(cmd)}")
            
            # espeak 실행
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"espeak 오류: {result.stderr}")
                return jsonify({'error': f'espeak 실행 실패: {result.stderr}'}), 500
            
            # 오디오 파일이 생성되었는지 확인
            if not os.path.exists(temp_path) or os.path.getsize(temp_path) == 0:
                return jsonify({'error': '오디오 파일 생성 실패'}), 500
            
            # 오디오 파일 반환
            return send_file(
                temp_path,
                mimetype='audio/wav',
                as_attachment=False,
                download_name='tts.wav'
            )
            
        except Exception as e:
            print(f"TTS 생성 오류: {str(e)}")
            return jsonify({'error': f'TTS 생성 실패: {str(e)}'}), 500
            
        finally:
            # 임시 파일 정리 (응답 후)
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except:
                pass
                
    except Exception as e:
        print(f"서버 오류: {str(e)}")
        return jsonify({'error': f'서버 오류: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    try:
        # espeak 설치 확인
        result = subprocess.run(['espeak', '--version'], capture_output=True, text=True)
        espeak_available = result.returncode == 0
        
        return jsonify({
            'status': 'ok',
            'espeak_available': espeak_available,
            'espeak_version': result.stdout.strip() if espeak_available else None
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("라즈베리파이 TTS 서버 시작...")
    print("espeak 설치 확인 중...")
    
    # espeak 설치 확인
    try:
        result = subprocess.run(['espeak', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"espeak 버전: {result.stdout.strip()}")
        else:
            print("경고: espeak이 설치되지 않았습니다.")
            print("설치 방법: sudo apt-get install espeak")
    except FileNotFoundError:
        print("경고: espeak을 찾을 수 없습니다.")
        print("설치 방법: sudo apt-get install espeak")
    
    # 서버 시작
    app.run(host='0.0.0.0', port=5000, debug=False)
