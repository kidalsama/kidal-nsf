#!/usr/bin/env bash

TEST_ID="$1"

mysql -h172.17.56.181 -ugitlab-runner -pgitlab-runner -e'create database gitlab_ci_'${TEST_ID}' default character set utf8mb4 collate utf8mb4_unicode_ci;'
