#!/usr/bin/env bash

TEST_ID="$1"
CONFIG_PATH=test-services/basic/resource/application-test.yml

sed -i 's/database: "test_nsf_1"/database: "gitlab_ci_'${TEST_ID}'_1"/g' ${CONFIG_PATH}
sed -i 's/database: "test_nsf_2"/database: "gitlab_ci_'${TEST_ID}'_2"/g' ${CONFIG_PATH}
