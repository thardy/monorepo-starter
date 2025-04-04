#!/bin/sh
context=$(kubectl config current-context)
if [ "$context" != "docker-desktop" ]; then
    echo "***************** Wrong context!!! Use docker-desktop *****************"
    exit 1
fi 