#!/usr/bin/env python3

import os
from pre_validation import RUST_SRC_PATH

def find_nonewline_files(path):
  """Find files that do not end with a newline character."""
  result = []
  for root, dirs, files in os.walk(path):
    for name in files:
      filename = os.path.join(root, name)
      with open(filename, 'rb') as f:
        f.seek(-1, os.SEEK_END)
        last_byte = f.read(1)
        if last_byte != b'\n':
          result.append(filename)
  return result


def main():
  root_path = RUST_SRC_PATH
  print("Files in {} that do not end with a newline character:".format(root_path))
  for filename in find_nonewline_files(root_path):
    print("  {}".format(filename))

if __name__ == '__main__':
  main()