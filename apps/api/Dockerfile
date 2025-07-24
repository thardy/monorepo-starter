# alwyas use slim and the lastest debian distro offered
FROM node:20.15.1-bookworm-slim AS base


FROM base AS pruner
# add user first, then set WORKDIR to set permissions
WORKDIR /app
RUN npm install -g turbo
# Create the out directory with proper permissions before switching to node user
RUN mkdir -p /app/out/api && chown -R node:node /app
# copy the entire monorepo with correct permissions
COPY --chown=node:node . .
USER node
# Prune only the @monorepo-starter/api application - places in /out folder
RUN turbo prune @monorepo-starter/api --docker --out-dir ./out/api


# Add pruned lockfile and package.json's of isolated subworkspace
FROM base as lockfile-generator
WORKDIR /app
COPY --from=pruner /app/out/api/json/ .
RUN npm install --package-lock-only

FROM base AS installer
WORKDIR /app
# Copy over the pruned package.json files and the newly generated lockfile
COPY --from=pruner /app/out/api/json/ .
COPY --from=lockfile-generator /app/package-lock.json .
COPY --from=pruner /app/tsconfig.base.json .
COPY --from=pruner /app/nx.json .
# copy the .npmrc file, which should already have an authToken in it
# COPY --from=pruner .npmrc .npmrc
# First install the dependencies (as they change less often)
RUN npm ci && npm cache clean --force

# Copy all source required for this specific app, then build the app and its dependencies
COPY --from=pruner /app/out/api/full/ .
RUN npx nx build:prod @monorepo-starter/api --verbose


# use only the built app for production
FROM base AS runner
EXPOSE 5001
USER node
WORKDIR /app
ENV NODE_ENV=prod

# Copy all source required for this specific app, then build the app and its dependencies
COPY --chown=node:node --from=installer /app/apps/api/package.json .
# tsconfig.prod.json (build:prod) changes outDir to dist/prod. The nx build needs all the typescript files 
#  from the shared packages to build the api, so dist contains typescript files that we don't want
COPY --chown=node:node --from=installer /app/apps/api/dist/prod/. .
# Copy node_modules - these contain symlinks to our shared local packages (we'll need to copy them separately)
COPY --chown=node:node --from=installer /app/node_modules ./node_modules


# temp step to keep the container running for manual debugging
#CMD ["tail", "-f", "/dev/null"] 
CMD ["node", "./index.js"]
