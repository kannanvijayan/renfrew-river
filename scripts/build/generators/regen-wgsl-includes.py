#!/usr/bin/env python3

# Script to validate that WGSL files within the repository correctly
# embed the code defined in the `wgsl_library` dir.

import re
import os

from generators import common

def main():
  print("Regenerating wgsl includes in {:s}".format(common.GPU_COMMANDS_SUBPATH))
  print("")
  # List subdirs in commands dir
  subdirs = [
    { "dirname": d, "dirpath": os.path.join(common.GPU_COMMANDS_DIR, d) }
    for d in os.listdir(common.GPU_COMMANDS_DIR)
    if d != common.WGSL_LIBRARY_DIRNAME
    if os.path.isdir(os.path.join(common.GPU_COMMANDS_DIR, d))
  ]

  # Re-generate each subdir
  num_failed = 0
  for subdir in subdirs:
    if not regenerate_subdir(subdir):
      num_failed += 1
  if num_failed > 0:
    print("")
    print("ERROR: {:d} subdirs failed regeneration".format(num_failed))
    exit(1)

def regenerate_subdir(subdir):
  print("Checking `{:s}`".format(subdir["dirname"]))
  subdirpath = subdir["dirpath"]
  # Walk the entire tree under subdirpath, and validate each wgsl file
  num_failed = 0
  for root, dirs, files in os.walk(subdirpath):
    for filename in files:
      if filename.endswith(".wgsl"):
        file_succeeded = regenerate_wgsl_file(
          os.path.join(root, filename),
          os.path.join(filename)
        )
        if not file_succeeded:
          num_failed += 1
  return num_failed == 0

def regenerate_wgsl_file(filepath, subpath):
  print("  * {:s}".format(subpath))
  filedata = open(filepath).readlines()
  libsections = []
  section_names = set()

  def add_section(libname, start_line, end_line):
    section_names.add(libname)
    libsections.append({
      "name": libname,
      "start_line": start_line,
      "end_line": end_line,
    })

  cur_library = None
  cur_library_start_line = None
  num_failed = 0
  for (line_no, line) in enumerate(filedata):
    (libline_type, libname) = parse_library_line(line)
    if libline_type == "none":
      pass
    elif libline_type == "start":
      if cur_library:
        raise Exception("Library {:s} started before {:s} ended".format(
          libname, cur_library
        ))
      cur_library = libname
      cur_library_start_line = line_no
    elif libline_type == "end":
      if not cur_library:
        raise Exception("Library {:s} ended before it started".format(
          libname
        ))
      if cur_library != libname:
        raise Exception("Library {:s} ended before {:s} ended".format(
          libname, cur_library
        ))
      add_section(cur_library, cur_library_start_line + 1, line_no)
      cur_library = None
      cur_library_start_line = None

  # Current library should be None
  if cur_library:
    raise Exception("Library {:s} started but never ended".format(
      cur_library
    ))

  output_lines = []
  for (line_no, line) in enumerate(filedata):
    # check the next section.
    next_section = libsections[0] if len(libsections) > 0 else None
    if not next_section:
      output_lines.append(line)
      continue

    # Check to see if we're at or within the next session
    if line_no < next_section["start_line"]:
      # We're before the next section
      output_lines.append(line)
      continue
    elif line_no < next_section["end_line"]:
      # We're in the middle of the library.
      # Skip the line.
      continue
    else:
      assert(line_no == next_section["end_line"])
      # We've reached of the library section.
      # Output the library
      libname = next_section["name"]
      liblines = read_library_file(libname)
      output_lines.extend(liblines)
      # Write out the END_LIBRARY line
      output_lines.append(line)

      # Remove the section from the list
      libsections.pop(0)
      continue

  # Write out modified file.
  open(filepath, "w").write("".join(output_lines))

  return num_failed == 0


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
    libpath = os.path.join(common.WGSL_LIBRARY_PATH, libname + ".wgsl")
    LIBRARY_FILE_CACHE[libname] = open(libpath).readlines()
  return LIBRARY_FILE_CACHE[libname]

if __name__ == "__main__":
  print("HERE!")
  main()
