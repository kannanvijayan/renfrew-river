use log;
use wgpu::{
  util::DeviceExt,
  BufferUsages
};
use std::{
  thread,
  sync::{
    Arc,
    atomic::AtomicBool,
  }
};

/**
 * Inner wrapper for Device and Queue.
 */
pub(crate) struct GpuDeviceInner {
  // Device and queue.
  device: wgpu::Device,
  queue: wgpu::Queue,
}

/**
 * Encapsulates gpu device access.
 */
pub(crate) struct GpuDevice {
  inner: Arc<GpuDeviceInner>,

  // Flag to indicate that the device is dropped.
  is_dropped: Arc<AtomicBool>,

  // Thread to keep polling the device, wrapped in an option
  // so that it can be taken out when the device is dropped.
  poll_thread: Option<thread::JoinHandle<()>>
}
impl GpuDevice {
  pub(crate) async fn new() -> Self {
    let instance = wgpu::Instance::default();

    let adapter = instance.request_adapter(&wgpu::RequestAdapterOptions {
      power_preference: wgpu::PowerPreference::HighPerformance,
      compatible_surface: None,
      force_fallback_adapter: false,
    }).await.expect("Failed to find a suitable GPU adapter");

    let mut limits = wgpu::Limits::default();
    limits.max_storage_buffer_binding_size = 1 << 29;
    log::info!("rewnfrew_river::gpu::gpu_device::GpuDevice::new: limits={:?}", limits);
    let (device, queue) = adapter.request_device(
      /* desc */
      &wgpu::DeviceDescriptor {
        label: None,
        features: wgpu::Features::empty(),
        limits,
      },
      /* trace_path */
      None
    ).await.expect("Failed to create a GPU device");

    let inner = Arc::new(GpuDeviceInner { device, queue });
    let is_dropped = Arc::new(AtomicBool::new(false));

    // Spawn a thread to keep polling the device.
    let thread_is_dropped = is_dropped.clone();
    let thread_inner = inner.clone();
    let poll_thread = thread::spawn(move || {
      loop {
        if thread_is_dropped.load(std::sync::atomic::Ordering::Relaxed) {
          break;
        }
        thread_inner.device.poll(wgpu::Maintain::Poll);
        thread::sleep(std::time::Duration::from_millis(10));
      }
    });

    Self { inner, is_dropped, poll_thread: Some(poll_thread) }
  }

  pub(crate) fn device(&self) -> &wgpu::Device {
    &self.inner.device
  }

  pub(crate) fn queue(&self) -> &wgpu::Queue {
    &self.inner.queue
  }

  /**
   * Creates a uniform buffer of some fixed size.
   */
  pub(crate) fn create_uniform_buffer(&self,
    data: &[u8],
    label: Option<&str>
  ) -> wgpu::Buffer {
    let label = match label {
      Some(label) => format!("Uniform Buffer: {}", label),
      None => "Uniform Buffer".to_string(),
    };
    self.inner.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
      label: Some(&label),
      contents: data,
      usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
    })
  }

  /**
   * Create a compute buffer of some size.
   */
  pub(crate) fn create_buffer(&self,
    size: u64,
    usage: BufferUsages,
    label: Option<&str>
  ) -> wgpu::Buffer {
    let label = match label {
      Some(label) => format!("Compute Buffer: {}", label),
      None => "Compute Buffer".to_string(),
    };
    self.inner.device.create_buffer(&wgpu::BufferDescriptor {
      label: Some(&label),
      size: size,
      usage,
      mapped_at_creation: false,
    })
  }

  /**
   * Create a compute shader module from a string.
   */
  pub(crate) fn create_shader_module(&self, source: &str, name: &str)
    -> wgpu::ShaderModule
  {
    self.inner.device.create_shader_module(wgpu::ShaderModuleDescriptor {
      label: Some(name),
      source: wgpu::ShaderSource::Wgsl(source.into()),
    })
  }

}

impl Drop for GpuDevice {
  fn drop(&mut self) {
    self.is_dropped.store(true, std::sync::atomic::Ordering::Relaxed);
    self.poll_thread.take().unwrap().join()
      .expect("Failed to join wgpu poll thread");
  }
}
