#!/bin/bash

echo "라즈베리파이 TTS 서버 설정 시작..."

# 필요한 패키지 설치
echo "1. 필요한 패키지 설치 중..."
sudo apt-get update
sudo apt-get install -y espeak python3 python3-pip

# Python 패키지 설치
echo "2. Python 패키지 설치 중..."
pip3 install flask flask-cors

# TTS 서버 실행
echo "3. TTS 서버 시작 중..."
echo "서버가 http://localhost:5000 에서 실행됩니다."
echo "종료하려면 Ctrl+C를 누르세요."

python3 tts_server.py
