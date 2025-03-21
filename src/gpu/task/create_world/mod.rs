
mod border_fade_task;
mod compute_histogram_task;
mod compute_statistics_task;
mod rand_gen_task;
mod read_map_data_task;
mod read_minimap_data_task;
mod rescale_map_data_task;

pub(crate) use self::{
  border_fade_task::BorderFadeTask,
  compute_histogram_task::ComputeHistogramTask,
  compute_statistics_task::ComputeStatisticsTask,
  rand_gen_task::RandGenTask,
  read_map_data_task::ReadMapDataTask,
  read_minimap_data_task::ReadMinimapDataTask,
  rescale_map_data_task::RescaleMapDataTask,
};
