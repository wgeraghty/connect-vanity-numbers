# Environment
  * VSCode
  * Docker

  The project is configured with VSCode Dev Containers to keep the build environment consistent across all systems.
  For more information see: https://code.visualstudio.com/docs/remote/containers

# Structure
  .aws/: AWS config/keys
  .devcontainer/: VSCode/Docker config
  src/: The main project

# Default folder mappings inside the container (docker-compose.yml)
  * / -> /workspace
  * .aws/ -> /root/.aws

# Config
  `aws configure` can be run inside the container to or the .aws folder can be remapped .devcontainer/docker-compose.yml:
  * `- ../.aws:/root/.aws:cached`
    Do NOT commit any changes that contain files from the .aws folder, it has been added to .gitignore but be careful anyways.

# New AWS Account Bootstrap
  * `cdk bootstrap aws://ACCOUNT-NUMBER/REGION`
    See Bootstrapping at https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html

# CDK Commands
  * `cdk synth`
  * `cdk diff`
  * `cdk deploy`
  * `cdk destroy`

# Build Lambda Layer
  AWS JavaScript SDK V3 is not included in Lambda, a custom layer must be built for it:
  * `cd /workspace/lambda-layer/`
  * `./build.sh`

  Any additional required node packages can be added to the layer:
  * `cd /workspace/lambda-layer/nodejs`
  * `npm install packageName`
  * `cd ..`
  * `./build.sh`
  * Redeploy main project

# TODO
  * Figure out minimum IAM permissions for deployment
  * Multiple stacks for front/back?
