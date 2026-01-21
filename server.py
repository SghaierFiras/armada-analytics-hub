#!/usr/bin/env python3
"""
Simple HTTP Server for Analytics Hub
Serves static files from current directory
"""
import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow local file access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to the directory where the script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    Handler = MyHTTPRequestHandler

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print(f"🚀 Analytics Hub Server Running")
        print("=" * 60)
        print(f"\n📊 Access your Analytics Hub at:")
        print(f"   http://localhost:{PORT}/ANALYTICS_HUB.html")
        print(f"\n📁 Serving files from:")
        print(f"   {os.getcwd()}")
        print(f"\n⚡ Press Ctrl+C to stop the server\n")
        print("=" * 60)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✋ Server stopped by user")
            print("=" * 60)

if __name__ == "__main__":
    main()
