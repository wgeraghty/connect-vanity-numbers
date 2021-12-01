# Environment
 * VSCode
 * Docker

 The project is configured with VSCode Dev Containers to keep the build environment consistent across all systems.
 For more information see: https://code.visualstudio.com/docs/remote/containers

# Config
Map the .aws folder correctly in .devcontainer/docker-compose.yml:
 * `- ../.aws:/root/.aws:cached`
  Do NOT commit any changes that contain files from the .aws folder, it has been added to .gitignore but be careful anyways.

# Structure
 .aws/: AWS config/keys
 .devcontainer/: VSCode/Docker config
 src/: The main project

# Default folder mappings inside the container (docker-compose.yml)
 * / -> /workspace
 * .aws/ -> /root/.aws
