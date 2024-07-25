# JustTheInstruction Chrome Extension

## :bulb: Project Description

Isn't it the worst when you find a recipe online, but need to scroll down for what feels like hours to find the actual instructions? We too have been bothered by this issue and began to think of a solution. What if we could use AI to extract ***JustTheInstructions*** from any recipe, arts & crafts, or other DIY website?

Well, we built and trained an AI model to do just that, and the power of this tool is one click away thanks to our Google Chrome Extension!

### Project Objectives
1. Build a binary text classification model using TensorFlow.
2. Scrape training data that covers a variety of instruction categories.
3. Develop a Google Chrome extension that automatically reads an entire website and promptly provides the user with ***JustTheInstructions***.

## :computer: Tech Stack

<div style="text-align: center;">
  <div style="font-size: 2em; font-weight: bold; text-decoration: underline; margin-bottom: 10px;">Frontend Framework</div>
  <div style="font-size: 2em; font-weight: bold; text-decoration: underline; margin-bottom: 10px;">Backend Framework:</div>
  <p>
    <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python" />
    <img src="https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white" alt="TensorFlow" />
    <img src="https://img.shields.io/badge/Flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  </p>
    <div style="font-size: 1.5em; font-weight: bold;">Data Processing:</div>
    <p>
      <img src="https://img.shields.io/badge/Pandas-%23150458.svg?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas" />
      <img src="https://img.shields.io/badge/NumPy-013243.svg?style=for-the-badge&logo=numpy&logoColor=white" alt="NumPy" />
      <img src="https://img.shields.io/badge/BeautifulSoup-3776AB.svg?style=for-the-badge&logo=beautifulsoup&logoColor=white" alt="Beautiful Soup" />
    </p>
    <div style="font-size: 1.5em; font-weight: bold;">Hosting & Deployment Tools:</div>
    <p>
      <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
      <img src="https://img.shields.io/badge/Google%20Cloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud" />
      <img src="https://img.shields.io/badge/Google%20Cloud%20Run-4285F4.svg?style=for-the-badge&logo=googlecloudrun&logoColor=white" alt="Google Cloud Run" />
    </p>
  </div>
</div>




## :wrench: Model Architecture & Training the Model

*Note: We built and trained our model on google colab!*

We decided to build an LSTM neural network using TensorFlow. The model performs binary text classification and is able to predict if text is "instructions" or is "not instructions". Click the following link to see the documented process. 
**https://colab.research.google.com/drive/1nkqleu9FP2pN5D40q1NK_xuyOvsKG7vy?usp=sharing**

We used a variety of sources to collect training data for our model. Categories of sites we wanted the model to be able to determine include recipes, crafts, circuits, and other DIYs.

While many entries were collected from a public Kaggle dataset, we also did our own data scraping using the python library, **Beautiful Soup**. We were able to scrape ***over 1000 unique entries for each of the mentioned categories!*** To learn more about how we did this, click the link to view our google colab file that documents the data scraping process.
**https://colab.research.google.com/drive/1k1D4zRW0nFicjkS-KqtCVW3y4mn8qSJR?usp=sharing**


## :mag: Using the Model
### You can find the isolate function in the [isolate.py](./api/isolate.py) file located in the `api` directory.

Given plaintext, we use the model to idetify only the section of the text that includes procedural writing (instructions), and isolate it from the surrounding irrelevant text. This was done by first splitting the website's plaintext into individual sentences. We then parsed through the individual sentences until the model predicted a value greater than our experimentally determined threshold value which markes the start of the instructions section. The isolate function then continues to append sentences to the section and have the model make a prediction. When a significant decrease in prediction was noticed (identified by the prediction of the previous section minus an experimentally determined buffer value), this marks the end of the instructions section. This section, consisting of ***JustTheInstructions***, is then returned to the user. 
