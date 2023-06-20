#!/bin/sh

while :
do
  git reset --hard
  git pull
  npm i
  npm run-script build
  npm start
done
