use std::{
  fs,
  path::{ Path, PathBuf },
  io::{ self, Write, Read },
};

pub(crate) struct FileManager {
  root_dir: PathBuf,
}

impl FileManager {
  pub(crate) fn new(root_dir: &Path) -> Self {
    FileManager { root_dir: root_dir.to_path_buf() }
  }

  pub(crate) fn root(&self) -> FileManagerSubtree {
    FileManagerSubtree::new(self.root_dir.clone())
  }
}

pub(crate) struct FileManagerSubtree {
  subtree_dir: PathBuf,
}
impl FileManagerSubtree {
  fn new(subtree_dir: PathBuf) -> Self {
    FileManagerSubtree { subtree_dir }
  }

  pub(crate) fn path(&self) -> &Path {
    &self.subtree_dir
  }

  pub(crate) fn subdir(&self, name: &str) -> FileManagerSubtree {
    let mut path = self.subtree_dir.clone();
    path.push(name);
    FileManagerSubtree::new(path)
  }

  pub(crate) fn list(&self) -> io::Result<Vec<String>> {
    let mut entries = Vec::new();
    for entry in fs::read_dir(&self.subtree_dir)? {
      let entry = entry?;
      entries.push(entry.file_name().to_string_lossy().to_string());
    }
    Ok(entries)
  }

  pub(crate) fn read(&self, name: &str) -> io::Result<String> {
    let mut path = self.subtree_dir.clone();
    path.push(name);
    let mut file = fs::File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
  }

  pub(crate) fn write(&self, name: &str, contents: &str) -> io::Result<()> {
    let mut path = self.subtree_dir.clone();
    path.push(name);
    let mut file = fs::File::create(path)?;
    file.write_all(contents.as_bytes())?;
    Ok(())
  }

  pub(crate) fn delete(&self, name: &str) -> io::Result<()> {
    let mut path = self.subtree_dir.clone();
    path.push(name);
    fs::remove_file(path)
  }
}
