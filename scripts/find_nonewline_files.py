#!/usr/bin/env python3

import os

PATHS = [
  "./src",
  "./clients/pixijs-ui/src"
]

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
  """Main function."""
  for path in PATHS:
    print("Files in {} that do not end with a newline character:".format(path))
    for filename in find_nonewline_files(path):
      print("  {}".format(filename))

if __name__ == '__main__':
  main()
