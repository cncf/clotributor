# Build tern
FROM golang:1.23.2-alpine3.20 AS tern
RUN apk --no-cache add git
RUN go install github.com/jackc/tern@latest

# Build final image
FROM alpine:3.20.3
RUN addgroup -S clotributor && adduser -S clotributor -G clotributor
USER clotributor
WORKDIR /home/clotributor
COPY --from=tern /go/bin/tern /usr/local/bin
COPY database/migrations .
