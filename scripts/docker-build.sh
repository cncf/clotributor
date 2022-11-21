#!/bin/sh

# apiserver
docker build \
    -f clotributor-apiserver/Dockerfile \
    -t clotributor/apiserver \
.

# registrar
docker build \
    -f clotributor-registrar/Dockerfile \
    -t clotributor/registrar \
.

# tracker
docker build \
    -f clotributor-tracker/Dockerfile \
    -t clotributor/tracker \
.

