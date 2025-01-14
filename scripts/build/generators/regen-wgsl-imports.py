#!/usr/bin/env python3

# Script that traverses a source tree, and processes "import" preprocessor
# statements.

import re
import os

from generators import common

# Information associated with a single script being processed.
class ScriptContext:
  def __init__(self, root_path, include_dirs, script_path, already_included=None):
    self.__root_path = os.path.normpath(root_path)
    self.__include_dirs = list(os.path.normpath(d) for d in include_dirs)
    self.__script_path = os.path.normpath(script_path)
    self.__script_dir = os.path.dirname(script_path)
    self.__script_lines = open(script_path).readlines()
    self.__already_included = set() if already_included is None else already_included

    if not script_path.startswith(root_path):
      raise Exception(
        "Script path {:s} is not under root path {:s}".format(
          script_path, root_path
        )
      )
  
  def process(self):
    output_lines = []
    # Process each line in the script.
    for line_no in range(len(self.__script_lines)):
      line = self.__script_lines[line_no]

      if self.__is_existing_generated_import(line):
        continue

      match = self.__check_import_line(line)
      if match is None:
        output_lines.append(line)
        continue
      
      [is_relative, path] = match
      embed_line = self.__process_import(path, is_relative, line_no)

      output_lines.append(line)
      if embed_line is not None:
        output_lines.append(embed_line)
      else:
        output_lines.append(self.__make_embed_comment(path) + " /* ALREADY INCLUDED */")

    return output_lines

  def __process_import(self, path, is_relative, line_no):
    # Look up the include file.
    if path in self.__already_included:
      return
    inc_path = self.__lookup_include(path, is_relative)
    if inc_path is None:
      raise Exception(
        "Unable to find include file {:s} at line {:d} in {:s}".format(
          path, line_no, self.__script_path
        )
      )
    
    # Process the include file.
    inc_ctx = ScriptContext(
      root_path=self.__root_path,
      include_dirs=self.__include_dirs,
      script_path=inc_path,
      already_included=self.__already_included
    )
    processed_lines = inc_ctx.process()

    # Replace all full-line comments with blank lines, and then
    # strip all blank lines, to avoid double-spacing.
    stripped_lines = []
    for proc_line in processed_lines:
      stripped = proc_line.strip()
      if stripped.startswith("//"):
        continue
      elif stripped == "":
        continue
      else:
        stripped_lines.append(stripped)

    # Join them all together using spaces, with a delimited comment at the start.
    result_pieces = []
    result_pieces.append(self.__make_embed_comment(inc_path))
    result_pieces.extend(stripped_lines)
    return " ".join(result_pieces)

  def __make_embed_comment(self, path):
    return "/* EMBED({:s}) */".format(path)

  def __is_existing_generated_import(self, line):
    return re.match("^/\\* EMBED", line) is not None

  def __check_import_line(self, line):
    # check relative import
    match = re.match("^//#import\\s+\\.([^\\s]+)\\s*$", line)
    if match:
      return [True, match.group(1)]
    
    # check absolute import
    match = re.match("^//#import\\s+:([^\\s]+)\\s*$", line)
    if match:
      return [False, match.group(1)]

    return None
  
  def __lookup_include(self, path, is_relative):
    if is_relative:
      inc_path = os.path.normpath(os.path.join(self.__script_dir, path))
      if os.path.exists(inc_path):
        return inc_path
    else:
      for inc_dir in self.__include_dirs:
        inc_path = os.path.normpath(os.path.join(inc_dir, path))
        if os.path.exists(inc_path):
          return inc_path
    return None


def main():
  src_root = common.RUST_SRC_PATH
  include_dirs = [common.WGSL_LIBRARY_PATH]

  overwrite_scripts = dict()

  # Process all the scripts in the source tree.
  for root, _, files in os.walk(src_root):
    for file in files:
      if not file.endswith(".wgsl"):
        continue
      script_path = os.path.join(root, file)
      ctx = ScriptContext(src_root, include_dirs, script_path)
      output_lines = ctx.process()
      overwrite_scripts[script_path] = output_lines

  # Write out the modified scripts.
  for (script_path, output_lines) in overwrite_scripts.items():
    # Only print if we're actually going to update the file.
    old_lines = open(script_path).readlines()
    if old_lines == output_lines:
      continue

    # Just print to stdout for now.
    print("Updating {:s}".format(script_path))
    with open(script_path, "w") as f:
      for line in output_lines:
        f.write(line)

if __name__ == "__main__":
  main()
