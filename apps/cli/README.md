# @deessejs/cli

CLI for the DeesseJS template registry.

## Install (V1)

```bash
npx deessejs@latest <command>
```

Future (V1.1+, when pro templates need auth): `npm i -g @deessejs/cli`.

## Commands

| Command | Role |
|---|---|
| `deessejs init <slug>` | Clone a template repo + install dependencies |
| `deessejs list` | List available templates |
| `deessejs info <slug>` | Show details for one template |

## Examples

```bash
deessejs list
deessejs list --category saas --json
deessejs info saas-starter --json
deessejs init saas-starter
deessejs init saas-starter --ref develop --no-install
```

## Global flags

- `--api-url <url>` — override the templates endpoint (default: `https://deessejs.com/api/templates`)
- `--json` — JSON output for scripting

## License

UNLICENSED for V1 (private). License TBD before npm publish.