from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/receive_text', methods=['POST'])
def receive_text():
    data = request.get_json()
    puretext = data.get('text', '')
    print(puretext)  # Print puretext to the console
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
