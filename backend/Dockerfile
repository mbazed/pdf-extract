# Use the official Python 3.11 Alpine image as the base image
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies required by pdfplumber
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    poppler-utils \
    && rm -rf /var/cache/apk/*

# Copy the requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Add a non-root user for security
RUN adduser -D myuser
USER myuser

# Copy the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]

# Optional: Add a health check (requires Docker version 17.05 or later)
HEALTHCHECK CMD curl --fail http://localhost:8080 || exit 1
