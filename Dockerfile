#######################################################################
#                           toolchain                                 #
#######################################################################
FROM node:lts-alpine as toolchain

RUN apk add --update --no-cache \
  build-base \
  openjdk11 \
  git \
  docker-cli

COPY . /opt/app
WORKDIR /opt/app

#######################################################################
#                        Dependencies For Testing                     #
#######################################################################
FROM toolchain AS builder

ARG GITHUB_TOKEN

RUN npm config set @paisamex:registry=https://npm.pkg.github.com && \
    npm config set -- //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN} && \
    yarn install --frozen-lockfile && \
    yarn build && \
    chown -R node:node /opt/app

USER node

EXPOSE 3000

CMD ["yarn", "start:dev"]

#######################################################################
#                        Build Production Image                       #
#######################################################################
FROM node:lts-alpine as production

LABEL Author="Paisamex"
LABEL Description="wallet service"

RUN apk add --no-cache bash curl jq aws-cli

RUN mkdir /opt/app

WORKDIR /opt/app

COPY --from=builder /opt/app/package.json /opt/app
COPY --from=builder /opt/app/yarn.lock /opt/app
COPY --from=builder /opt/app/dist /opt/app/dist
COPY --from=builder /opt/app/environment /opt/app/environment

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ARG GITHUB_TOKEN

RUN npm config set @paisamex:registry=https://npm.pkg.github.com && \
    npm config set -- //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN} && \
    yarn install --production

RUN chown -R node:node /opt/app

USER node

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["yarn", "start:prod"]
