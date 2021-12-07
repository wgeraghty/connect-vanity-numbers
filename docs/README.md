# Amazon Connect Vanity Numbers

Project description is available [here](docs/project-description.md).  It is written in TypeScript and deployed with AWS CDK.  The CDK deployment includes:

- Vanity Number Lambda
- Contact Flow via Custom Resource
- DynamoDB Table
- API Gateway with Lambda Endpoint
- Permissions only where necessary

The project also includes an Angular web app to display recent calls.  A demo is available at https://wgeraghty.github.io/vanity-ui/.  The demo requires an endpoint address that is provided in deployment output.

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

## Structure
  * docs/: Documentation
  * .devcontainer/: VSCode/Docker config
  * lambda-layer/: AWS SDK v3 layer build files
  * src/: Main CDK project
  * webapp/: Angular web app

## AWS Account CDK Bootstrap
  The AWS account must have CDK bootstrapped to upload the project.  See Bootstrapping at https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html.
  * `cdk bootstrap aws://ACCOUNT-NUMBER/REGION`

## Build Lambda Layer
  AWS JavaScript SDK V3 is not included in Lambda, a custom layer must be built for it.  To build `src/resources/lambda-layer/package.zip`:
  * `cd lambda-layer`
  * `./build.sh`

  Any additional required node packages can be added to the layer:
  * `cd lambda-layer/nodejs`
  * `npm install PACKAGE_NAME`
  * `cd ..`
  * `./build.sh`
  * [Redeploy main project](#deployment-update-steps)

## Deployment Steps
  * Setup AWS Account
  * Create Amazon Connect instance, copy the Connect ARN for the `cdk deploy` step below
  * Configure aws-cli with `aws configure` making sure default region matches region with the Amazon Connect instance
  * [Bootstrap CDK](#aws-account-cdk-bootstrap) may be required
  * [Build lambda layer](#build-lambda-layer)
    * `cd lambda-layer`
    * `./build.sh`
  * Install dependencies with `npm i` in the `src` folder
  * Build the project with `npm run build`
  * Deploy with `cdk deploy --parameters connectInstanceArn=arn:aws:connect:::instance/` in the `src` folder
  * Copy the VanityStack.vanityapiEndpointXXXXXX address from CDK output to use in the Web App
  `Outputs:
VanityStack.vanityapiEndpointXXXXXX = https://XXXXXXX.execute-api.us-west-2.amazonaws.com/prod/`
  * Update Amazon Connect instance to use new Contact Flow: Vanity Number Contact Flow [DATE]
  * Deploy Web App, see [Web App README](../webapp/README.md)

## Deployment Update Steps
  * Make any necessary changes
  * `npm run watch` can be used to auto compile file changes while developing, or run `npm run build`
  * `cdk deploy --parameters connectInstanceArn=arn:aws:connect:::instance/` in the `src` folder

## Teardown Steps
  * Take Contact Flow out of rotation.  Leaving it active will cause the flow to remain behind on teardown.
  * `cdk destroy`

## Vanity Number Calculation

- The phone number without the +, country code, and area code is used to keep the text to speech somewhat reasonable. `+18005551234` is cut down to `5551234`.
- The number is split into usable chunks on any 0 or 1 numbers.  These do not map to any letters on a dial pad.  `5551234` would become 3 chunks: `555, 1, 234`
- A full set of possible substrings for each chunk is generated, for the number `234`:
   - `2, 23, 234`
   - `3, 34`
   - `4`
- A word list is used, with dialpad letter replacements as comparison, to find all possible matches for each substring.
- The matches are filtered by longest words first.  Wrapped by any leading/trailing numbers to finish the chunk.  The chunk 22382 could have:
   - `2382` = `beta`, add the leading 2 back: `2 beta`
   - `2238` = `abet`, add the trailing 2 back: `abet 2`
   - `238` = `bet`, add leading & trailing 2 back: `2 bet 2`
   - `beta` or `abet` would be used before `bet`
- Matches from each chunk are spliced back together to generate a full vanity number.

It could be improved by combining results from non-overlapping substrings.  `2382382` currently does not produce `beta bet`.

## Vanity Number Dynamo DB Table

The callers phone number and generated vanity numbers are stored along with the most recent call timestamp.  The phone number is the table key with the timestamp set as a GSI, allowing for sorting by most recent calls but not allowing repeated entries for the same phone number.  This allows the web app to show unique callers instead of repeated calls from the same phone numbers.

## Questions & Responses

> 1. Record your reasons for implementing the solution the way you did, struggles you faced and problems you overcame.

The main goal was to keep the code simple, using standard AWS tools and libraries instead of 3rd party.  Some of the AWS libraries involved do not seem to be documented with examples very well so it required some digging into the library source files, and googling the right things, to figure out.

I also like to include the dev environment in the project, so VS Code Dev Container files are included.  With VS Code and Docker installed the project should not require any additional steps to configure the dev environment, the host system doesn’t even need aws-cli installed.

The first struggle was finding out Lambda still does not support SDK v3 out of the box, a year after it has been released.  I considered using a different version or using Webpack, but v3 has TypeScript support and Webpack complicates the build process.  The solution was to bundle required SDK v3 components into a Lambda Layer.  Steps on building the layer are included in the docs.

After that it came down to learning more about certain AWS services and CDK.  I had not used Amazon Connect before.  I hadn’t heard of a CDK Custom Resource.  Some googling, documentation, and a few videos later I was on my way.

The Contact Flow Custom Resource was the trickiest part.  The errors while testing were not helpful and the Amazon Connect UI uses a different JSON schema than the SDK.  The aws-cli is also missing some Contact Flow commands, like delete-contact-flow.  The v3 SDK can delete a Contact Flow though, as long as it isn’t assigned to a phone number.  These issues were all overcome the same way: more google, more testing, more digging through repos, more digging through SDK code.

> 2. What shortcuts did you take that would be a bad practice in production?

- API Endpoint is not secured.  CORS and Authentication should be added.
- Web App UI should not be hosted on GitHub Pages.  The endpoint address was not included in the source for security, and to make testing easier.
- Some errors should be handled in a better way.
- Need Unit Tests

> 3. What would you have done with more time? We know you have a life. :-)

- The Web App could have been hosted in S3 with a CloudFront distribution
- Authentication could have been added using Cognito
- A WebSocket connection could have been used for real-time updates to calls on the Web App
- Cleaned up the DynamoDB code
- Maybe use CodeCommit instead of GitHub, along with Cloud9, keeping everything on AWS
- Nicer, JSDoc comments
- The Web App UI could use some layout adjustments
- Better log retention policies to not clutter CloudWatch

> 4. What other considerations would you make before making our toy app into something that would be ready for high volumes of traffic, potential attacks from bad folks, etc.

- Optimize DynamoDB provisioning for expected traffic levels
- Secure API Endpoint: Auth & CORS, API Gateway rate limiting
- Request Lambda Quota increase
- Profile Lambdas and optimize memory allocation
- Host web app elsewhere
- More testing
- Ask someone with more experience in Amazon Connect for input

Another possibility would be to look into AWS Shield or WAF if DDOS mitigation is required for the web app but I have not used them before.  This would be a bit overkill if the above steps were already taken and the web app isn’t public.

> 5. Please include an architecture diagram.

![Architecture Diagram](../docs/Amazon%20Connect%20Vanity%20Numbers.drawio.png)
* [Download Draw.io File](../docs/Amazon%20Connect%20Vanity%20Numbers.drawio)

## Word List
  * List pulled from https://github.com/first20hours/google-10000-english/
  * List saved at `src/resources/lambda/word-finder/sorted-filtered-word-list.txt`

### Useful Word List Commands

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
