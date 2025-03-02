import os

ROOT_PATH = os.path.realpath(
  os.path.join(os.path.dirname(__file__), '..', '..')
)

RUST_SRC_PATH = os.path.join(ROOT_PATH, "src")

GPU_COMMANDS_SUBPATH = os.path.join("cog", "wgsl")
GPU_COMMANDS_DIR = os.path.join(RUST_SRC_PATH, GPU_COMMANDS_SUBPATH)

WGSL_LIBRARY_DIRNAME = "library"
WGSL_LIBRARY_SUBPATH = os.path.join("cog", "wgsl", WGSL_LIBRARY_DIRNAME)
WGSL_LIBRARY_PATH = os.path.join(GPU_COMMANDS_DIR, WGSL_LIBRARY_SUBPATH)
