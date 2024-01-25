To get around self-signed certificate error with yarn add

```bash
$ NODE_TLS_REJECT_UNAUTHORIZED=0 && yarn add https://gitlab.jhuapl.edu/jonesjp1/alicat-mfc.git
```
Desorber commands:


Gitlab test runner problems:

Gitlab's gitlab-runner-helper registry: https://registry.hub.docker.com/r/gitlab/gitlab-runner-helper/tags?page=1&ordering=last_updated

The configurations used for the docker test runners are located here: ~/.gitlab-runner/config.toml

The command I use for editing the config.toml file is:
open -a textedit config.toml

Make sure to have docker running on JPJ's laptop to get runner to go
