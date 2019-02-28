#!/usr/bin/env bash

TEST_ID="$1"

sed -i 's/host: 192.168.93.222 \# DATABASE_HOST/host: 172.17.56.181/g' test-services/basic/res/bootstrap-test.yml
sed -i 's/username: mcg \# DATABASE_USERNAME/username: gitlab-runner/g' test-services/basic/res/bootstrap-test.yml
sed -i 's/password: Mcg!2345 \# DATABASE_PASSWORD/password: gitlab-runner/g' test-services/basic/res/bootstrap-test.yml
sed -i 's/database: node_server_foundation_test \# DATABASE_DATABASE/database: gitlab_ci_'${TEST_ID}'/g' test-services/basic/res/bootstrap-test.yml
