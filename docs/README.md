# Amazon Connect Vanity Numbers
## Environment
  * VSCode
  * Docker

  The project is configured with VSCode Dev Containers to keep the build environment consistent across all systems.
  For more information see: https://code.visualstudio.com/docs/remote/containers

### Default folder mappings inside the container (docker-compose.yml)
  * `- ..:/workspace:cached`
  * `- ../.aws:/root/.aws:cached`
  Do NOT commit any changes that contain files from the .aws folder, it has been added to .gitignore but be careful anyways.

### VSCode Dev Container Config
  `aws configure` can be run inside the container or the .aws folder can be remapped in .devcontainer/docker-compose.yml:

## Web App

* Demo https://wgeraghty.github.io/vanity-ui/
* Repo http://github.com/wgeraghty/vanity-ui/

The demo requires the endpoint displayed in the output when this project is deployed.  It's a pretty basic Angular project.


## Structure
  * docs/: Documentation
  * .devcontainer/: VSCode/Docker config
  * lambda-layer/: AWS SDK v3 layer build files
  * src/: The main project

## AWS Account CDK Bootstrap
  * `cdk bootstrap aws://ACCOUNT-NUMBER/REGION`
    See Bootstrapping at https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html

## Build Lambda Layer
  AWS JavaScript SDK V3 is not included in Lambda, a custom layer must be built for it:
  * `cd lambda-layer`
  * `./build.sh`

  Any additional required node packages can be added to the layer:
  * `cd lambda-layer/nodejs`
  * `npm install {packageName}`
  * `cd ..`
  * `./build.sh`
  * Redeploy main project

## Deployment Steps
  * Setup AWS Account
  * Create Amazon Connect instance, copy the Connect ARN for the `cdk deploy` step below
  * Configure aws-cli with `aws configure` making sure default region matches region with the Amazon Connect instance
  * [Bootstrap CDK](#aws-account-cdk-bootstrap) may be required
  * [Build lambda layer](#build-lambda-layer)
  * Install dependencies with `npm i` in the src folder
  * Build the project with `npm run build`
  * Deploy with `cdk deploy --parameters connectInstanceArn=arn:aws:connect:::instance/` in the src folder
  * Update Amazon Connect instance to use new Contact Flow: Vanity Number Contact Flow [DATE]

## Deployment Update Steps
  * Make any necessary changes
  * `npm run watch` can be used to auto compile file changes while developing, or run `npm run build`
  * `cdk deploy --parameters connectInstanceArn=arn:aws:connect:::instance/` in the src folder

## Teardown Steps
  * Take Contact Flow out of rotation
  * `cdk destroy`

## Architecture Diagram

![Architecture Diagram](../docs/Amazon%20Connect%20Vanity%20Numbers.drawio.png)

## Word List
  * List pulled from https://github.com/first20hours/google-10000-english/
  * List saved at `src/resources/lambda/word-finder/sorted-filtered-word-list.txt`

### Useful Commands

#### Filter to lines under 11 characters in length
`awk 'length($0) < 11' your-file`

#### Sort by line length, longest first
`awk '{print length, $0}' your-file | sort -n | cut -d " " -f2-`

## TODO
  * Automated lambda layer package build
  * Unit Tests

## Useful commands
  * `npm run build`   compile typescript to js
  * `npm run watch`   watch for changes and compile
  * `npm run test`    perform the jest unit tests
  * `cdk deploy`      deploy this stack to your default AWS account/region, add Connect Instance Id with `--parameters connectInstanceArn=arn:aws:connect:::/`
  * `cdk diff`        compare deployed stack with current state
  * `cdk synth`       emits the synthesized CloudFormation template
