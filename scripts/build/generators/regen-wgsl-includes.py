#!/usr/bin/env python3

# Script to validate that WGSL files within the repository correctly
# embed the code defined in the `wgsl_library` dir.

import re
import os

from generators import common

def main():
  regenerate_library_dir()
  regenerate_command_dirs()

def regenerate_library_dir():
  print("")
  print("")
  print("Regenerating wgsl library in {:s}".format(common.WGSL_LIBRARY_PATH))
  print("")
  # List all files in library dir
  library_files = [
    os.path.join(common.WGSL_LIBRARY_PATH, f)
    for f in os.listdir(common.WGSL_LIBRARY_PATH)
    if f.endswith(".wgsl")
  ]
  num_failed = 0
  for library_file in library_files:
    libname = os.path.basename(library_file)[:-len(".wgsl")]
    try:
      regenerate_file_overwrite(library_file, "LIBRARY: {:s}".format(libname))
    except Exception as e:
      print("regen_library ERROR: {:s}".format(str(e)))
      raise
      num_failed += 1
  if num_failed > 0:
    print("")
    print("regen_library ERROR: {:d} library files failed regeneration".format(
      num_failed
    ))
    exit(1)

def regenerate_command_dirs():
  print("")
  print("")
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
    if not regenerate_command_subdir(subdir):
      num_failed += 1
  if num_failed > 0:
    print("")
    print("regen_cmds ERROR: {:d} subdirs failed regeneration".format(num_failed))
    exit(1)

def regenerate_command_subdir(subdir):
  print("Checking `{:s}`".format(subdir["dirname"]))
  subdirpath = subdir["dirpath"]

  # Walk the entire tree under subdirpath, and validate each wgsl file
  num_failed = 0
  for root, dirs, files in os.walk(subdirpath):
    for filename in files:
      if filename.endswith(".wgsl"):
        # Keep a seen-set of library names already included
        # to avoid including the same library multiple times.
        try:
          filepath = os.path.join(root, filename)
          subpath = os.path.join(filename)
          regenerate_file_overwrite(filepath, subpath)
        except Exception as e:
          print("regen_cmd_dir ERROR: {:s}".format(str(e)))
          num_failed += 1
  return num_failed == 0

def regenerate_file_overwrite(filepath, subpath):
  generated_lines = generate_wgsl_file(filepath, subpath, set())
  # Write out modified file.
  open(filepath, "w").write("".join(generated_lines))

class Section:
  def __init__(self, name, start_line, end_line):
    self.name = name
    self.start_line = start_line
    self.end_line = end_line

class LibStackEntry:
  def __init__(self, name, start_line):
    self.name = name
    self.start_line = start_line

def generate_wgsl_file(filepath, subpath, seen_libnames):
  print("  * {:s}".format(subpath))
  filedata = open(filepath).readlines()
  libsections = []
  section_names = set()

  def add_section(libname, start_line, end_line):
    section_names.add(libname)
    libsections.append(Section(libname, start_line, end_line))

  lib_stack = []

  def push_lib(libname, start_line):
    lib_stack.append(LibStackEntry(libname, start_line))
  def peek_lib():
    return lib_stack[-1] if len(lib_stack) > 0 else None
  def pop_lib():
    return lib_stack.pop() if len(lib_stack) > 0 else None

  for (line_no, line) in enumerate(filedata):
    (libline_type, libname) = parse_library_line(line)
    if libline_type == "none":
      pass
    elif libline_type == "start":
      push_lib(libname, line_no)
    elif libline_type == "end":
      cur_library = pop_lib()
      if not cur_library:
        raise Exception("Library {:s} ended before it started".format(
          libname
        ))

      # Library names should match for corresponding start and end lines.
      if cur_library.name != libname:
        raise Exception("Library {:s} ended before {:s} ended".format(
          libname, cur_library.name
        ))

      # if the library stack is not empty now, then this is ending a nested
      # library.  Ignore it, since the interpolation of the library will
      # take care of internal libraries.
      if len(lib_stack) > 0:
        continue

      # Otherwise, this is the end of the top-level library.
      # Add it to the list of sections.
      add_section(cur_library.name, cur_library.start_line + 1, line_no)
      pop_lib()

  # Library stack should be empty.
  if len(lib_stack) > 0:
    raise Exception(
      "Unclosed libraries {:s} started but never ended".format(
        [lib.name for lib in lib_stack].join(", ")
      )
    )

  output_lines = []
  for (line_no, line) in enumerate(filedata):
    # check the next section.
    next_section = libsections[0] if len(libsections) > 0 else None
    if not next_section:
      output_lines.append(line)
      continue

    # Check to see if we're at or within the next session
    if line_no < next_section.start_line:
      # We're before the next section
      output_lines.append(line)
      continue
    elif line_no < next_section.end_line:
      # We're in the middle of the library.
      # Skip the line.
      continue
    else:
      assert(line_no == next_section.end_line)
      # We've reached of the library section.
      # Output the library
      libname = next_section.name
      if libname in seen_libnames:
        output_lines.append(
          "// Library {:s} already included\n".format(libname)
        )
      else:
        seen_libnames.add(libname)
        liblines = read_library_file(libname, seen_libnames)
        output_lines.extend(liblines)
      # Write out the END_LIBRARY line
      output_lines.append(line)

      # Remove the section from the list
      libsections.pop(0)
      continue
  return output_lines

LIBRARY_REGEX = r"// LIBRARY\((\w+)\)"
END_LIBRARY_REGEX = r"// END_LIBRARY\((\w+)\)"
def parse_library_line(line):
  match_lib = re.match(LIBRARY_REGEX, line)
  match_endlib = re.match(END_LIBRARY_REGEX, line)
  if match_lib:
    return ("start", match_lib.group(1))
  elif match_endlib:
    return ("end", match_endlib.group(1))
  else:
    return ("none", None)

def read_library_file(libname, seen_libnames):
  libpath = os.path.join(common.WGSL_LIBRARY_PATH, libname + ".wgsl")
  # regenerate the library wgsl file to fix up any includes it has.
  return generate_wgsl_file(
    libpath,
    "LIBRARY: {:s}".format(libname),
    seen_libnames
  )

if __name__ == "__main__":
  print("HERE!")
  main()
