from google.cloud import storage
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
from isolate import isolate


# Initialize the Google Cloud Storage client
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


import zipfile

with zipfile.ZipFile(model_path, "r") as zip_ref:
    zip_ref.extractall("Model2")


# Load the Keras model
try:
    model = tf.keras.models.load_model("./Model2/ClassifierModel3")
    print('Model loaded successfully.')
except Exception as e:
    print(f'Error loading the model: {e}')
    raise


# POSSIBLE ENTRIES
# 1 (RECIPES)
not_instructions = "Banana Banana Bread.This banana bread recipe creates the most delicious. moist loaf with loads of banana flavor. Why compromise the banana flavor? Friends and family love my recipe and say it's by far the best! It tastes wonderful toasted. Enjoy!Submitted by Shelley Albeluhn  Updated on November 13, 2023  1 hr Total Time:1 hr 15 mins Servings: 12 Yield: 1  (9x5-inch) loaf Jump to Nutrition Facts Our most popular banana bread is moist, delicious, and absolutely packed with banana flavor. This Allrecipes community favorite will quickly become your go-to banana bread recipe! Banana Bread Ingredients You likely already have all the ingredients you'll need for this banana bread recipe on hand. If not, here's what to add to your grocery list: Flour: All-purpose flour gives the banana bread structure. Baking soda: Baking soda acts as a leavener, which means it helps the banana bread rise. Salt: A pinch of salt enhances the overall flavor, but it won't make the loaf taste salty. Butter: A stick of butter lends richness, moisture, and irresistible flavor Brown sugar: Brown sugar sweetens things up and adds a hint of warmth. Eggs: Eggs act as a binding agent, which means they hold the batter together. Bananas: Of course, you'll need bananas! Choose overripe bananas."
instructions = "Directions: Preheat the oven to 350 degrees F (175 degrees C). Lightly grease a 9x5-inch loaf pan. Combine flour, baking soda, and salt in a large bowl. Beat brown sugar and butter with an electric mixer in a separate large bowl until smooth. Stir in eggs and mashed bananas until well blended. Stir banana mixture into flour mixture until just combined. Pour batter into the prepared loaf pan. Bake in the preheated oven until a toothpick inserted into the center comes out clean, about 60 minutes. Let bread cool in a pan for 10 minutes, then turn out onto a wire rack to cool completely."
mix_half = "Directions: Preheat the oven to 350 degrees F (175 degrees C). Lightly grease a 9x5-inch loaf pan. Combine flour, baking soda, and salt in a large bowl. Beat brown sugar and butter with an electric mixer in a separate large bowl until smooth. Stir in eggs and mashed bananas until well blended. Banana Banana BreadThis banana bread recipe creates the most delicious, moist loaf with loads of banana flavor. Why compromise the banana flavor? Friends and family love my recipe and say it's by far the best! It tastes wonderful toasted. Enjoy!"
mix_less_instructions = "Stir in eggs and mashed bananas until well blended. Stir banana mixture into flour mixture until just combined.Banana Banana BreadThis banana bread recipe creates the most delicious, moist loaf with loads of banana flavor. Why compromise the banana flavor? Friends and family love my recipe and say it's by far the best! It tastes wonderful toasted. Enjoy!"
# 2 (DIY)
not_instructions2 = "I think wallets should be cooler and shouldn't deteriorate! I've had a leather wallet for ages, and I've noticed the signs of wear and tear over the years, so I wanted to make something extremely durable that also looks cool. I am a college student that has access to a bunch of fancy machinery, but this wallet can also be 3D printed, made with a bandsaw, water jet, etc. It is essentially a couple of flat pieces of metal Disclaimer: I originally set out to design a completely new design, but after doing some research, I found the Ridge wallet. The design work I did was to recreate the design based on images and some guesswork, and design it with the intent of laser cutting all the parts."
instructions2 = "Step 1: After looking at some references, I began designing the wallet. I began with modeling a credit card so I could reference it later in the design, as a way to sort of check myself along the process. I looked up the dimensions for a credit card and added a fillet to the credit card. Next, I did an offset, since I wanted my wallet to be slightly larger than the credit card, and so the wallet would keep the general shape of the credit card. I added a circle cut out in the corner, which exists so that it's easier to push credit cards out. This rectangle will be the basis for the outer layers. Based on that, I started to create the inner part of the wallet. It is supposed to be a shape where a cutout for the elastic band can go. I made a T-Shape cutout the thickness of my elastic band, since the idea is that the elastic band keeps the wallet closed and cards from falling out. I also made it slightly larger to allow for some tolerance. I then added holes for my M3 screws to go through. Each of the 3 inner parts needs two holes, so that it is properly constrained and won't rotate when assembled. The holes are slightly smaller than M3 so they can sort of self-thread in. I checked against my model of the credit card and realized that the wallet was larger than I wanted it to be, so I went back in the history browser and decreased the offset. I also went back and changed the dimensions of my T-Shape cutout, since I realized that my elastic band was .75\" rather than 1\", which I originally assumed it was. I imported an SVG image of something I wanted to engrave on a sketch and added it to my model. These 4 parts (The outer face, the 3 inner parts) are all the CAD that needs to be done, since the wallet is created with only these 4 parts, just with 4 copies of the out part, and 2 copies of each inner part. (If you only have a 3D printer, you can go ahead and print this part twice and go to step 5 then 8)"

# Test the model with input data
entry = np.array([not_instructions2])  # Replace with appropriate entry for testing

# Make a prediction using the loaded model
prediction = model.predict(entry)
print(prediction[0][0])


text = """An American omelette is fully cooked with a golden crust and fluffy texture – and, no surprise, much easier to make. The eggs are briefly scrambled in the pan and then left to set and develop a lightly golden crust. The omelet is then filled with cheese, meat, or vegetables and folded in half or thirds.
This is an American-style omelette (read: easy), but with a little French flair thanks to the creamy texture, good cheese, fresh herbs, and optional last-minute butter gloss. I keep it simple with just cheese, but feel free to add 1/4 cup of your favorite fillings; diced ham, bacon, breakfast sausage, smoked salmon, avocado, tomatoes, and cooked vegetables (like ratatouille) are all great options.
The Omelette Pan
It is essential to use a nonstick pan when making an omelette, as eggs like to stick. The size of the pan is also important, as it determines how thick or thin the base of your omelette will be. If the pan is too large, the eggs will spread too thin and dry out. For best results, use an 8-inch nonstick skillet (skillets are measured across the top) with sloping sides to make it easier to slide the omelette out of the skillet and onto a plate.

STEP-BY-STEP INSTRUCTIONS
In a medium bowl, combine the eggs with the water, a generous pinch of salt, and a few grinds of pepper. (Pro tip: Adding a bit of water makes a fluffier omelette.)Using a fork, beat vigorously until well combined and there are no visible egg whites. In a 8-inch nonstick skillet over medium-low heat, melt the butter and swirl to coat the whole surface of the pan. Add the eggs and let cook, undisturbed, until the eggs start to set around the edges. Once the eggs start to set, use a rubber spatula to move the cooked egg away from the edges, letting the raw egg run to the outside of the pan."""

text2 = """
STEP-BY-STEP INSTRUCTIONS
In a medium bowl, combine the eggs with the water, a generous pinch of salt, and a few grinds of pepper. (Pro tip: Adding a bit of water makes a fluffier omelette.)Using a fork, beat vigorously until well combined and there are no visible egg whites. In a 8-inch nonstick skillet over medium-low heat, melt the butter and swirl to coat the whole surface of the pan. Add the eggs and let cook, undisturbed, until the eggs start to set around the edges. Once the eggs start to set, use a rubber spatula to move the cooked egg away from the edges, letting the raw egg run to the outside of the pan.
An American omelette is fully cooked with a golden crust and fluffy texture – and, no surprise, much easier to make. The eggs are briefly scrambled in the pan and then left to set and develop a lightly golden crust. The omelet is then filled with cheese, meat, or vegetables and folded in half or thirds.
This is an American-style omelette (read: easy), but with a little French flair thanks to the creamy texture, good cheese, fresh herbs, and optional last-minute butter gloss. I keep it simple with just cheese, but feel free to add 1/4 cup of your favorite fillings; diced ham, bacon, breakfast sausage, smoked salmon, avocado, tomatoes, and cooked vegetables (like ratatouille) are all great options.
The Omelette Pan
It is essential to use a nonstick pan when making an omelette, as eggs like to stick. The size of the pan is also important, as it determines how thick or thin the base of your omelette will be. If the pan is too large, the eggs will spread too thin and dry out. For best results, use an 8-inch nonstick skillet (skillets are measured across the top) with sloping sides to make it easier to slide the omelette out of the skillet and onto a plate.
"""
print("&&&&&&&&&&&&&&&&&&")
print(isolate(text, model))
print("&&&&&&&&&&&&&&&&")
