FROM python:3.12.3

# not sure if this is right
WORKDIR /app

COPY Cloud_development/ /app/Cloud_development/
COPY Scheduler/ /app/Scheduler/
COPY Documentation/ /app/Documentation/

COPY Documentation/container_requirements.txt ./Documentation/
RUN pip install --no-cache-dir -r Documentation/container_requirements.txt

COPY . .

EXPOSE 80

CMD ["uvicorn", "Cloud_development.main:app", "--host", "0.0.0.0", "--port", "80"]
