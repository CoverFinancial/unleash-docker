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

## Deployment Process Steps
Unleash does not have auto deployments set up on merge to master.  It is also using Heroku's container stack environment.

1. Check out `master` branch.
2. Ensure the image can be built: `docker-compose build`.
3. Build the image and push to our container registry on Heroku: `heroku container:push web -a cover-unleash-<env>`. Note that `web` is the name of the app built in the `docker-compsose.yml` file.
4. Release the new container into the environment: `heroku container:release web -a cover-unleash-<env>`.
5. Validate that the app is still running fine via the logs `heroku logs -t -a cover-unleash-<env>`.

## Database Upgrade Process Steps
This likely will not need to be done again but the steps are documented here in case they are needed:

1. Take a backup of the database: `heroku pg:backups:capture -a cover-unleash-<env>`
2. Create a new database to promote later: `heroku addons:create heroku-postgresql:standard-0 --app cover-unleash-<env>`.
3. Wait until you are given confirmation that the database was create successfully: `heroku pg:wait --app cover-unleash-<env>`.
4. Get the title of the new non-primary database, it will be the second instance in the list returned by `heroku pg:info -a cover-unleash-<env>`. Example db title: "HEROKU_POSTGRESQL_PUCE_URL"
5. Retrieve the credentials info for the new database with `heroku pg:credentials:url <db title from step 4>  -a cover-unleash-<env>`.
6. From the data returned in step 5, fill in *BUT DO NOT RUN* this `heroku config:set` command template to set the appropriate environment variables for connection to the database.
```
heroku config:set DATABASE_HOST=<NEW DB HOST> DATABASE_NAME=<NEW DB NAME> DATABASE_PASSWORD=<NEW DB PASSWORD> DATABASE_USERNAME=<NEW DB USERNAME> NODE_TLS_REJECT_UNAUTHORIZED=0 -a cover-unleash-<env>
```
7. Put the app in maintenance mode `heroku maintenance:on --app cover-unleash-<env>`. It is best to perform the remaining steps in off peak hours and let your team know about a couple mins of downtime.
8. Perform a copy of the data from the existing database to the new one: `heroku pg:copy DATABASE_URL <db title from step 4> -a cover-unleash-<env>`
9. Run the `heroku config:set` command you put together in step 6 to set the variables.
10. Promote the new database to be the primary database `heroku pg:promote <db title from step 4> -a cover-unleash-<env>`.
11. Confirm that the new database is the primary and the old database is now the second instance in the list returned by `heroku pg:info -a cover-unleash-<env>`
12. Turn off maintenance mode for the app `heroku maintenance:off --app cover-unleash-<env>`
13. Validate that the app is still running fine via the logs `heroku logs -t -a cover-unleash-<env>`.  If there is an issue, put the app back in maintenance mode and repromote the old database with its original database env vars.
14. If appropriate, you can now remove the old database if it has costs.  It may be best to wait a week to ensure you don't need it.  Use `heroku addons:destroy <old db title> -a cover-unleash-<env>`

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
