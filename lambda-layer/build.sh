cd nodejs
npm install
cd ..
zip -r package.zip nodejs/
mkdir -p /workspace/src/resources/lambda-layer
cp package.zip "$_"
