import tensorflow as tf
import numpy as np

import re

def get_sentences(plaintext):
    # Use regular expressions to split the text at sentence-ending punctuation followed by a space or end of string
    sentences = re.split(r'(?<=[.!?]) +', plaintext.strip())
    
    # Return the list of sentences, stripping any leading/trailing whitespace
    return [sentence.strip() for sentence in sentences if sentence]



def isolate(text, model):
  sentences = get_sentences(text)
  print(sentences)
  threshold = 0.78 # we can play around with this if it is including too much or not enough

  res = ""
  confidence = 0

  print('STEP 1 **************')
  # STEP 1: find where the procedure begins
  i = 0
  while i < len(sentences):
    entry = np.array([sentences[i]])
    prediction = model.predict(entry)
    print(sentences[i])
    print(prediction)
    if prediction[0][0] >= threshold:
      res += sentences[i] + " "
      confidence = prediction[0][0]
      i+=1
    else:
      i+=1
  print("END STEP 1 ************")
  res = res[:len(res)-1]  # check that we actually found something
  if res == "":
    return "NO INSTRUCTIONS WERE FOUND"

  print('STEP 2 **************')
  # STEP 2: go through the remaining sentences until the confidence decreases
  
  for j in range(i, len(sentences)):
    current = res + sentences[j]
    entry = np.array([current])
    prediction = model.predict(entry)
  

    
    print('*********')
    print(current)
    print("Confidence:", confidence, "... Prediction:", prediction[0][0])
    print('*********')
    

    buffer = 0.03 # we will have to play with this buffer value
    if prediction[0][0] >= confidence - buffer:
      res = current
      confidence = prediction[0][0]
    else:
      break
  print("END STEP 2 ***************")
  

  return res