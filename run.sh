#!/usr/bin/env bash

# Generate/normalize a name for the image
export IMAGE_NAME="$(id -u -n)/$(basename $(pwd) | tr -cd '[[:alnum:]]' | tr '[:upper:]' '[:lower:]')"

echo "${IMAGE_NAME}"

# If $PID is set then we know an instance of the container is running

if [ ! -z $PID ]; then
  docker stop $PID
fi

# Likewise for image name

export PID=$(docker ps --filter "ancestor=${IMAGE_NAME}" -q)

if [ ! -z $PID ]; then
  echo "Container exists, stopping."
  docker stop $PID
fi

docker build -t "${IMAGE_NAME}" .

export PID=$(docker run --restart always -p 3000:3000 -d -t "${IMAGE_NAME}")

echo "Tailing logs, press CTRL+C to exit..."

docker logs -f $PID
