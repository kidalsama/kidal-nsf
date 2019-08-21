#!/usr/bin/env bash

# 删库
mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'drop database if exists test_nsf_1;'
mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'drop database if exists test_nsf_2;'

# 建库
mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'create database test_nsf_1 default character set utf8mb4 collate utf8mb4_unicode_ci;'
mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'create database test_nsf_2 default character set utf8mb4 collate utf8mb4_unicode_ci;'

# 测试
yarn run test
