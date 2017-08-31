#!/bin/bash

cd test

sudo docker network create OMS
sudo sh test.sh pull
sudo sh test.sh build
sudo sh test.sh run testrunner npm install
sudo sh test.sh up -d
echo "Giving sometime to the registry for querying services"
sleep 20 # give some time for the registry to query other services
echo "Starting tests"
sudo sh test.sh up testrunner
