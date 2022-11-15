# Build tern
FROM golang:1.19.3-alpine3.16 AS tern
RUN apk --no-cache add git
RUN go install github.com/jackc/tern@latest

# Build final image
FROM alpine:3.16.2
RUN addgroup -S cloradar && adduser -S cloradar -G cloradar
USER cloradar
WORKDIR /home/cloradar
COPY --from=tern /go/bin/tern /usr/local/bin
COPY database/migrations .
