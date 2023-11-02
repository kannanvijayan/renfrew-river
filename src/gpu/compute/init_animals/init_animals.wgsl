struct Uniforms {
  world_dims: vec2<u32>,
  rand_seed: u32,
  rand_category: u32,
  animal_count: u32,
};

struct AnimalsBuffer {
  values: array<u32>,
};

struct AnimalsMapBuffer {
  animal_ids: array<u32>,
}

struct ConflictsMapBuffer {
  values: array<atomic<u32>>,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, write> animals: AnimalsBuffer;

@group(0) @binding(2)
var<storage, write> animals_map: AnimalsMapBuffer;

@group(0) @binding(3)
var<storage, read_write> conflicts: ConflictsMapBuffer;


// LIBRARY("xxhash")
fn rot_left(val: vec4<u32>, rot: vec4<u32>) -> vec4<u32> {
  return (val << rot) | (val >> (32u - rot));
}

const XXHASH_PRIME_1: u32 = 2654435761u;
const XXHASH_PRIME_2: u32 = 2246822519u;
const XXHASH_PRIME_3: u32 = 3266489917u;
fn xxhash(seed: u32, values: vec4<u32>) -> u32 {
  let state: vec4<u32> = vec4<u32>(
    seed + XXHASH_PRIME_1 + XXHASH_PRIME_2,
    seed + XXHASH_PRIME_2,
    seed,
    seed - XXHASH_PRIME_1,
  );
  let pre_rotate = (state + values) * XXHASH_PRIME_2;
  let new_state = rot_left(
    rot_left(pre_rotate, vec4<u32>(13u)) * XXHASH_PRIME_1,
    vec4<u32>(1u, 7u, 12u, 18u)
  );

  var res = 16u + new_state[0] + new_state[1] + new_state[2] + new_state[3];
  res = (res ^ (res >> 15u)) * XXHASH_PRIME_2;
  res = (res ^ (res >> 13u)) * XXHASH_PRIME_3;
  return res ^ (res >> 16u);
}
// END_LIBRARY("xxhash")

@compute
@workgroup_size(64)
fn init_animals(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let idx = global_id.x;
  if (idx >= uniforms.animal_count) {
    return;
  }

  let pos_rand = xxhash(
    uniforms.rand_seed,
    vec4<u32>(uniforms.rand_category, idx, 0u, 0u));
  let unclamped_xy = vec2<u32>(pos_rand & 0xFFFFu, pos_rand >> 16u);
  let xy = unclamped_xy % uniforms.world_dims;

  let posn_offset = (xy.y * uniforms.world_dims.x) + xy.x;
  let old_val = atomicAdd(&conflicts.values[posn_offset], 1u);
  if (old_val > 0u) {
    animals.values[idx] = 0xFFFFFFFFu;
    return;
  }

  animals.values[idx] = (xy.y << 16u) | xy.x;
  animals_map.animal_ids[posn_offset] = idx;
}