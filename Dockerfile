FROM python:3.12-slim

# Install system dependencies (ffmpeg required by Whisper)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt ./backend/

# Install python packages
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the entire backend directory
COPY backend/ ./backend/

# Start the application
CMD cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
