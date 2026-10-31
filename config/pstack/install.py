"""Preview or install the shared pstack configuration."""

import argparse
import json
import os
import shutil
import tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="install the configuration")
    parser.add_argument(
        "--retire-legacy",
        action="store_true",
        help="back up and remove the old proxy Opus and Sonnet droids",
    )
    parser.add_argument(
        "--allow-missing-models",
        action="store_true",
        help="install even when a provider has no local connection to reuse",
    )
    args = parser.parse_args()

    source = Path(__file__).resolve().parent
    factory = Path.home() / ".factory"
    droids = factory / "droids"
    files = [(source / "pstack-models.md", factory / "pstack-models.md")]
    files += [(path, droids / path.name) for path in sorted((source / "droids").glob("*.md"))]
    catalog = json.loads((source / "custom-models.json").read_text())
    settings_path = factory / "settings.json"
    settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}
    existing_models = settings.get("customModels", [])
    catalog_by_id = {model["id"]: model for model in catalog}
    configured = {model.get("id") for model in existing_models}
    missing = [model for model in catalog if model["id"] not in configured]
    updates = [
        model["id"]
        for model in existing_models
        if model.get("id") in catalog_by_id
        and any(model.get(key) != value for key, value in catalog_by_id[model["id"]].items())
    ]
    additions = []
    unavailable = []
    next_index = max((m.get("index", -1) for m in existing_models if isinstance(m.get("index"), int)), default=-1) + 1
    connection_fields = ("baseUrl", "apiKey", "apiKeyHelper", "apiKeyHelperTtlMs", "authMode", "extraHeaders")
    for model in missing:
        group = model["id"].split(":")[1]
        candidates = [m for m in existing_models if str(m.get("id", "")).startswith(f"custom:{group}:")]
        matching_provider = [m for m in candidates if m.get("provider") == model["provider"]]
        if matching_provider:
            candidates = matching_provider
        elif group == "opencode-go" and model["provider"] == "openai":
            candidates = [m for m in candidates if m.get("provider") == "generic-chat-completion-api"]
        else:
            candidates = []
        endpoints = {str(m.get("baseUrl", "")).rstrip("/") for m in candidates}
        keys = {(m.get("apiKey"), m.get("apiKeyHelper")) for m in candidates}
        if not candidates or len(endpoints) != 1 or "" in endpoints or len(keys) != 1:
            unavailable.append(model["id"])
            continue
        match = candidates[0]
        addition = {**model, **{key: match[key] for key in connection_fields if key in match}, "index": next_index}
        additions.append(addition)
        next_index += 1
    legacy = [
        droids / name
        for name in (
            "proxy-opus-high-reader.md",
            "proxy-opus-high.md",
            "proxy-opus-reader.md",
            "proxy-sonnet.md",
        )
        if (droids / name).exists()
    ]

    for _, target in files:
        print(f"{'Replace' if target.exists() else 'Create'}: {target}")
    if args.retire_legacy:
        for target in legacy:
            print(f"Retire: {target}")
    for model in additions:
        print(f"Add custom model: {model['id']}")
    for model in updates:
        print(f"Update custom model metadata: {model}")
    for model in unavailable:
        print(f"Missing provider connection: {model}")
    if not args.apply:
        print("Preview only. Pass --apply to install.")
        return
    if unavailable and not args.allow_missing_models:
        parser.error("configure the missing provider connections or pass --allow-missing-models")

    droids.mkdir(parents=True, exist_ok=True)
    previous = [target for _, target in files if target.exists()]
    if (additions or updates) and settings_path.exists():
        previous.append(settings_path)
    if args.retire_legacy:
        previous += legacy
    if previous:
        backup_root = factory / "pstack-backups"
        backup_root.mkdir(exist_ok=True)
        backup = Path(tempfile.mkdtemp(prefix="pstack-", dir=backup_root))
        for target in previous:
            saved = backup / target.relative_to(factory)
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, saved)
            if target == settings_path:
                saved.chmod(0o600)
        print(f"Backed up existing files to {backup}")
    if additions or updates:
        settings["customModels"] = [
            {**model, **catalog_by_id[model["id"]]} if model.get("id") in catalog_by_id else model
            for model in existing_models
        ] + additions
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=factory, delete=False) as temp:
                temp_path = Path(temp.name)
                json.dump(settings, temp, indent=2, ensure_ascii=False)
                temp.write("\n")
            os.replace(temp_path, settings_path)
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)
    for src, target in files:
        shutil.copyfile(src, target)
    if args.retire_legacy:
        for target in legacy:
            target.unlink()
    print("Installed. Restart the Droid session to reload configuration.")


if __name__ == "__main__":
    main()
