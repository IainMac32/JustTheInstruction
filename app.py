import tensorflow as tf
import tf2onnx
import onnx

# Load the Sequential model
seq_model = tf.keras.models.load_model("InstructionsClassifier2025.keras")

# Wrap in functional API to avoid output_names error
inputs = tf.keras.Input(shape=seq_model.input_shape[1:], name="input")
outputs = seq_model(inputs)
model = tf.keras.Model(inputs=inputs, outputs=outputs)

# Convert to ONNX
spec = (tf.TensorSpec(model.input_shape, tf.float32, name="input"),)
onnx_model, _ = tf2onnx.convert.from_keras(
    model,
    input_signature=spec,
    opset=13,
    output_path="InstructionsClassifier2025.onnx"
)

print("✅ ONNX model exported successfully!")
