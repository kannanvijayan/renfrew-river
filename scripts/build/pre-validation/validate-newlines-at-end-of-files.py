#!/usr/bin/env python3

import os
from pre_validation import common

def find_nonewline_files(path):
  """Find files that do not end with a newline character."""
  result = []
  for root, dirs, files in os.walk(path):
    for name in files:
      filename = os.path.join(root, name)
      with open(filename, 'rb') as f:
        contents = f.read()
        if not contents or contents[-1] != b'\n'[0]:
          result.append(filename + " --- " + repr(contents[-1] if len(contents) > 0 else b'!'))
  return result

def main():
  root_path = common.RUST_SRC_PATH
  print("Files that do not end with a newline character:")
  no_newline_files = find_nonewline_files(root_path)
  for filename in no_newline_files:
    stripped_filepath = filename[len(root_path) + 1:]
    print("  {}".format(stripped_filepath))
  if len(no_newline_files) > 0:
    print(
      "ERROR: {} files do not end with a newline character"
        .format(len(no_newline_files))
    )
    exit(1)

if __name__ == '__main__':
  main()
