struct Uniforms {
  offset: u32,
  len: u32,
  segments: u32,
  value: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, write> output: array<u32>;

@compute
@workgroup_size(64)
fn fill_u32(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let x = global_id.x;
  if (x >= uniforms.segments) {
    return;
  }

  var segment_size = uniforms.len / uniforms.segments;
  if ((uniforms.len % uniforms.segments) > 0u) {
    segment_size += 1u;
  }

  let segment_offset = uniforms.offset + (segment_size * x);
  let segment_end = min(uniforms.len, segment_offset + segment_size);

  for (var i = segment_offset; i < segment_end; i = i + 1u) {
    output[i] = uniforms.value;
  }
}
