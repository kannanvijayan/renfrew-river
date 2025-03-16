use std::{
  path::Path,
  io::{ self, Write },
  fs,
};

pub(crate) fn append_to_file(path: &Path, data: &[u8]) -> io::Result<()> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .append(true)
        .open(path)?;

    file.write_all(data)?;
    Ok(())
}
