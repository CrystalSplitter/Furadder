#!/usr/bin/env python3
"""Bump the version of the manifest.json."""

import argparse
import json


def main():
    """Bump the version."""
    args = parse_args()
    with open("manifest.json", "r") as f:
        manifest_dict = json.loads(f.read())
    version_string = manifest_dict["version"]
    split_version = version_string.split(".")
    major = int(split_version[0])
    middle = int(split_version[1])
    minor = int(split_version[2])
    if (args.version_type == "major"):
        major += 1
        middle = 0
        minor = 0
    elif (args.version_type == "middle"):
        middle += 1
        minor = 0
    elif (args.version_type == "minor"):
        minor += 1
    else:
        raise ValueError(f"Unknown version type: {args.version_type}")
    manifest_dict["version"] = ".".join(
        [str(x) for x in [major, middle, minor]])
    with open("manifest.json", "w") as f:
        f.write(json.dumps(manifest_dict, indent=4, sort_keys=True))


def parse_args():
    """Parse arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("version_type",
                        type=str,
                        help="version type {major, middle, minor}")
    return parser.parse_args()


if __name__ == "__main__":
    main()
