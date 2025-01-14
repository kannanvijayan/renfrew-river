use log;
use wgpu::{
  util::DeviceExt,
  BufferUsages
};
use std::{
  thread,
  rc::Rc,
  sync::{
    Arc,
    atomic::AtomicBool,
  },
};
use crate::gpu::GPU_MIN_BUFFER_SIZE;

use super::CogInvoke;


/**
 * Inner wrapper for Device and Queue.
 */
pub(crate) struct CogDeviceInner {
  // Device and queue.
  wgpu_device: Arc<wgpu::Device>,
  wgpu_queue: Arc<wgpu::Queue>,
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

    CogDeviceInner { wgpu_device, wgpu_queue, poll_thread }
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

  pub(crate) fn run_encoder<R, F>(&self, label: &str, f: F) -> R
    where F: FnOnce(&mut wgpu::CommandEncoder) -> R
  {
    let mut encoder = self.inner.wgpu_device.create_command_encoder(
      &wgpu::CommandEncoderDescriptor { label: Some("RunEncoder") }
    );
    let result = f(&mut encoder);
    let subidx = self.inner.wgpu_queue.submit(Some(encoder.finish()));
    let prior_time = std::time::Instant::now();
    self.inner.wgpu_device.poll(wgpu::Maintain::WaitForSubmissionIndex(subidx));
    let elapsed = prior_time.elapsed();
    log::info!("RunEncoder {} (elapsed_ms={})", label, elapsed.as_millis());
    result
  }

  pub(crate) fn perform_invoke(&self, invoke: &CogInvoke, label: &'static str) {
    self.run_encoder(label, |enc| invoke.execute(enc));
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
    self.inner.wgpu_device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
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
    let alloc_size = u64::max(size, GPU_MIN_BUFFER_SIZE);
    self.inner.wgpu_device.create_buffer(&wgpu::BufferDescriptor {
      label: Some(&label),
      size: alloc_size,
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
    self.inner.wgpu_device.create_shader_module(wgpu::ShaderModuleDescriptor {
      label: Some(name),
      source: wgpu::ShaderSource::Wgsl(source.into()),
    })
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
