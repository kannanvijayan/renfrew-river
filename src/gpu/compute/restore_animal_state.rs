use crate::{
  game::constants,
  world::{ AnimalId, WorldDims },
  gpu::{
    GpuDevice,
    GpuSeqBuffer,
    GpuBufferOptions,
    world::{ GpuAnimalsList, GpuAnimalsMap },
  },
  persist::AnimalPersist,
};
use super::commands::{ fill_map_u32_command, restore_animal_state_command };

/**
 * Restore animal state from snapshot data.
 */
pub(crate) async fn restore_animal_state(
  device: &GpuDevice,
  world_dims: WorldDims,
  animals_list_persist: impl ExactSizeIterator<Item=&AnimalPersist>,
) -> (GpuAnimalsList, GpuAnimalsMap) {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeAnimalsEncoder"),
    }
  );

  let animals_map = GpuAnimalsMap::new(
    device,
    world_dims,
    "RestoreAnimalStateAnimalsMap",
  );

  fill_map_u32_command(
    device,
    &mut encoder,
    animals_map.buffer().cast_as_native_type(),
    AnimalId::INVALID.to_u32()
  );

  let animals_list = GpuAnimalsList::new(
    device,
    constants::MAX_ANIMALS,
    "RestoreAnimalStateOutAnimalsList"
  );

  let animals_list_persist_tmp_buffer =
    GpuSeqBuffer::from_iter_for_write(device, animals_list_persist).await;
  
  let animals_list_persist_buffer = GpuSeqBuffer::<AnimalPersist>::new(
    device,
    animals_list_persist_tmp_buffer.length(),
    GpuBufferOptions::empty()
      .with_label("RestoreAnimalStateAnimalsListPersistBuffer")
      .with_storage(true)
      .with_copy_dst(true)
  );
  encoder.copy_buffer_to_buffer(
    animals_list_persist_tmp_buffer.wgpu_buffer(),
    0,
    animals_list_persist_buffer.wgpu_buffer(),
    0,
    animals_list_persist_tmp_buffer.wgpu_buffer().size(),
  );

  restore_animal_state_command(
    device,
    &mut encoder,
    world_dims,
    &animals_list_persist_buffer,
    &animals_list,
    &animals_map,
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("restore_animal_state(elapsed_ms={})", elapsed.as_millis());

  (animals_list, animals_map)
}
