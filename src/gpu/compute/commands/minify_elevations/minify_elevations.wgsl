
struct Uniforms {
  world_dims: vec2<u32>,
  out_dims: vec2<u32>,
  significant_bits: u32,
};

struct Buffer2D {
  values: array<u32>,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> src_surface: Buffer2D;

@group(0) @binding(2)
var<storage, write> dst_surface: Buffer2D;

fn read_cell(coord: vec2<u32>) -> u32 {
  let offset_u16 = (coord.y * uniforms.world_dims.x) + coord.x;
  let offset_u32 = offset_u16 >> 1u;   // offset_u16 / 2
  let shift = (offset_u16 & 1u) << 4u; // (offset_u16 % 2) * 16
  return (src_surface.values[offset_u32] >> shift) & 0xFFFFu;
}

fn tile_value(tile: vec2<f32>, tile_dims: vec2<f32>) -> u32 {
  let tile_tl = vec2<u32>(floor(tile * tile_dims));
  let tile_br = vec2<u32>(floor((tile + vec2<f32>(1.0, 1.0)) * tile_dims));
  let tile_dims_u32 = tile_br - tile_tl;

  var sum: u32 = 0u;
  for (var y = tile_tl.y; y < tile_br.y; y = y + 1u) {
    for (var x = tile_tl.x; x < tile_br.x; x = x + 1u) {
      sum += read_cell(vec2<u32>(x, y));
    }
  }
  let avg = f32(sum) / f32(tile_dims_u32.x * tile_dims_u32.y);
  return u32(avg);
}

@compute
@workgroup_size(8, 8)
fn mini_elevations_u16(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let tile_dims =
    vec2<f32>(uniforms.world_dims) / vec2<f32>(uniforms.out_dims);
  
  if (
    global_id.x >= uniforms.out_dims.x / 2u ||
    global_id.y >= uniforms.out_dims.y
  ) {
    return;
  }

  // Each shader invocation handles 2 horizontal tiles.
  let tile0 = global_id.xy * vec2<u32>(2u, 1u);
  let v0 = tile_value(vec2<f32>(tile0), tile_dims);

  let tile1 = tile0 + vec2<u32>(1u, 0u);
  let v1 = tile_value(vec2<f32>(tile1), tile_dims);

  let v = (v1 << 16u) | v0;

  let out_offset = (global_id.y * (uniforms.out_dims.x / 2u)) + global_id.x;
  dst_surface.values[out_offset] = v;
}
