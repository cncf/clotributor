# Build registrar
FROM rust:1-alpine3.17 as builder
RUN apk --no-cache add musl-dev perl make
WORKDIR /clotributor
COPY Cargo.* ./
COPY clotributor-apiserver/Cargo.* clotributor-apiserver
COPY clotributor-registrar clotributor-registrar
COPY clotributor-tracker/Cargo.* clotributor-tracker
WORKDIR /clotributor/clotributor-registrar
RUN cargo build --release

# Final stage
FROM alpine:3.18.0
RUN apk --no-cache add ca-certificates && addgroup -S clotributor && adduser -S clotributor -G clotributor
USER clotributor
WORKDIR /home/clotributor
COPY --from=builder /clotributor/target/release/clotributor-registrar /usr/local/bin
