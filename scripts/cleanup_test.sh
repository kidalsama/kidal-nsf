#!/usr/bin/env bash

TEST_ID="$1"

mysql -h172.17.56.181 -ugitlab-runner -pgitlab-runner -e'drop database if exists gitlab_ci_'${TEST_ID}';'
