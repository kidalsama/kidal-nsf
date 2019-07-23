#!/usr/bin/env bash

TEST_ID="$1"

mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'create database gitlab_ci_'${TEST_ID}'_1 default character set utf8mb4 collate utf8mb4_unicode_ci;'
mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'create database gitlab_ci_'${TEST_ID}'_2 default character set utf8mb4 collate utf8mb4_unicode_ci;'
