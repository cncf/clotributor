# Build apiserver
FROM rust:1-alpine3.16 as builder
RUN apk --no-cache add musl-dev perl make
WORKDIR /clotributor
COPY Cargo.* ./
COPY clotributor-apiserver clotributor-apiserver
COPY clotributor-registrar/Cargo.* clotributor-registrar
COPY clotributor-tracker/Cargo.* clotributor-tracker
WORKDIR /clotributor/clotributor-apiserver
RUN cargo build --release

# Final stage
FROM alpine:3.16.3
RUN apk --no-cache add ca-certificates && addgroup -S clotributor && adduser -S clotributor -G clotributor
USER clotributor
WORKDIR /home/clotributor
COPY --from=builder /clotributor/target/release/clotributor-apiserver /usr/local/bin
