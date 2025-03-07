use log;
use wgpu::{
  BufferUsages,
  util::DeviceExt,
};
use std::{
  thread,
  rc::Rc,
  sync::{
    Arc,
    atomic::AtomicBool,
  },
};
use crate::world::WorldDims;
use super::{
  constants::GPU_MIN_BUFFER_SIZE,
  CogUniformBuffer,
  CogUniformType,
  CogBufferType,
  CogEncoder,
  CogMapBuffer,
  CogSeqBuffer,
  CogShaderModule,
  CogShaderScript,
  CogShaderStore,
};


/**
 * Inner wrapper for Device and Queue.
 */
pub(crate) struct CogDeviceInner {
  // Device and queue.
  wgpu_device: Arc<wgpu::Device>,
  wgpu_queue: Arc<wgpu::Queue>,
  shader_store: CogShaderStore,
  poll_thread: PollThread,
}
impl CogDeviceInner {
  fn new() -> Self {
    let instance = wgpu::Instance::default();

    let adapter = futures::executor::block_on(
      instance.request_adapter(&wgpu::RequestAdapterOptions {
        power_preference: wgpu::PowerPreference::HighPerformance,
        compatible_surface: None,
        force_fallback_adapter: false,
      })
    ).expect("Failed to find a suitable GPU adapter");

    let (device, queue) = futures::executor::block_on(
        adapter.request_device(
        /* desc */
        &wgpu::DeviceDescriptor {
          label: None,
          features: wgpu::Features::empty(),
          limits: wgpu::Limits::default(),
        },
        /* trace_path */
        None
      )
    ).expect("Failed to create a GPU device");

    let wgpu_device = Arc::new(device);
    let wgpu_queue = Arc::new(queue);
    let poll_thread = PollThread::new(&wgpu_device);
    let shader_store = CogShaderStore::new();

    CogDeviceInner { wgpu_device, wgpu_queue, poll_thread, shader_store }
  }
}

impl Drop for CogDeviceInner {
  fn drop(&mut self) {
    self.poll_thread.terminate();
  }
}

/**
 * Encapsulates gpu device access.
 */
#[derive(Clone)]
pub(crate) struct CogDevice {
  inner: Rc<CogDeviceInner>,
}
impl CogDevice {
  pub(crate) fn new() -> Self {
    let inner = Rc::new(CogDeviceInner::new());
    Self { inner }
  }

  pub(crate) fn wgpu_device(&self) -> &wgpu::Device {
    &self.inner.wgpu_device
  }

  pub(crate) fn make_wgpu_encoder(&self, label: Option<&str>)
    -> wgpu::CommandEncoder
  {
    self.inner.wgpu_device.create_command_encoder(
      &wgpu::CommandEncoderDescriptor { label }
    )
  }

  pub(crate) fn encode_and_run<R, F>(&self, label: &str, f: F) -> R
    where F: FnOnce(&mut CogEncoder) -> R
  {
    let mut encoder = CogEncoder::new(self.clone(), label);
    let result = f(&mut encoder);
    let cmd_buffer = encoder.finish();
    let subidx = self.inner.wgpu_queue.submit(Some(cmd_buffer));
    let prior_time = std::time::Instant::now();
    self.inner.wgpu_device.poll(wgpu::Maintain::WaitForSubmissionIndex(subidx));
    let elapsed = prior_time.elapsed();
    log::info!("RunEncoder {} (elapsed_ms={})", label, elapsed.as_millis());
    result
  }

  /**
   * Creates a uniform buffer of some fixed size.
   */
  pub(crate) fn create_uniform_buffer<T>(&self, label: &str, value: T)
    -> CogUniformBuffer<T>
    where T: CogUniformType
  {
    return CogUniformBuffer::new(self, label, value);
  }

  /**
   * Creates a sequence buffer.
   */
  pub(crate) fn create_seq_buffer<T>(&self, len: usize, label: &str)
    -> CogSeqBuffer<T>
    where T: CogBufferType
  {
    CogSeqBuffer::<T>::new_uninit(self, len, label)
  }

  /**
   * Creates a map buffer.
   */
  pub(crate) fn create_map_buffer<T>(&self, dims: WorldDims, label: &str)
    -> CogMapBuffer<T>
    where T: CogBufferType
  {
    CogMapBuffer::<T>::new_uninit(self, dims, label)
  }

  /**
   * Create a compute buffer of some size.
   */
  pub(crate) fn create_wgpu_buffer(&self,
    size: u64,
    usage: BufferUsages,
    label: Option<&str>
  ) -> wgpu::Buffer {
    let label = match label {
      Some(label) => format!("Compute Buffer: {}", label),
      None => "Compute Buffer".to_string(),
    };
    let alloc_size = u64::max(size, GPU_MIN_BUFFER_SIZE);
    self.inner.wgpu_device.create_buffer(&wgpu::BufferDescriptor {
      label: Some(&label),
      size: alloc_size,
      usage,
      mapped_at_creation: false,
    })
  }

  /**
   * Create a compute buffer of some size.
   */
  pub(crate) fn create_wgpu_buffer_init(&self,
    contents: &[u8],
    usage: BufferUsages,
    label: Option<&str>
  ) -> wgpu::Buffer {
    let label = match label {
      Some(label) => format!("Compute Buffer: {}", label),
      None => "Compute Buffer".to_string(),
    };
    self.inner.wgpu_device.create_buffer_init(
      &wgpu::util::BufferInitDescriptor { label: Some(&label), contents, usage }
    )
  }

  /**
   * Create a compute shader module from a string.
   */
  pub(crate) fn create_shader_module<S: CogShaderScript>(&self)
    -> CogShaderModule<S>
  {
    self.inner.shader_store.get_or_create_shader_module::<S>(self)
  }

}


/**
 * A thread that sits around and polls the GPU for completion of tasks.
 */
struct PollThread {
  join_handle: Option<thread::JoinHandle<()>>,
  drop: Arc<AtomicBool>,
}
impl PollThread {
  pub(crate) fn new(device: &Arc<wgpu::Device>) -> Self {
    // Spawn a thread to keep polling the device.
    let drop = Arc::new(AtomicBool::new(false));
    let join_handle = {
      let drop_cloned = drop.clone();
      let device = device.clone();
      thread::spawn(move || {
        let drop = drop_cloned;
        loop {
          if drop.load(std::sync::atomic::Ordering::Relaxed) {
            break;
          }
          device.poll(wgpu::Maintain::Poll);
          thread::sleep(std::time::Duration::from_millis(10));
        }
      })
    };
    PollThread { join_handle: Some(join_handle), drop }
  }
}
impl PollThread {
  fn terminate(&mut self) {
    self.drop.store(true, std::sync::atomic::Ordering::Relaxed);
    if let Some(join_handle) = self.join_handle.take() {
      join_handle.join().unwrap();
    }
  }
}
