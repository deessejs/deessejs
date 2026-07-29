# Dev Container Configuration

This repository includes a pre-configured development environment for GitHub Codespaces.

## What's Included

- **Node.js 22** - Latest LTS runtime
- **PostgreSQL 16** - Pre-installed and initialized
- **pnpm** - Fast, disk space efficient package manager
- **VS Code Extensions** - ESLint, Prettier, Prisma, Tailwind CSS

## Getting Started

### Create a Codespace

1. Go to the repository on GitHub
2. Click the **Code** button
3. Select **Create codespace on main**
4. Wait for the environment to set up (~2-3 minutes first time)

### First-Time Setup

The dev container automatically:
- Installs pnpm dependencies
- Creates PostgreSQL user and database
- Generates the auth schema

### Environment Variables

Set your secrets in Codespaces:

1. Go to **Codespaces** → **Manage codespaces**
2. Select your codespace
3. Go to **Secrets** tab
4. Add `BETTER_AUTH_SECRET` with a secure value:
   ```bash
   openssl rand -base64 32
   ```

### Available Services

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | `postgresql://codespace:codespace@localhost:5432/saas` |
| App Dev | 3000 | https://localhost:3000 |

### Running Commands

```bash
# Start all apps
pnpm dev

# Run database migrations
pnpm db:push

# Run tests
pnpm test
```

## Troubleshooting

### PostgreSQL not starting

Run manually:
```bash
sudo service postgresql start
```

### Database connection errors

Check the connection string:
```bash
echo $DATABASE_URL
```

Should be: `postgresql://codespace:codespace@localhost:5432/postgres`

### Reset database

```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS saas;"
sudo -u postgres psql -c "CREATE DATABASE saas OWNER codespace;"
pnpm db:push
```

## VS Code Extensions

The dev container pre-installs:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- TypeScript Nightly

## Resources

- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Developing in a codespace](https://docs.github.com/en/codespaces/developing-in-codespaces/developing-in-a-codespace)
