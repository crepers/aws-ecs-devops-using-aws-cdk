#!/bin/sh

# Configuration File Path
APP_CONFIG=$1
export APP_CONFIG=$APP_CONFIG

PROJECT_NAME=$(cat $APP_CONFIG | jq -r '.Project.Name') #ex> IoTData
PROJECT_STAGE=$(cat $APP_CONFIG | jq -r '.Project.Stage') #ex> Dev
PROFILE_NAME=$(cat $APP_CONFIG | jq -r '.Project.Profile') #ex> cdk-demo

echo ==--------ConfigInfo---------==
echo $APP_CONFIG
echo $PROFILE_NAME
echo .
echo .

echo ==--------Setup---------==
sh scripts/setup_initial.sh $APP_CONFIG
echo .
echo .

echo ==--------ListStacks---------==
cdk list
echo .
echo .

echo ==--------DeployStacksStepByStep---------==
if [ -z "$PROFILE_NAME" ]; then
    cdk deploy *-VpcInfraStack --require-approval never
    cdk deploy *-SampleBackendFastapiStack --require-approval never
    cdk deploy *-SampleFrontendFlaskStack --require-approval never
    cdk deploy *-LoadTesterScriptStack --require-approval never
else
    cdk deploy *-VpcInfraStack --require-approval never --profile $PROFILE_NAME
    cdk deploy *-SampleBackendFastapiStack --require-approval never --profile $PROFILE_NAME
    cdk deploy *-SampleFrontendFlaskStack --require-approval never --profile $PROFILE_NAME
    cdk deploy *-LoadTesterScriptStack --require-approval never --profile $PROFILE_NAME
fi
echo .
echo .
