#!/usr/bin/env bash

CI_COMMIT_SHORT_SHA="$1"

mysql -h172.17.56.181 -ugitlab-runner -pgitlab-runner -e'drop database if exists unit_test_'${CI_COMMIT_SHORT_SHA}';'
