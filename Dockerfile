FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Fix PATH for pip-installed CLI tools (streamlit, etc.)
ENV PATH="${PATH}:/root/.local/bin"

# Create necessary directories
RUN mkdir -p data/raw_news data/processed_events data/backtests data/chroma_db logs

# Expose ports (Render mainly cares about $PORT)
EXPOSE 8000 7860 8501 8503

# Fallback CMD (Render will usually override this with dockerCommand)
CMD ["streamlit", "run", "src/frontend/user_dashboard.py", "--server.port=8501", "--server.address=0.0.0.0", "--server.headless=true"]
