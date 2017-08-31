#!/bin/bash

docker-compose -f docker-compose.yml -f ../docker/docker-compose.yml ${@}