# Use official Python base
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose the port Flask will run on
EXPOSE 8080

# Set entrypoint
CMD ["python", "api.py"]
