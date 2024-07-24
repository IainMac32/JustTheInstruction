from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import storage
import tensorflow as tf
import os
import numpy as np
from isolate import isolate

import zipfile

storage_client = storage.Client.from_service_account_json("./credentials.json")
bucket_name = 'just-the-instructions_model'

model_filename = 'Model2.zip'
model_path = f'.\{model_filename}'

# Download the model from Cloud Storage
bucket = storage_client.bucket(bucket_name)
blob = bucket.blob(model_filename)
try:
    blob.download_to_filename(model_path)
    print(f'Model downloaded to {model_path}')
except Exception as e:
    print(f'Error downloading the model: {e}')
    raise


# extract zip contents
with zipfile.ZipFile(model_path, "r") as zip_ref:
    zip_ref.extractall("Model2")


# Load the Keras model
try:
    model = tf.keras.models.load_model("./Model2/ClassifierModel3")
    print('Model loaded successfully.')
except Exception as e:
    print(f'Error loading the model: {e}')
    raise


app = Flask(__name__)
CORS(app)  # Allow CORS

@app.route('/test', methods=['GET', 'POST'])
def test_route():

    text = """An American omelette is fully cooked with a golden crust and fluffy texture – and, no surprise, much easier to make. The eggs are briefly scrambled in the pan and then left to set and develop a lightly golden crust. The omelet is then filled with cheese, meat, or vegetables and folded in half or thirds.
This is an American-style omelette (read: easy), but with a little French flair thanks to the creamy texture, good cheese, fresh herbs, and optional last-minute butter gloss. I keep it simple with just cheese, but feel free to add 1/4 cup of your favorite fillings; diced ham, bacon, breakfast sausage, smoked salmon, avocado, tomatoes, and cooked vegetables (like ratatouille) are all great options.
The Omelette Pan
It is essential to use a nonstick pan when making an omelette, as eggs like to stick. The size of the pan is also important, as it determines how thick or thin the base of your omelette will be. If the pan is too large, the eggs will spread too thin and dry out. For best results, use an 8-inch nonstick skillet (skillets are measured across the top) with sloping sides to make it easier to slide the omelette out of the skillet and onto a plate.

STEP-BY-STEP INSTRUCTIONS
In a medium bowl, combine the eggs with the water, a generous pinch of salt, and a few grinds of pepper. (Pro tip: Adding a bit of water makes a fluffier omelette.)Using a fork, beat vigorously until well combined and there are no visible egg whites. In a 8-inch nonstick skillet over medium-low heat, melt the butter and swirl to coat the whole surface of the pan. Add the eggs and let cook, undisturbed, until the eggs start to set around the edges. Once the eggs start to set, use a rubber spatula to move the cooked egg away from the edges, letting the raw egg run to the outside of the pan."""

    return jsonify(isolate(text, model))

@app.route('/receive_text', methods=['POST'])
def receive_text():
    try:
        data = request.get_json()
        puretext = data.get('text', '')
        res = isolate(puretext, model)
        print(res)
        return jsonify({"status": "success", "text_received": res}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))
