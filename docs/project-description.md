# Details

We expect you to build this out as you would a production project for a client, only on a small scale (tests, error handling, etc). Where you don't have the time to implement something, add comments to your code or documentation on how you would have changed or added to your implementation in the "real world".

### Deliverables

1. Git Repo with all code and documentation
2. **BONUS** - a working Amazon Connect phone number to test in your environment :-)

### Exercise

3. Create a Lambda that converts phone numbers to vanity numbers and save the best 5 resulting vanity numbers and the caller's number in a DynamoDB table. "Best" is defined as you see fit - explain your thoughts.
4. Create an Amazon Connect contact flow that looks at the caller's phone number and says the 3 vanity possibilities that come back from the Lambda function.
5. Create a [custom resource for CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources.html) that will allow you to publish the contact flow to a Connect instance with the appropriate Lambda ARN already in the contact flow so that there is no manual configuration of the flow.
6. Build a deployment package with AWS SAM, AWS CDK, or CloudFormation to allow a user, or assignment reviewer, to deploy your Lambda, custom resource, and anything else you'd like to add into their own AWS Account/Amazon Connect instance.
7. **SUPER BONUS -** a web app that displays the vanity numbers from the last 5 callers.
8. Writing and Documentation
   1. Record your reasons for implementing the solution the way you did, struggles you faced and problems you overcame.
   2. What shortcuts did you take that would be a bad practice in production?
   3. What would you have done with more time? We know you have a life. :-)
   4. What other considerations would you make before making our toy app into something that would be ready for high volumes of traffic, potential attacks from bad folks, etc.
   5. Please include an architecture diagram.

Show off. This is your chance to demonstrate your ability to learn, Google, and figure it out. Do your best to express your areas of expertise and ability.
