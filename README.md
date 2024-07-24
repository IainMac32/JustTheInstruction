<style>
  .centered {
    text-align: center;
  }
  .title {
    font-size: 1.5em;
    text-decoration: underline;
  }
</style>

# JustTheInstruction Chrome Extension



## :bulb: Project Description


### Objectives
1. 




## Tech Stack

- **Frontend Framework:**
  - Chrome Extension:  


<div class="centered">
  <div class="title">Backend Framework</div>
  <p>
    <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python" />
    <img src="https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white" alt="TensorFlow" />
    <img src="https://img.shields.io/badge/Flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  </p>
  <div>Data Processing:</div>
  <p>
    <img src="https://img.shields.io/badge/Pandas-%23150458.svg?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas" />
    <img src="https://img.shields.io/badge/NumPy-013243.svg?style=for-the-badge&logo=numpy&logoColor=white" alt="NumPy" />
    <img src="https://img.shields.io/badge/BeautifulSoup-3776AB.svg?style=for-the-badge&logo=beautifulsoup&logoColor=white" alt="Beautiful Soup" />
  </p>
  <div>Hosting & Deployment Tools:</div>
  <p>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/Google%20Cloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud" />
    <img src="https://img.shields.io/badge/Google%20Cloud%20Run-4285F4.svg?style=for-the-badge&logo=googlecloudrun&logoColor=white" alt="Google Cloud Run" />
  </p>
</div>





## Training the Model
### https://colab.research.google.com/drive/1k1D4zRW0nFicjkS-KqtCVW3y4mn8qSJR?usp=sharing
We used a variety of sources to collect training data for our model. Ultimately, we were able to gain entries for many categories of instructions including recipes, crafts, circuits, and other DIYs!

While many entries were collected from a public Kaggle dataset, we also did our own data scraping using the python library, Beautiful Soup. To learn more about how we did this, click the link to view our google colab file that documents the data scraping process. 

## Using the Model
### Direct to /api/isolate.py
Given plaintext, we use the model to idetify only the section of the text that includes procedural writing (instructions), and isolate it from the surrounding irrelevant text. This was done by parsing the text into individual sentences. We then parsed through the individual sentences until the model predicted a value greater than our tested threshold value. This then marked the start of the instructions section. The model would then continue to append sentences to the section, until a significant decrease in prediction was noticed; thus marking the end of the instructions section. Ultimately, isolate.py utilizes the model efficiently to extract only the valuable information from a website's text!

