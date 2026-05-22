FROM python:3.12.3

# not sure if this is right
WORKDIR /app

COPY Documentation/requirements.txt ./Documentation/
RUN pip install -r Documentation/requirements.txt

COPY . .

CMD ["python", "-m", "main.py"]
