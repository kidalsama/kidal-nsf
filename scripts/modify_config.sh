#!/usr/bin/env bash

TEST_ID="$1"
CONFIG_PATH=test-services/basic/resource/application-test.yml

sed -i 's/host: 192.168.93.222 \# DATABASE_HOST/host: 172.17.56.181/g' ${CONFIG_PATH}
sed -i 's/username: mcg \# DATABASE_USERNAME/username: gitlab-runner/g' ${CONFIG_PATH}
sed -i 's/password: Mcg!2345 \# DATABASE_PASSWORD/password: gitlab-runner/g' ${CONFIG_PATH}
sed -i 's/database: test_node_server_foundation \# DATABASE_DATABASE/database: gitlab_ci_'${TEST_ID}'/g' ${CONFIG_PATH}
