## Setup Unleash for Cover Partners locally

Unleash is used to control feature flags. In order to use feature flags locally you need to have Unleash running. This guide assumes you have Docker installed locally.

1. Clone the unleash-docker repo locally `git@github.com:CoverFinancial/unleash-docker.git`
2. Change directory to `unleash-docker`
3. Create a `.env` file in the `unleash-docker` directory and add the environment variables from this [document](https://drive.google.com/file/d/1hjniiRi1HXD3CUPMMIcpsg7_h4m3KOrL/view)
4. Set the following Database ENV Vars (already provided in docker-compose already, set manually on Heroku Config for cloud deploy)
    - DATABASE_USERNAME (match to the value in the attached Heroku db instance, see DATABASE_URL env var)
    - DATABASE_PASSWORD (match to the value in the attached Heroku db instance, see DATABASE_URL env var)
    - DATABASE_HOST (match to the value in the attached Heroku db instance, see DATABASE_URL env var)
    - DATABASE_PORT (defaults to 5432 if not set)
    - DATABASE_NAME (defaults to 'unleash' if not set)
    - DATABASE_SSL (must equal 'true' to use ssl)
    - NODE_TLS_REJECT_UNAUTHORIZED=0 (Only required when DATABASE_SSL is set to true on Heroku)
5. `docker-compose build`
6. `docker-compose up`
7. Visit http://localhost:4242 to ensure application is running.

## Use this image

We have published this image on docker-hub. 

```bash
docker pull unleashorg/unleash-server:3.3
docker run -d -e DATABASE_URL=postgres://user:pass@10.200.221.11:5432/unleash unleashorg/unleash-server
```

Specifying secrets as environment variables are considered a bad security practice. Therefore, you can instead specify a file where unleash can read the database secret. This is done via the `DATABASE_URL_FILE` environment variable.


## Work locally with this repo 
Start by cloning this repository. 

We have set up `docker-compose` to start postgres and the unleash server together. This makes it really fast to start up
unleash locally without setting up a database or node.

```bash
$ docker-compose build
$ docker-compose up
```

### Requirements
We are using docker-compose version 3.3 and it requires:

- Docker engine 17.06.0+
- Docker compose 1.14.0+

For more info, check out the compatibility matrix on Docker's website: [compatibility-matrix](
https://docs.docker.com/compose/compose-file/compose-versioning/#compatibility-matrix)



## Upgrade version
When we upgrade the `unleash-version` this project should be tagged with the same version number.

```bash
git tag -a 3.3.0 -m "upgrade to unleash-server 3.3.0"
git push origin master --follow-tags
```

You might also want to update the minor tag:

```bash
git tag -d 3.3
git push origin :3.3
git tag -a 3.3 -m "Update 3.3 tag"
git push origin master --follow-tags
```

This will automatically trigger docker-hub to build the new tag. 
