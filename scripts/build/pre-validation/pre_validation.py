import os

ROOT_PATH = os.path.realpath(
  os.path.join(
    os.path.dirname(__file__),
    '..', '..', '..'
  )
)

RUST_SRC_PATH = os.path.join(ROOT_PATH, "src")

GPU_COMMANDS_SUBPATH = os.path.join("gpu", "compute", "commands")
GPU_COMMANDS_DIR = os.path.join(RUST_SRC_PATH, GPU_COMMANDS_SUBPATH)

WGSL_LIBRARY_DIRNAME = "wgsl_library"
WGSL_LIBRARY_PATH = os.path.join(GPU_COMMANDS_DIR, WGSL_LIBRARY_DIRNAME)