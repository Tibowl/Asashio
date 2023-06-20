#!/bin/sh

while :
do
  npm i
  npm run-script build
  npm start
done
