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

# Build frontend
FROM node:16-alpine3.16 AS frontend-builder
WORKDIR /web
COPY web .
ENV NODE_OPTIONS=--max_old_space_size=4096
WORKDIR /web/clo-ui
RUN yarn install
RUN yarn build
WORKDIR /web
RUN yarn install
RUN yarn build

# Final stage
FROM alpine:3.17.1
RUN apk --no-cache add ca-certificates && addgroup -S clotributor && adduser -S clotributor -G clotributor
USER clotributor
WORKDIR /home/clotributor
COPY --from=builder /clotributor/target/release/clotributor-apiserver /usr/local/bin
COPY --from=frontend-builder /web/build ./web/build
COPY --from=frontend-builder /web/package.json ./web
