# https://github.com/microsoft/containerregistry
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node

# TODO?: https://aka.ms/vscode-remote/containers/non-root-user

RUN update-ca-certificates \
  && apt-get update \
  && apt-get install -y python-pip \
  && pip --no-cache-dir install awscli \
  && npm install -g typescript \
  && npm install -g aws-cdk \
  && npm install -g @angular/cli
