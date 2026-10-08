import http.server
import socketserver
import json

class MyHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        
        try:
            data = json.loads(post_body.decode('utf-8'))
            with open('tools/datasets/tbbt_max_links.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print("Successfully received", len(data), "links and saved to tbbt_max_links.json!")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')
        except Exception as e:
            print("Error parsing:", e)
            self.send_response(500)
            self.end_headers()
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

with socketserver.TCPServer(("", 5000), MyHandler) as httpd:
    print("Serving at port 5000. Waiting for POST request...")
    httpd.handle_request() # wait for just one request
    httpd.server_close()
    print("Server closed.")
