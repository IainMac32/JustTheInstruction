// Import ONNX Runtime Web
import * as ort from "onnxruntime-web";

// Dictionary to map model output indices to labels (you may need to adjust these based on your model's classes)
const OUTPUT_CLASSES = {
  0: "not_instruction",
  1: "instruction",
};

class ModelService {
  constructor() {
    this.session = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Load the ONNX model
      this.session = await ort.InferenceSession.create("./model.onnx");
      this.initialized = true;
      console.log("Model loaded successfully");
    } catch (error) {
      console.error("Error loading the model:", error);
      throw error;
    }
  }

  // Preprocess text input
  preprocessText(text) {
    // Convert to lowercase and remove special characters
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Create tensor from input text
  createTensor(text) {
    // Convert text to tensor format
    const preprocessedText = this.preprocessText(text);
    return new ort.Tensor("string", [preprocessedText], [1]);
  }

  async predict(text) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Create input tensor
      const inputTensor = this.createTensor(text);

      // Run inference
      const feeds = { text_vectorization_input: inputTensor };
      const results = await this.session.run(feeds);

      // Get the output
      const output = results[Object.keys(results)[0]];
      const predictions = Array.from(output.data);

      // Get the predicted class (highest probability)
      const predictedClass = predictions.indexOf(Math.max(...predictions));

      return {
        class: OUTPUT_CLASSES[predictedClass],
        probability: predictions[predictedClass],
        allProbabilities: predictions,
      };
    } catch (error) {
      console.error("Error during prediction:", error);
      throw error;
    }
  }

  // Split text into sentences
  splitIntoSentences(text) {
    // Split on periods followed by spaces or newlines, but keep the period
    return text
      .split(/(?<=\.)\s+/)
      .filter((sentence) => sentence.trim().length > 0)
      .map((sentence) => sentence.trim());
  }

  // Predict with threshold based on sentence-level analysis
  async predictWithThreshold(text, threshold = 0.6) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Split text into sentences
      const sentences = this.splitIntoSentences(text);

      // Get predictions for each sentence
      const predictions = await Promise.all(
        sentences.map(async (sentence) => {
          const result = await this.predict(sentence);
          return {
            sentence,
            probability: result.probability,
            isInstruction: result.class === "instruction",
          };
        })
      );

      // Calculate average probability of being an instruction
      const avgProbability =
        predictions.reduce(
          (sum, p) => sum + (p.isInstruction ? p.probability : 0),
          0
        ) / predictions.length;

      return {
        isInstructional: avgProbability > threshold,
        avgProbability,
        sentences: predictions,
      };
    } catch (error) {
      console.error("Error during threshold prediction:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const modelService = new ModelService();
