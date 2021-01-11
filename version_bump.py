#!/usr/bin/env python3

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
    if (args.t == "major"):
        major += 1
    elif (args.t == "middle"):
        middle += 1
    elif (args.t == "minor"):
        minor += 1
    else:
        raise ValueError(f"Unknown version type: {args.t}")
    manifest_dict["version"] = ".".join(
        [str(x) for x in [major, middle, minor]])
    with open("manifest.json", "w") as f:
        f.write(json.dumps(manifest_dict, indent=4, sort_keys=True))


def parse_args():
    """Parse arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("t",
                        type=str,
                        help="version type (major, middle, minor)")
    return parser.parse_args()


if __name__ == "__main__":
    main()
