import tensorflow as tf
import numpy as np

def isolate(text, model):
  sentences = text.split('.')
  threshold = 0.9 # we can play around with this if it is including too much or not enough

  res = ""
  confidence = 0

  # STEP 1: find where the procedure begins
  i = 0
  while i < len(sentences):
    entry = np.array([sentences[i]])
    prediction = model.predict(entry)
    if prediction[0][0] >= threshold:
      res = sentences[i]
      confidence = prediction[0][0]
      i+=1
      break
    else:
      i+=1

  # STEP 2: check that we actually found something
  if res == "":
    return "NO INSTRUCTIONS WERE FOUND"

  # STEP 3: go through the remaining sentences until the confidence decreases
  for j in range(i, len(sentences)):
    current = res + sentences[j]
    entry = np.array([current])
    prediction = model.predict(entry)

    """
    print('*********')
    print(current)
    print("Confidence:", confidence, "... Prediction:", prediction[0][0])
    print('*********')
    """

    buffer = 0.03 # we will have to play with this buffer value
    if prediction[0][0] >= confidence - buffer:
      res = current
      confidence = prediction[0][0]
    else:
      break

  return res