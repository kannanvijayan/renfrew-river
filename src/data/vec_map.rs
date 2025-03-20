use std::iter::Iterator;
use crate::data::map::{ WorldDims, CellCoord };

/**
 * Map of some type T over the world tiles.
 */
pub(crate) struct VecMap<T> {
  dims: WorldDims,
  tiles: Vec<T>,
}
impl<T> VecMap<T> {
  pub(crate) fn new_default(dims: WorldDims) -> VecMap<T>
  where
    T: Clone + Default,
  {
    VecMap::new(dims, T::default())
  }
  pub(crate) fn new(dims: WorldDims, default: T) -> VecMap<T>
  where
    T: Clone,
  {
    let mut tiles = Vec::with_capacity(dims.area() as usize);
    for _ in 0..dims.area() {
      tiles.push(default.clone());
    }
    VecMap { dims, tiles }
  }
  pub(crate) fn from_vec(dims: WorldDims, tiles: Vec<T>) -> VecMap<T> {
    assert_eq!(dims.area() as usize, tiles.len());
    VecMap { dims, tiles }
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }

  pub(crate) fn get_copy(&self, coord: CellCoord) -> T
    where T: Copy
  {
    assert!(self.dims.contains_coord(coord));
    let index = self.dims.coord_index(coord) as usize;
    self.tiles[index]
  }

  pub(crate) fn get_ref(&self, coord: CellCoord) -> &T {
    assert!(self.dims.contains_coord(coord));
    let index = self.dims.coord_index(coord) as usize;
    &self.tiles[index]
  }

  pub(crate) fn get_mut(&mut self, coord: CellCoord) -> &mut T {
    assert!(self.dims.contains_coord(coord));
    let index = self.dims.coord_index(coord) as usize;
    &mut self.tiles[index]
  }

  pub(crate) fn get_row_slice_ref(&self, coord: CellCoord, len: u16) -> &[T] {
    assert!(self.dims.contains_coord(coord));
    assert!(
      self.dims.contains_coord(
        CellCoord::new(coord.col + len - 1, coord.row)
      )
    );
    let start_index = self.dims.coord_index(coord) as usize;
    let end_index = start_index + len as usize;
    &self.tiles[start_index..end_index]
  }

  pub(crate) fn set(&mut self, coord: CellCoord, value: T) {
    assert!(self.dims.contains_coord(coord));
    let index = self.dims.coord_index(coord) as usize;
    self.tiles[index] = value;
  }

  pub(crate) fn area_slice_iter(&self,
    start_coord: CellCoord,
    area: WorldDims,
  ) -> Option<VecMapAreaSliceIter<T>> {
    let end_coord = CellCoord::new(
      start_coord.col + area.columns - 1,
      start_coord.row + area.rows - 1,
    );
    if !self.dims.contains_coord(start_coord)
    || !self.dims.contains_coord(end_coord)
    || start_coord.col > end_coord.col
    || start_coord.row > end_coord.row
    {
      return None;
    }
    Some(VecMapAreaSliceIter {
      vec_map: self,
      start_coord,
      area,
      cur_row: 0,
    })
  }

  pub(crate) fn to_vec_of_vecs(&self) -> Vec<Vec<T>>
  where
    T: Clone,
  {
    self.tiles.chunks_exact(self.dims.columns_usize())
      .map(|row| row.to_vec())
      .collect()
  }
}

pub(crate) struct VecMapAreaSliceIter<'a, T> {
  vec_map: &'a VecMap<T>,
  start_coord: CellCoord,
  area: WorldDims,
  cur_row: u16,
}
impl<'a, T> Iterator for VecMapAreaSliceIter<'a, T> {
  type Item = &'a [T];
  fn next(&mut self) -> Option<Self::Item> {
    if self.cur_row >= self.area.rows {
      None
    } else {
      let row_slice = self.vec_map.get_row_slice_ref(
        CellCoord::new(
          self.start_coord.col,
          self.start_coord.row + self.cur_row
        ),
        self.area.columns,
      );
      self.cur_row += 1;
      Some(row_slice)
    }
  }
}
