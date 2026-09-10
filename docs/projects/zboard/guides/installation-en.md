# First installation

[English](/projects/zboard/guides/installation-en) | [简体中文](/projects/zboard/guides/installation)

This guide installs the published Docker image and walks through creating your first service. The image includes the backend and web console; you do not need to build the frontend or install Go and Node.js.

## Before you start

Prepare:

- A Linux amd64 host with Docker Engine, the Docker Compose plugin, Git, and OpenSSL.
- An empty MySQL 8 database and a dedicated application account with permission to create and update its tables. ZBoard refuses the MySQL root account in production.
- An existing Docker network that lets the application reach MySQL. If MySQL runs in Docker, attach its container to that network and use its container name or network alias as the database host.
- A domain with HTTPS, served by a reverse proxy on the Docker host. The example binds ZBoard to `127.0.0.1:8080`.

The release Compose file starts **only ZBoard**. It does not provision MySQL or Redis. SQLite is an alternative; see [Docker storage](/projects/zboard/guides/storage-and-backups) for its environment settings and Compose override.

## 1. Get the deployment files

Choose a version from [Releases](https://github.com/zerodenet/zboard/releases). The following example uses `v0.0.1`:

```bash
git clone --branch v0.0.1 --depth 1 https://github.com/zerodenet/zboard.git
cd zboard/deploy/docker
cp .env.release.example .env.release
chmod 600 .env.release
```

Use the same tag for the checkout and Docker image. For another version, replace `v0.0.1` in both places.

## 2. Configure the application

Edit `.env.release`. Set these values for your environment:

```dotenv
ZBOARD_IMAGE_TAG=v0.0.1
ZBOARD_PULL_POLICY=always
ZBOARD_HTTP_BIND=127.0.0.1
ZBOARD_HTTP_PORT=8080
ZBOARD_EXTERNAL_NETWORK=your_existing_docker_network
ZBOARD_DATABASE_DRIVER=mysql
ZBOARD_DATA_SOURCE='zboard:YOUR_DATABASE_PASSWORD@tcp(mysql:3306)/zboard?charset=utf8mb4&parseTime=true&loc=UTC'
ZBOARD_JWT_SECRET=YOUR_RANDOM_JWT_SECRET
ZBOARD_CREDENTIAL_ENCRYPTION_KEY=YOUR_RANDOM_ENCRYPTION_KEY
```

Replace the network name and all database details, including `mysql`, with your actual connection settings. `127.0.0.1` inside the container refers to the ZBoard container itself, not the host or a separate MySQL container.

Run the following command **twice** to generate two independent values. Use one for `ZBOARD_JWT_SECRET` and the other for `ZBOARD_CREDENTIAL_ENCRYPTION_KEY`:

```bash
openssl rand -hex 32
```

Keep both values stable across restarts. The encryption key is needed to read saved node credentials; keep a backup separately from the database.

Leave `ZBOARD_BOOTSTRAP_ADMIN_EMAIL` and `ZBOARD_BOOTSTRAP_ADMIN_PASSWORD` empty to create the administrator in the setup page. There is no default administrator password.

## 3. Prepare storage and start

These commands use the default host directory paths in `.env.release`. If you change them, follow the [custom directory instructions](/projects/zboard/guides/storage-and-backups#required-host-directories) before starting.

```bash
sh ./prepare-host-dirs.sh
docker compose -f docker-compose.release.yml --env-file .env.release config --quiet
docker compose -f docker-compose.release.yml --env-file .env.release pull
docker compose -f docker-compose.release.yml --env-file .env.release up -d
docker compose -f docker-compose.release.yml --env-file .env.release ps
```

Check the backend from the Docker host:

```bash
curl --fail http://127.0.0.1:8080/readyz
curl --fail http://127.0.0.1:8080/api/v1/version
```

`/readyz` checks the application database connection. It does not indicate whether any Zero nodes have been installed or published successfully.

If startup fails, inspect the service logs:

```bash
docker compose -f docker-compose.release.yml --env-file .env.release logs --tail 100 zboard
```

Common causes are an unset environment value, a missing external network, incorrect database credentials, or MySQL being unreachable from the container.

## 4. Create your administrator

Configure the host reverse proxy to send requests for your HTTPS domain to `http://127.0.0.1:8080`, then open `https://YOUR_DOMAIN/setup`.

Complete the site settings and create the first administrator. After initialization, use `/login`. The setup page cannot create another administrator after the site is installed.

## 5. Configure your first service

1. **Add a node.** Enter its address and SSH connection details in the administrator console.
2. **Install Zero.** Use the node's kernel management controls and wait for installation and health checks to finish.
3. **Create a protocol service.** Choose the node and protocol, configure its listening address and port, and wait for publication to succeed. Make the service port reachable through the node's firewall.
4. **Create a node group and plan.** Add the service to the group, then select that group in the plan.
5. **Activate a user subscription.** Use the basic order workflow to create an order for the plan and confirm it as an administrator.
6. **Connect a client.** In the user's account, choose the subscription format for the client and import its link. Make a connection, then check traffic usage in the console.

For a forwarding node or a shared upstream pool, continue with [network fronting](/projects/zboard/guides/network-fronting). Node installation and recovery are covered in the [node management guide](/projects/zboard/guides/node-management).

## Keep your data

Persist the database, `.env.release`, credential-encryption key, managed rules, and Zero event spool. Builds with plugin support also need their plugin directory. The [storage and backup guide](/projects/zboard/guides/storage-and-backups) explains the mounts and which data must be restored together.

For local source development, use the [development guide](/projects/zboard/contributing/development).
