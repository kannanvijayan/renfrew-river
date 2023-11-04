
# Script to validate that WGSL files within the repository correctly
# embed the code defined in the `wgsl_library` dir.

import re
import os

from pre_validation import (
  GPU_COMMANDS_DIR,
  WGSL_LIBRARY_DIRNAME,
  WGSL_LIBRARY_PATH,
)


def main():
  print("Validating wgsl usage within {:s}".format(GPU_COMMANDS_DIR))
  # List subdirs in commands dir
  subdirs = [
    { "dirname": d, "dirpath": os.path.join(GPU_COMMANDS_DIR, d) }
    for d in os.listdir(GPU_COMMANDS_DIR)
    if d != WGSL_LIBRARY_DIRNAME
    if os.path.isdir(os.path.join(GPU_COMMANDS_DIR, d))
  ]

  # Validate each subdir
  for subdir in subdirs:
    validate_subdir(subdir)

def validate_subdir(subdir):
  print("Checking `{:s}`".format(subdir["dirname"]))
  subdirpath = subdir["dirpath"]
  # Walk the entire tree under subdirpath, and validate each wgsl file
  for root, dirs, files in os.walk(subdirpath):
    for filename in files:
      if filename.endswith(".wgsl"):
        validate_wgsl_file(
          os.path.join(root, filename),
          os.path.join(filename)
        )

def validate_wgsl_file(filepath, subpath):
  print("  * {:s}".format(subpath))
  filedata = open(filepath).readlines()

  cur_library = None
  cur_library_lines = None
  for line in filedata:
    (libline_type, libname) = parse_library_line(line)
    if libline_type == "none":
      if cur_library:
        cur_library_lines.append(line)
    if libline_type == "start":
      if cur_library:
        raise Exception("Library {:s} started before {:s} ended".format(
          libname, cur_library
        ))
      cur_library = libname
      cur_library_lines = []
    elif libline_type == "end":
      if not cur_library:
        raise Exception("Library {:s} ended before it started".format(
          libname
        ))
      if cur_library != libname:
        raise Exception("Library {:s} ended before {:s} ended".format(
          libname, cur_library
        ))
      # Validate the library
      validate_library(cur_library, cur_library_lines)
      cur_library = None
      cur_library_lines = None

def validate_library(libname, used_lines):
  orig_lines = read_library_file(libname)
  matched = orig_lines == used_lines
  # print("Matching\n\n{:s}\nvs\n{:s}".format(repr(orig_lines), repr(used_lines)))
  if matched:
    print("    - Library ok: {:s}".format(libname))
  else:
    print("    - Library FAILED: {:s}".format(libname))


LIBRARY_REGEX = r"// LIBRARY\((\w+)\)"
END_LIBRARY_REGEX = r"// END_LIBRARY\((\w+)\)"
def parse_library_line(line):
  # Parse a line like `// LIBRARY(libname)`
  match_lib = re.match(LIBRARY_REGEX, line)
  match_endlib = re.match(END_LIBRARY_REGEX, line)
  if match_lib:
    return ("start", match_lib.group(1))
  elif match_endlib:
    return ("end", match_endlib.group(1))
  else:
    return ("none", None)

LIBRARY_FILE_CACHE = {}
def read_library_file(libname):
  if libname not in LIBRARY_FILE_CACHE:
    libpath = os.path.join(WGSL_LIBRARY_PATH, libname + ".wgsl")
    LIBRARY_FILE_CACHE[libname] = open(libpath).readlines()
  return LIBRARY_FILE_CACHE[libname]

if __name__ == "__main__":
  main()