FROM python:3.12-slim

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy your application code
COPY . .

# Expose the port (default FastAPI/Gradio/Streamlit port)
EXPOSE 8000

# For FastAPI + Uvicorn (recommended for production API + landing page)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Alternative if using Gradio as landing page:
# CMD ["python", "app.py"]

# Alternative if using Streamlit as landing page:
# CMD ["streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
