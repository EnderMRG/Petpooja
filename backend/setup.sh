#!/usr/bin/env bash

# Exit on error
set -o errexit

# Update apt and install ffmpeg (required for Whisper STT)
apt-get update
apt-get install -y ffmpeg

# Install python dependencies
pip install -r backend/requirements.txt
