import os
import sys
import subprocess
import argparse
import time
from loguru import logger

# Configure logger
logger.remove()
logger.add(sys.stdout, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}")

def run_command(cmd: list, name: str):
    """Run a command in background and log it"""
    logger.info(f"Starting {name}...")
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        logger.success(f"✅ {name} started (PID: {process.pid})")
        return process
    except Exception as e:
        logger.error(f"Failed to start {name}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="FinAi - Central App Control")
    parser.add_argument("--mode", choices=["all", "api", "chat", "dashboard", "worker", "setup"], 
                       default="all", help="What to start")
    args = parser.parse_args()

    processes = []

    print("\n" + "="*60)
    print("🚀 FinAi - Starting Application Components")
    print("="*60 + "\n")

    if args.mode in ["all", "setup"]:
        logger.info("Running setup tasks...")
        try:
            subprocess.run(["python", "scripts/setup_admin.py"], check=True)
            logger.success("Setup completed")
        except Exception as e:
            logger.warning(f"Setup script failed (may be already done): {e}")

    if args.mode in ["all", "api"]:
        processes.append(run_command(["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"], "FastAPI Backend"))

    if args.mode in ["all", "chat"]:
        processes.append(run_command(["python", "-m", "src.frontend.chat_ui"], "FinAi Chat UI"))

    if args.mode in ["all", "dashboard"]:
        processes.append(run_command(["streamlit", "run", "src/frontend/user_dashboard.py", "--server.port", "8503", "--server.address", "0.0.0.0"], "User Dashboard"))

    if args.mode in ["all", "worker"]:
        processes.append(run_command(["celery", "-A", "src.celery_app.tasks", "worker", "--loglevel=info", "--beat"], "Celery Worker"))

    print("\n" + "="*60)
    print("✅ All requested services started!")
    print("Press Ctrl+C to stop all services")
    print("="*60 + "\n")

    # Keep the script running and handle graceful shutdown
    try:
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        logger.info("Shutting down all services...")
        for p in processes:
            if p and p.poll() is None:
                p.terminate()
        logger.success("FinAi shutdown complete.")

if __name__ == "__main__":
    main()