# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV APP_HOME=/app

# Set the working directory in the container
WORKDIR $APP_HOME

# Install necessary system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && apt-get clean

# Upgrade pip to the latest version
RUN pip install --no-cache-dir --upgrade pip

# Copy the current directory contents into the container at /app
COPY . $APP_HOME

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variable for Google Cloud credentials
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["python", "api.py"]
