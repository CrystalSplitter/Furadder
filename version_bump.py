#!/usr/bin/env python3
"""Bump the version of the manifest.json."""

import argparse
import json
import pathlib
import typing as t

BROWSER_DIRS = ["chromium", "firefox"]


def main():
    """Bump the version."""
    args = parse_args()
    for manifest_path in _get_manifests(pathlib.Path.cwd()):
        with open(manifest_path, "r") as f:
            manifest_dict = json.loads(f.read())
        _bump_manifest(args.version_type, manifest_dict)
        with open(manifest_path, "w") as f:
            f.write(json.dumps(manifest_dict, indent=2, sort_keys=True))


def _bump_manifest(version_type: str, manifest_dict: t.Dict[str, t.Any]):
    version_string = manifest_dict["version"]
    split_version = version_string.split(".")
    major = int(split_version[0])
    middle = int(split_version[1])
    minor = int(split_version[2])
    if version_type == "major":
        major += 1
        middle = 0
        minor = 0
    elif version_type == "middle":
        middle += 1
        minor = 0
    elif version_type == "minor":
        minor += 1
    else:
        raise ValueError(f"Unknown version type: {version_type}")
    manifest_dict["version"] = ".".join(
        [str(x) for x in [major, middle, minor]])


def _get_manifests(root: pathlib.Path):
    return [root.joinpath(d + "/manifest.json") for d in BROWSER_DIRS]


def parse_args():
    """Parse arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("version_type",
                        type=str,
                        help="version type {major, middle, minor}")
    return parser.parse_args()


if __name__ == "__main__":
    main()
