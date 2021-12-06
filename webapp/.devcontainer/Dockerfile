FROM mcr.microsoft.com/vscode/devcontainers/typescript-node

RUN update-ca-certificates \
  && apt-get update \
  && npm install -g typescript \
  && npm install -g @angular/cli