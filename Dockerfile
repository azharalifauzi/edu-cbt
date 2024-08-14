# Use the official Bun image
FROM oven/bun:1-alpine AS base

WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# run build
RUN bun b

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=prerelease /usr/src/app .

# required for bcryptjs
RUN apk add libstdc++

# run the app
ENV HOST=0.0.0.0
ENV PORT=4321
USER bun
EXPOSE 4321/tcp
CMD [ "bun", "run", "./dist/server/entry.mjs" ]