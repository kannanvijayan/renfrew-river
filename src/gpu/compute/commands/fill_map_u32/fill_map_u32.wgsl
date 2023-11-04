struct Uniforms {
  world_dims: vec2<u32>,
  value: u32,
};

struct MapBuffer {
  values: array<u32>,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, write> map: MapBuffer;

@compute
@workgroup_size(8, 8)
fn fill_map_u32(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let xy = global_id.xy;
  if (xy.x >= uniforms.world_dims.x || xy.y >= uniforms.world_dims.y) {
    return;
  }

  let tile_idx = xy.y * uniforms.world_dims.x + xy.x;
  map.values[tile_idx] = uniforms.value;
}
