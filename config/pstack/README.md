# Pstack model configuration

This folder contains the Factory Droid role map, personal droids, and custom-model
metadata. The installed pstack plugin provides the `pstack-*` droids. This folder
does not contain model-provider credentials, private connection settings, or plugin files.

The installer runs on macOS, Linux, and Windows with Python 3.9 or newer. It does not
install Python, Droid, the pstack plugin, or model providers. From a checkout,
preview the changes and then apply them:

```sh
python3 config/pstack/install.py
python3 config/pstack/install.py --apply
```

The installer adds missing custom models using connection and credential fields
from a matching provider already configured on the machine. It updates the catalog's
nonsecret fields on existing matching models, leaving credentials and unrelated models
unchanged. If it cannot identify an unambiguous local connection, it refuses to
apply. Configure that provider locally, or pass
`--allow-missing-models` to install without its routes. On Windows, use `py -3`
in place of `python3`.

Add `--retire-legacy` to both commands to retire the four old `proxy-opus-*`
and `proxy-sonnet` droids. The installer backs up replaced and retired files,
including settings when changed, under `~/.factory/pstack-backups/`, then
installs the role map and personal droids. It leaves unrelated personal droids
and settings alone.

Each Mac needs the pstack plugin, the specified custom model routes and their
credentials, and the computer-use tools required for validation. A model
listed here is not necessarily available or funded. Factory can fall back to
the parent model when a configured model is unavailable, so check the route
before relying on a delegate.

The installed pstack plugin restricts its named targets to the plugin roster.
This map also names personal droids and adds roles beyond the bundled defaults.
Those extensions, the longer validation fallback sequence, and computer-use
access in the personal validators have not been verified end to end. Do not
assume the role map overrides the plugin's routing instructions.

Contributor-tier model briefs must be screened before launch. A warning inside
the droid is too late to prevent the prompt from reaching its provider.
