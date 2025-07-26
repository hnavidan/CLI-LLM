FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the main script and llm_providers folder
COPY app.py .
COPY llm_providers/ llm_providers/

# Expose the port (adjust if different)
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]
