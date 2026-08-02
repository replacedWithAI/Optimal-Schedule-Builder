FROM python:3.12.3

# not sure if this is right
WORKDIR /app

COPY Documentation/container_requirements.txt ./Documentation/
RUN pip install -r Documentation/requirements.txt

COPY . .

EXPOSE 80

CMD ["uvicorn", "Cloud_development.main:app", "--host", "0.0.0.0", "--port", "80", \
     --limit-max-body-size ]
