from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow CORS

@app.route('/receive_text', methods=['POST'])
def receive_text():
    try:
        data = request.get_json()
        puretext = data.get('text', '')
        print(puretext)  # Print puretext to the console
        return jsonify({"status": "success", "text_received": puretext}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
