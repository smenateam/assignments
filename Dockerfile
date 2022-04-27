FROM python:3.6-alpine3.11

RUN mkdir -p /app/src/

RUN apk add --update --no-cache \
     # Common
     gcc libffi-dev musl-dev \
     # Pillow
     jpeg-dev zlib-dev \
     # Postgres
     postgresql-dev gdal-dev geos-dev \
     # Wkhtmltopdf
     wkhtmltopdf \
     xvfb

# install wkhtmltopdf dependencies
RUN apk add --update ca-certificates openssl && update-ca-certificates

COPY Pipfile* /app/
RUN cd /app/ && \
 pip install pipenv && \
 pipenv install --system --deploy --ignore-pipfile

COPY src /app/src/
WORKDIR /app/src/

CMD ["gunicorn", "-w", "3", "--bind", ":8000", "config.wsgi:application"]