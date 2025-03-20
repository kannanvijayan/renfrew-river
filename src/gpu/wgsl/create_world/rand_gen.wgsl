
// LIBRARY(perlin64)

// LIBRARY(xxhash)
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
// END_LIBRARY(xxhash)

// LIBRARY(int64)

// Int64 - 64-bit signed integer type
////////////////////////////////////////////////////////////

struct Int64 {
  value: vec2<u32>,
}

fn int64_from_u32(value: u32) -> Int64 {
  return Int64(vec2<u32>(value, 0u));
}

fn int64_from_i32(value: i32) -> Int64 {
  return Int64(vec2<u32>(u32(value), u32(value >> 31u)));
}

fn int64_shl(a: Int64, b: u32) -> Int64 {
  if (b >= 32u) {
    return Int64(vec2<u32>(0u, a.value.x << (b - 32u)));
  } else {
    return Int64(vec2<u32>(a.value.x << b, (a.value.y << b) | (a.value.x >> (32u - b))));
  }
}

fn int64_shr(a: Int64, b: u32) -> Int64 {
  if (b >= 32u) {
    return Int64(vec2<u32>(u32(i32(a.value.y) >> (b - 32u)), u32(i32(a.value.y) >> 31u)));
  } else {
    return Int64(vec2<u32>(
      (a.value.x >> b) | (a.value.y << (32u - b)),
      u32(i32(a.value.y) >> b)
    ));
  }
}

fn int64_complement(a: Int64) -> Int64 {
  return Int64(vec2<u32>(~a.value.x, ~a.value.y));
}

fn int64_negate(a: Int64) -> Int64 {
  let low: u32 = ~a.value.x + 1u;
  var high: u32 = ~a.value.y;
  // Check for overflow / carry.
  if (low == 0u) {
    high += 1u;
  }
  return Int64(vec2<u32>(low, high));
}

fn int64_add(a: Int64, b: Int64) -> Int64 {
  let low: u32 = a.value.x + b.value.x;
  var high: u32 = a.value.y + b.value.y;
  // Check for overflow / carry.
  if (low < a.value.x) {
    high += 1u;
  }
  return Int64(vec2<u32>(low, high));
}

fn int64_sub(a: Int64, b: Int64) -> Int64 {
  let low: u32 = a.value.x - b.value.x;
  var high: u32 = a.value.y - b.value.y;
  // Check for overflow / carry.
  if (low > a.value.x) {
    high -= 1u;
  }
  return Int64(vec2<u32>(low, high));
}

fn int64_mul(a: Int64, b: Int64) -> Int64 {
  let a_low: u32 = a.value.x;
  let a_high: u32 = a.value.y;
  let b_low: u32 = b.value.x;
  let b_high: u32 = b.value.y;

  let a_00 = a_low & 0xFFFFu;
  let a_01 = (a_low >> 16u) & 0xFFFFu;
  let a_10 = a_high & 0xFFFFu;
  let a_11 = u32(i32(a_high) >> 16u);

  let b_00 = b_low & 0xFFFFu;
  let b_01 = (b_low >> 16u) & 0xFFFFu;
  let b_10 = b_high & 0xFFFFu;
  let b_11 = u32(i32(b_high) >> 16u);

  let ab_00_00 = int64_from_u32(a_00 * b_00);
  let ab_00_01 = int64_from_u32(a_00 * b_01);
  let ab_00_10 = int64_from_u32(a_00 * b_10);
  let ab_00_11 = int64_from_u32(a_00 * b_11);

  let ab_01_00 = int64_from_u32(a_01 * b_00);
  let ab_01_01 = int64_from_u32(a_01 * b_01);
  let ab_01_10 = int64_from_u32(a_01 * b_10);

  let ab_10_00 = int64_from_u32(a_10 * b_00);
  let ab_10_01 = int64_from_u32(a_10 * b_01);

  let ab_11_00 = int64_from_u32(a_11 * b_00);

  let sum_00 =
    int64_add(
      ab_00_00,
      int64_add(
        int64_shl(ab_00_01, 16u),
        int64_add(
          int64_shl(ab_00_10, 32u),
          int64_shl(ab_00_11, 48u)
        )
      )
    );
  let sum_01 =
    int64_add(
      int64_shl(ab_01_00, 16u),
      int64_add(
        int64_shl(ab_01_01, 32u),
        int64_shl(ab_01_10, 48u),
      )
    );
  let sum_10 = int64_add(int64_shl(ab_10_00, 32u), int64_shl(ab_10_01, 48u));
  let sum_11 = int64_shl(ab_11_00, 48u);

  return int64_add(int64_add(sum_00, sum_01), int64_add(sum_10, sum_11));
}

fn int64_cmp(a: Int64, b: Int64) -> i32 {
  if (i32(a.value.y) > i32(b.value.y)) {
    return 1;
  } else if (i32(a.value.y) < i32(b.value.y)) {
    return -1;
  } else if (a.value.x > b.value.x) {
    return 1;
  } else if (a.value.x < b.value.x) {
    return -1;
  } else {
    return 0;
  }
}

fn int64_eq(a: Int64, b: Int64) -> bool {
  return (a.value.x == b.value.x) && (a.value.y == b.value.y);
}

fn int64_ne(a: Int64, b: Int64) -> bool {
  return (a.value.x != b.value.x) || (a.value.y != b.value.y);
}

fn int64_le(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) <= 0;
}

fn int64_lt(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) < 0;
}

fn int64_ge(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) >= 0;
}

fn int64_gt(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) > 0;
}

fn int64_clamp(a: Int64, min: Int64, max: Int64) -> Int64 {
  if (int64_lt(a, min)) {
    return min;
  } else if (int64_gt(a, max)) {
    return max;
  } else {
    return a;
  }
}


// Vec2Int64 - 64-bit signed integer vector type
////////////////////////////////////////////////////////////

struct Vec2Int64 {
  x: Int64,
  y: Int64,
}

fn vec2int64_new(x: Int64, y: Int64) -> Vec2Int64 {
  return Vec2Int64(x, y);
}

fn vec2int64_from_vec2u32(v: vec2<u32>) -> Vec2Int64 {
  return Vec2Int64(int64_from_u32(v.x), int64_from_u32(v.y));
}

fn vec2int64_from_vec2i32(v: vec2<i32>) -> Vec2Int64 {
  return Vec2Int64(int64_from_i32(v.x), int64_from_i32(v.y));
}

fn vec2int64_shl(a: Vec2Int64, b: u32) -> Vec2Int64 {
  return Vec2Int64(int64_shl(a.x, b), int64_shl(a.y, b));
}

fn vec2int64_shr(a: Vec2Int64, b: u32) -> Vec2Int64 {
  return Vec2Int64(int64_shr(a.x, b), int64_shr(a.y, b));
}

fn vec2int64_complement(a: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_complement(a.x), int64_complement(a.y));
}

fn vec2int64_negate(a: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_negate(a.x), int64_negate(a.y));
}

fn vec2int64_add(a: Vec2Int64, b: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_add(a.x, b.x), int64_add(a.y, b.y));
}

fn vec2int64_sub(a: Vec2Int64, b: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_sub(a.x, b.x), int64_sub(a.y, b.y));
}

fn vec2int64_mul(a: Vec2Int64, b: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_mul(a.x, b.x), int64_mul(a.y, b.y));
}
// END_LIBRARY(int64)

fn perlinfx_swizzle(seed: u32, adjust: u32, x: u32, y: u32, z: u32) -> u32 {
  return xxhash(seed, vec4<u32>(adjust, x, y, z));
}

const PERLINFX_RADSCALE_LOG2: u32 = 14u;

const PERLINFX_SCALE_LOG2: u32 = 28u;
const PERLINFX_SCALE_MAX: u32 = 0xFFFFFFFu;

const PERLINFX_RADVECS: array<i32, 24u> = array<i32, 24u>(
  14188, 8191,
  -14188, 8191,
  14188, -8191,
  -14188, -8191,

  8191, 14188,
  -8191, 14188,
  8191, -14188,
  -8191, -14188,

  0, 16384,
  0, -16384,
  16384, 0,
  -16384, 0,
);

fn perlinfx_gridvec_raw(randval: u32) -> vec2<i32> {
  switch (randval % 12u) {
    case 0u: {
      return vec2<i32>(PERLINFX_RADVECS[0u], PERLINFX_RADVECS[1u]);
    }
    case 1u: {
      return vec2<i32>(PERLINFX_RADVECS[2u], PERLINFX_RADVECS[3u]);
    }
    case 2u: {
      return vec2<i32>(PERLINFX_RADVECS[4u], PERLINFX_RADVECS[5u]);
    }
    case 3u: {
      return vec2<i32>(PERLINFX_RADVECS[6u], PERLINFX_RADVECS[7u]);
    }
    case 4u: {
      return vec2<i32>(PERLINFX_RADVECS[8u], PERLINFX_RADVECS[9u]);
    }
    case 5u: {
      return vec2<i32>(PERLINFX_RADVECS[10u], PERLINFX_RADVECS[11u]);
    }
    case 6u: {
      return vec2<i32>(PERLINFX_RADVECS[12u], PERLINFX_RADVECS[13u]);
    }
    case 7u: {
      return vec2<i32>(PERLINFX_RADVECS[14u], PERLINFX_RADVECS[15u]);
    }
    case 8u: {
      return vec2<i32>(PERLINFX_RADVECS[16u], PERLINFX_RADVECS[17u]);
    }
    case 9u: {
      return vec2<i32>(PERLINFX_RADVECS[18u], PERLINFX_RADVECS[19u]);
    }
    case 10u: {
      return vec2<i32>(PERLINFX_RADVECS[20u], PERLINFX_RADVECS[21u]);
    }
    default: {
      return vec2<i32>(PERLINFX_RADVECS[22u], PERLINFX_RADVECS[23u]);
    }
  }
}

fn perlinfx_gridvec(randval: u32) -> Vec2Int64 {
  return vec2int64_from_vec2i32(perlinfx_gridvec_raw(randval));
}

fn perlinfx_mul_scaled_pow2(a: Int64, b: Int64, scale_log2: u32) -> Int64 {
  return int64_shr(int64_mul(a, b), scale_log2);
}

fn perlinfx_fade(v: Int64, scale_log2: u32) -> Int64 {
  // return 3*v^2 - 2*v^3
  /*
  let v_squared = perlinfx_mul_scaled_pow2(v, v, scale_log2);
  let v_cubed = perlinfx_mul_scaled_pow2(v_squared, v, scale_log2);

  let v_cubed_x2 = int64_shl(v_cubed, 1u);
  let v_squared_x2 = int64_shl(v_squared, 1u);
  let v_squared_x3 = int64_add(v_squared_x2, v_squared);

  let result = int64_sub(v_squared_x3, v_cubed_x2);

  let scale = int64_shl(int64_from_u32(1u), scale_log2);

  return int64_clamp(
    result,
    int64_from_u32(0u),
    int64_sub(scale, int64_from_u32(1u))
  );
  */
  let v_squared = perlinfx_mul_scaled_pow2(v, v, scale_log2);
  let v_cubed = perlinfx_mul_scaled_pow2(int64_mul(v, v), v, 2u * scale_log2);

  let v_cubed_x2 = int64_shl(v_cubed, 1u);
  let v_squared_x2 = int64_shl(v_squared, 1u);
  let v_squared_x3 = int64_add(v_squared_x2, v_squared);

  let result = int64_sub(v_squared_x3, v_cubed_x2);

  let scale = int64_shl(int64_from_u32(1u), scale_log2);

  return int64_clamp(
    result,
    int64_from_u32(0u),
    int64_sub(scale, int64_from_u32(1u))
  );
}

fn perlinfx_dot(a: Vec2Int64, b: Vec2Int64) -> Int64 {
  return int64_add(
    int64_mul(a.x, b.x),
    int64_mul(a.y, b.y)
  );
}

fn perlinfx_stage(
  world_dims: vec2<u32>,
  seed: u32,
  xy: vec2<u32>,
  cur_grid_size: vec2<u32>,
  octave: u32,
) -> u32 {
  let rel_xy = xy % cur_grid_size;
  let tl: vec2<u32> = xy - rel_xy;
  let tr: vec2<u32> = tl + vec2<u32>(cur_grid_size.x, 0u);
  let br: vec2<u32> = tl + cur_grid_size;
  let bl: vec2<u32> = tl + vec2<u32>(0u, cur_grid_size.y);

  var rand_tl_u32: u32 = perlinfx_swizzle(seed, octave, tl.x, tl.y, 0u);
  var rand_tr_u32: u32 = perlinfx_swizzle(seed, octave, tr.x, tr.y, 0u);
  var rand_br_u32: u32 = perlinfx_swizzle(seed, octave, br.x, br.y, 0u);
  var rand_bl_u32: u32 = perlinfx_swizzle(seed, octave, bl.x, bl.y, 0u);

  var tl_vec_64 = perlinfx_gridvec(rand_tl_u32);
  var tr_vec_64 = perlinfx_gridvec(rand_tr_u32);
  var br_vec_64 = perlinfx_gridvec(rand_br_u32);
  var bl_vec_64 = perlinfx_gridvec(rand_bl_u32);

  let pt_tl_pixel = vec2<i32>(xy) - vec2<i32>(tl);
  let pt_tr_pixel = vec2<i32>(xy) - vec2<i32>(tr);
  let pt_br_pixel = vec2<i32>(xy) - vec2<i32>(br);
  let pt_bl_pixel = vec2<i32>(xy) - vec2<i32>(bl);


  // Scale the vectors to RADIAL_VECTOR_SCALE.
  // The length of the vectors here MAY exceed the
  // (-RADIAL_VECTOR_SCALE, RADIAL_VECTOR_SCALE) range, in particular
  // for points near the corners of the grid.
  let pt_tl = (pt_tl_pixel << PERLINFX_RADSCALE_LOG2) / vec2<i32>(cur_grid_size);
  let pt_tr = (pt_tr_pixel << PERLINFX_RADSCALE_LOG2) / vec2<i32>(cur_grid_size);
  let pt_br = (pt_br_pixel << PERLINFX_RADSCALE_LOG2) / vec2<i32>(cur_grid_size);
  let pt_bl = (pt_bl_pixel << PERLINFX_RADSCALE_LOG2) / vec2<i32>(cur_grid_size);

  let pt_tl_64 = vec2int64_from_vec2i32(pt_tl);
  let pt_tr_64 = vec2int64_from_vec2i32(pt_tr);
  let pt_br_64 = vec2int64_from_vec2i32(pt_br);
  let pt_bl_64 = vec2int64_from_vec2i32(pt_bl);

  // These are mostly in the range covered by PERLINFX_SCALE_LOG2.
  // We clamp them to that range.
  let tl_val_64 = int64_clamp(
    perlinfx_dot(tl_vec_64, pt_tl_64),
    int64_from_i32(1 - i32(PERLINFX_SCALE_MAX)),
    int64_from_i32(i32(PERLINFX_SCALE_MAX) - 1)
  );
  let tr_val_64 = int64_clamp(
    perlinfx_dot(tr_vec_64, pt_tr_64),
    int64_from_i32(1 - i32(PERLINFX_SCALE_MAX)),
    int64_from_i32(i32(PERLINFX_SCALE_MAX) - 1)
  );
  let br_val_64 = int64_clamp(
    perlinfx_dot(br_vec_64, pt_br_64),
    int64_from_i32(1 - i32(PERLINFX_SCALE_MAX)),
    int64_from_i32(i32(PERLINFX_SCALE_MAX) - 1)
  );
  let bl_val_64 = int64_clamp(
    perlinfx_dot(bl_vec_64, pt_bl_64),
    int64_from_i32(1 - i32(PERLINFX_SCALE_MAX)),
    int64_from_i32(i32(PERLINFX_SCALE_MAX) - 1)
  );

  let fade_x_64 = perlinfx_fade(
    int64_from_i32(pt_tl.x),
    PERLINFX_RADSCALE_LOG2
  );
  let fade_y_64 = perlinfx_fade(
    int64_from_i32(pt_tl.y),
    PERLINFX_RADSCALE_LOG2
  );

  // Interpolate
  let top_val = int64_add(
    tl_val_64,
    // The two values here are in different scales, but we use the scaling
    // of one in the mul_scaled to ensure the result is in the other scale.
    perlinfx_mul_scaled_pow2(
      fade_x_64,
      int64_sub(tr_val_64, tl_val_64),
      PERLINFX_RADSCALE_LOG2
    ),
  );

  let bot_val = int64_add(
    bl_val_64,
    // The two values here are in different scales, but we use the scaling
    // of one in the mul_scaled to ensure the result is in the other scale.
    perlinfx_mul_scaled_pow2(
      fade_x_64,
      int64_sub(br_val_64, bl_val_64),
      PERLINFX_RADSCALE_LOG2
    ),
  );

  let val = int64_add(
    top_val,
    // The two values here are in different scales, but we use the scaling
    // of one in the mul_scaled to ensure the result is in the other scale.
    perlinfx_mul_scaled_pow2(
      fade_y_64,
      int64_sub(bot_val, top_val),
      PERLINFX_RADSCALE_LOG2
    ),
  );

  // Reduce bits to 16.
  let result_val = int64_shr(val, (PERLINFX_SCALE_LOG2 - 16u));

  let result = i32(result_val.value.x);

  // return u32(val + PERLINFX_SCALE) << 1u;
  return u32(result + 0x10000) >> 1u;
}

const PERLINFX_RESCALE_LOG2: u32 = 12u;
const PERLINFX_RESCALE: u32 = 0x1000u;

fn perlinfx_gen_u16(
  world_dims: vec2<u32>,
  seed: u32,
  xy: vec2<u32>,
  grid_size: vec2<u32>,
  num_octaves: u32
  // , borderfade_pml: vec2<u32>,
) -> u32 {
  var result: u32 = 0u;
  var sum_scale: u32 = 0u;

  var cur_grid_size: vec2<u32> = grid_size;
  var cur_scaledown_log2: u32 = 0u;
  for (var i: u32 = 0u; i < num_octaves; i = i + 1u) {
    if (cur_grid_size.x == 0u || cur_grid_size.y == 0u) {
      break;
    }
    if (cur_scaledown_log2 > PERLINFX_RESCALE_LOG2) {
      break;
    }

    let randval = perlinfx_swizzle(seed, i, world_dims.x, world_dims.y, 0u);
    // let adjust = vec2<u32>(randval & 0xFFFu, (randval >> 12u) & 0xFFFu);
    let adjust = (cur_grid_size / ((i * 2u) + 1u));

    let stage_result = perlinfx_stage(world_dims, seed, xy + adjust, cur_grid_size, i);
    result += stage_result >> cur_scaledown_log2;
    sum_scale += (1u << (PERLINFX_RESCALE_LOG2 - cur_scaledown_log2));

    cur_grid_size = cur_grid_size >> 1u;
    cur_scaledown_log2 += 1u;
  }

  var result_u16 = (result * PERLINFX_RESCALE) / sum_scale;

  // Check the distance to the border of the tile.
  /*
  if (borderfade_pml.x > 0u && borderfade_pml.y > 0u) {
    let border_dist = vec2<u32>(
      min(xy.x, world_dims.x - xy.x),
      min(xy.y, world_dims.y - xy.y)
    );

    let border_dist_pml = (border_dist * 1000u) / world_dims;

    var xdist_pml: u32 = borderfade_pml.x;
    if (border_dist_pml.x < borderfade_pml.x) {
      xdist_pml = border_dist_pml.x;
    }

    var ydist_pml: u32 = borderfade_pml.y;
    if (border_dist_pml.y < borderfade_pml.y) {
      ydist_pml = border_dist_pml.y;
    }

    if (xdist_pml < borderfade_pml.x || ydist_pml < borderfade_pml.y) {
      var dist_pml = (xdist_pml * ydist_pml + xdist_pml * ydist_pml) >> 8u;
      var scale_pml =
        (borderfade_pml.x * borderfade_pml.y + borderfade_pml.x * borderfade_pml.y)
          >> 8u;

      result_u16 = (result_u16 * dist_pml) / scale_pml;
    }
  }
  */

  // Scale all values in the range [0, 199] to [50, 199].
  if (result_u16 < 50u) {
    result_u16 = 50u + ((((result_u16 * 15u) << 8u) / 20u) >> 8u);
  }

  return result_u16;
}
// END_LIBRARY(perlin64)

struct Uniforms {
  world_dims: vec2<u32>,
  top_left: vec2<u32>,
  out_dims: vec2<u32>,
  seed: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, write> output_buffer: array<u32>;

@compute
@workgroup_size(8, 8)
fn rand_gen_task(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let world_dims = uniforms.world_dims;
  let out_dims = uniforms.out_dims;
  let seed = uniforms.seed;

  // Bounds check against the output buffer.
  let rel_xy = global_id.xy;
  if (rel_xy.x >= out_dims.x || rel_xy.y >= out_dims.y) {
    return;
  }

  // Bounds check against the world.
  let cell_xy = uniforms.top_left + rel_xy;
  if (cell_xy.x >= world_dims[0] || cell_xy.y >= world_dims[1]) {
    return;
  }

  // Generate the value.
  var value = perlinfx_gen_u16(
    world_dims,
    seed,
    cell_xy,
    world_dims / 4u,
    9u,
  );

  // Write it to correct location in output buffer.
  let index: u32 = (rel_xy.y * out_dims.x) + rel_xy.x;
  output_buffer[index] = value;
}
