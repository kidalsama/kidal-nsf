#!/usr/bin/env bash

CI_COMMIT_SHORT_SHA="$1"

mysql -h172.17.56.181 -ugitlab-runner -pgitlab-runner -e'create database unit_test_'${CI_COMMIT_SHORT_SHA}' default character set utf8mb4 collate utf8mb4_unicode_ci;'

sed -i 's/host: 192.168.93.222 \# DATABASE_HOST/host: 172.17.56.181/g' test-services/basic/res/bootstrap-test.yml
sed -i 's/username: mcg \# DATABASE_USERNAME/username: gitlab-runner/g' test-services/basic/res/bootstrap-test.yml
sed -i 's/password: Mcg!2345 \# DATABASE_PASSWORD/password: gitlab-runner/g' test-services/basic/res/bootstrap-test.yml
sed -i 's/database: mcg_games_servers \# DATABASE_DATABASE/database: unit_test_'${CI_COMMIT_SHORT_SHA}'/g' test-services/basic/res/bootstrap-test.yml
