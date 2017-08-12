#!/bin/bash

#docker login

docker build -t omsserviceregistry -f Dockerfile.dev .
docker tag omsserviceregistry aegee/omsserviceregistry:dev
docker push aegee/omsserviceregistry:dev