FROM python:3.14.0a2-alpine
WORKDIR /pyapp

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt --no-cache-dir

COPY . .

EXPOSE 5000

#CMD ["python", "main.py"]
CMD ["flask", "run", "--host=0.0.0.0"]

