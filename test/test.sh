#!/bin/bash


export $(cat .env | grep -v ^# | xargs)

docker-compose -f docker-compose.yml -f ../docker/docker-compose.yml ${@}