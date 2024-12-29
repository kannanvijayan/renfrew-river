
use std::{ time, process };

const SCRIPTS_BUILD_PRE_VALIDATION_DIR: &str =
  "./scripts/build/pre-validation";

#[derive(Clone, Copy)]
struct PreValidationScript {
  name: &'static str,
  filename: &'static str,
}
const PRE_VALIDATION_SCRIPTS: &[PreValidationScript] = &[
  PreValidationScript {
    name: "WGSL library usage",
    filename: "validate-wgsl-library-usage.py",
  },
  PreValidationScript {
    name: "Newlines at end of files",
    filename: "validate-newlines-at-end-of-files.py",
  },
];

fn main() {
  println!("cargo:rerun-if-changed=build.rs");
  println!("cargo:rerun-if-changed=src");

  // Print current time
  let cur_time =
    time::SystemTime::now()
      .duration_since(time::UNIX_EPOCH)
      .unwrap()
      .as_secs();
  let cur_dir =
    std::env::current_dir().expect("Failed to read cwd");
  let cur_dir_str = cur_dir.to_str().expect("Failed to convert cwd to string");
  println!("# Build script!\n");
  println!("");
  println!("  * time={}", cur_time);
  println!("  * cwd={}", cur_dir_str);
  println!("");

  // Run each pre-validation script.
  println!("# Pre-Validation");
  println!("");
  let mut success = true;
  for script in PRE_VALIDATION_SCRIPTS {
    let script_success = run_pre_validation_script(*script);
    success = success && script_success;
  }

  // exit with error code
  if success {
    process::exit(0);
  } else {
    process::exit(1);
  }
}

fn run_pre_validation_script(script: PreValidationScript) -> bool {
  let PreValidationScript { name, filename } = script;
  let script_path =
    format!("{}/{}", SCRIPTS_BUILD_PRE_VALIDATION_DIR, filename);
  println!("## {}", name);
  println!("");
  println!("**{}**", script_path);
  println!("```");
  let status = process::Command::new(&script_path).status();
  println!("```");
  println!("");
  let success = match status {
    Ok(status) => {
      if status.success() {
        print_succeeded();
        true
      } else {
        print_failed(&format!("Script failed: {} - {}", name, filename));
        false
      }
    },
    Err(e) => {
      print_failed(&format!("{:?}", e));
      false
    },
  };
  println!("");
  println!("");
  success
}

fn print_failed(msg: &str) {
  println!(r#"**Failed!: {}**"#, msg);
}
fn print_succeeded() {
  println!(r#"**Succeeded!**"#);
}
