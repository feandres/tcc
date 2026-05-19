FROM busybox:latest
WORKDIR /www
COPY index.html .
COPY vendor/ ./vendor/
EXPOSE 3000
CMD ["busybox", "httpd", "-f", "-p", "3000", "-h", "/www"]

