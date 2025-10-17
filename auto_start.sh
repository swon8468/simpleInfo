#!/bin/bash

# 라즈베리파이 자동 TTS 서버 시작 스크립트
echo "라즈베리파이 TTS 서버 자동 시작..."

# 필요한 패키지 설치 확인 및 설치
if ! command -v espeak &> /dev/null; then
    echo "espeak 설치 중..."
    sudo apt-get update
    sudo apt-get install -y espeak
fi

if ! command -v python3 &> /dev/null; then
    echo "Python3 설치 중..."
    sudo apt-get install -y python3 python3-pip
fi

# Python 패키지 설치
echo "Python 패키지 설치 중..."
pip3 install flask flask-cors --quiet

# 기존 TTS 서버 프로세스 종료
echo "기존 TTS 서버 종료 중..."
pkill -f tts_server.py

# 잠시 대기
sleep 2

# TTS 서버 시작 (백그라운드)
echo "TTS 서버 시작 중..."
python3 tts_server.py &
TTS_PID=$!

# 서버 시작 확인
sleep 3
if ps -p $TTS_PID > /dev/null; then
    echo "TTS 서버가 성공적으로 시작되었습니다. (PID: $TTS_PID)"
    echo "서버 주소: http://localhost:5000"
else
    echo "TTS 서버 시작에 실패했습니다."
    exit 1
fi

# 웹 브라우저 시작
echo "웹 브라우저 시작 중..."
chromium-browser --kiosk --no-sandbox --disable-web-security --user-data-dir=/tmp/chrome-temp http://localhost:5000 &

echo "설정 완료! 웹페이지에서 한국어 TTS를 사용할 수 있습니다."
