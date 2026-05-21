FROM busybox:latest

WORKDIR /www

COPY index.html .
COPY css/ ./css/
COPY js/ ./js/
COPY vendor/ ./vendor/

RUN adduser -D appuser \
    && chown -R appuser:appuser /www

USER appuser

EXPOSE 3000

CMD ["busybox", "httpd", "-f", "-p", "3000", "-h", "/www"]