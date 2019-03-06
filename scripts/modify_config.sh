#!/usr/bin/env bash

TEST_ID="$1"
CONFIG_PATH=test-services/basic/resource/application-test.yml

sed -i 's/host: "host: "39.105.87.12" # CI: data.databaseMap.primary.host/host: 172.17.56.181/g' ${CONFIG_PATH}
sed -i 's/username: "mcg" # CI: data.databaseMap.primary.username/username: gitlab-runner/g' ${CONFIG_PATH}
sed -i 's/password: "Mcg!2345" # CI: data.databaseMap.primary.password/password: gitlab-runner/g' ${CONFIG_PATH}
sed -i 's/database: "test_node_server_foundation" # CI: data.databaseMap.primary.database/database: gitlab_ci_'${TEST_ID}'/g' ${CONFIG_PATH}

sed -i 's/host: "host: "39.105.87.12" # CI: data.databaseMap.secondary.host/host: 172.17.56.181/g' ${CONFIG_PATH}
sed -i 's/username: "mcg" # CI: data.databaseMap.secondary.username/username: gitlab-runner/g' ${CONFIG_PATH}
sed -i 's/password: "Mcg!2345" # CI: data.databaseMap.secondary.password/password: gitlab-runner/g' ${CONFIG_PATH}
sed -i 's/database: "test_node_server_foundation_2" # CI: data.databaseMap.secondary.database/database: gitlab_ci_'${TEST_ID}'_2/g' ${CONFIG_PATH}
