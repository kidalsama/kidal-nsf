#!/usr/bin/env bash

mysql -h172.17.56.181 -ugitlab-runner -pgitlab-runner -e'create database unit_test_'${TEST_ID}' default character set utf8mb4 collate utf8mb4_unicode_ci;'
