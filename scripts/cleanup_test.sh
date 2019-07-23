#!/usr/bin/env bash

TEST_ID="$1"

mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'drop database if exists gitlab_ci_'${TEST_ID}'_1;'
mysql -h39.107.15.85 -umcg -p'Mcg!2345' -e'drop database if exists gitlab_ci_'${TEST_ID}'_2;'
