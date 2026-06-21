import http.server
import socketserver
import requests
import json

# --- CONFIGURATION ---
API_URL = "http://localhost:8000/api/users/whatsapp-qr"  # Your backend URL
JWT_TOKEN = ""                      # Your actual JWT
PORT = 8050                                              # Port to view the web page

class QRHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # 1. Fetch data from your backend API
            headers = {
                "Authorization": f"Bearer {JWT_TOKEN}",
                "Accept": "application/json"
            }

            base64_image = ""
            error_message = ""

            try:
                response = requests.get(API_URL, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()

                # Extract the base64 string (handles nested structure or raw string)
                if isinstance(data, dict):
                    # Tries to find it if nested under 'qrcode' -> 'base64'
                    base64_image = data.get("qrcode", {}).get("base64", "") if isinstance(data.get("qrcode"), dict) else data.get("base64", "")
                    if not base64_image:
                        # Fallback if the whole object is just a string map
                        base64_image = data.get("qrcode", "") or data.get("code", "")
                else:
                    error_message = f"Unexpected JSON format: {data}"

                # Clean up data URI prefix if present
                if base64_image and "," in base64_image:
                    base64_image = base64_image.split(",")[-1]

            except Exception as e:
                error_message = f"Error fetching QR code: {str(e)}"

            # 2. Build the HTML Page
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()

            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>WhatsApp QR Scanner</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; background: #f0f2f5; margin: 40px; }}
                    .card {{ background: white; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
                    h2 {{ color: #128c7e; margin-top: 0; }}
                    img {{ max-width: 250px; border: 1px solid #ddd; padding: 10px; background: white; border-radius: 4px; }}
                    .error {{ color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 8px; font-weight: bold; }}
                    ol {{ text-align: left; font-size: 14px; color: #555; padding-left: 20px; line-height: 1.5; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Link WhatsApp Number</h2>
                    {f'<p class="error">{error_message}</p>' if error_message else f'''
                    <p>Scan this QR code with your phone's WhatsApp application:</p>
                    <img src="data:image/png;base64,{base64_image}" alt="WhatsApp QR Code" />
                    '''}
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <ol>
                        <li>Open WhatsApp on your phone.</li>
                        <li>Tap <b>Menu</b> or <b>Settings</b>.</li>
                        <li>Select <b>Linked Devices</b>.</li>
                        <li>Tap <b>Link a Device</b> and point your camera here.</li>
                    </ol>
                </div>
            </body>
            </html>
            """
            self.wfile.write(html_content.encode('utf-8'))
        else:
            # Handle favicon or other asset paths gracefully
            self.send_error(404, "Not Found")

# Run the server
if __name__ == "__main__":
    # Ensure requests is installed
    try:
        import requests
    except ImportError:
        print("Required 'requests' module not found. Install it by running: pip install requests")
        exit(1)

    with socketserver.TCPServer(("", PORT), QRHandler) as httpd:
        print(f"🚀 Dashboard running! Open your browser and go to: http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
