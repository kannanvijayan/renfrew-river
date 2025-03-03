
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

const PERLIN_OCTAVE_MAX_SCALE: f32 = 5.0;
const PERLIN_OCTAVE_MIN: f32 = 4.0;
const PERLIN_OCTAVE_STEP: f32 = 2.0;
const PERLIN_OCTAVE_CRAGGINESS: f32 = 1.05;

const PERLIN_BORDER_FADE_WIDTH_PERCENT: f32 = 10.0;

const PERLIN_PI: f32 = 3.1415926535897932384626;

fn perlin_swizzle(seed: u32, adjust: u32, x: u32, y: u32) -> f32 {
  let a = xxhash(seed, vec4<u32>(adjust, x, y, 0u));
  return f32(a) / f32(u32(-1));
}

fn perlin_smoother(v: f32) -> f32 {
  // return (v * v) * (3.0 - 2.0 * v);
  return (v * (v * 6.0 - 15.0) + 10.0) * v * v * v;
}

fn perlin_interpolate(start: f32, end: f32, travel: f32) -> f32 {
  return start + (end - start) * perlin_smoother(travel);
}

fn perlin_gridvec(seed: u32, stage: u32, pt: vec2<u32>) -> vec2<f32> {
  let rand_unit = perlin_swizzle(seed, stage, pt.x, pt.y);
  // Multiply by 2pi, then take cos and sin for gridvec dx, dy
  // This gives us a natural unit-vector.
  let angle = rand_unit * 2.0 * PERLIN_PI;
  return vec2<f32>(cos(angle), sin(angle));
}

fn perlin_stage(
  world_dims: vec2<u32>,
  seed: u32,
  stage: u32,
  scale: u32,
  x: u32,
  y: u32,
) -> f32 {
  let pt: vec2<f32> = vec2<f32>(f32(x), f32(y)) / f32(scale);

  let tl: vec2<f32> = floor(pt);
  let tr: vec2<f32> = vec2<f32>(tl.x + 1.0, tl.y);
  let br: vec2<f32> = vec2<f32>(tl.x + 1.0, tl.y + 1.0);
  let bl: vec2<f32> = vec2<f32>(tl.x, tl.y + 1.0);

  var tl_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(tl));
  var tr_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(tr));
  var br_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(br));
  var bl_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(bl));

  var keep_y: f32 = 1.0;
  let fade_border_y = u32(
    f32(world_dims[1]) * (PERLIN_BORDER_FADE_WIDTH_PERCENT / 100.0)
  );
  if (y < fade_border_y) {
    keep_y = f32(y) / f32(fade_border_y);
  }
  if (y > (world_dims[1] - fade_border_y)) {
    keep_y = f32(world_dims[1] - y) / f32(fade_border_y);
  }

  var keep_x: f32 = 1.0;
  let fade_border_x = u32(
    f32(world_dims[0]) * (PERLIN_BORDER_FADE_WIDTH_PERCENT / 100.0)
  );
  if (x < fade_border_x) {
    keep_x = f32(x) / f32(fade_border_x);
  }
  if (x > (world_dims[0] - fade_border_x)) {
    keep_x = f32(world_dims[0] - x) / f32(fade_border_x);
  }

  let pt_tl = pt - tl;
  let pt_tr = pt - tr;
  let pt_br = pt - br;
  let pt_bl = pt - bl;

  let sink = max(1.0 - keep_x, 1.0 - keep_y);
  tl_vec = vec2(
    perlin_interpolate(tl_vec.x, -pt_tl.x, sink),
    perlin_interpolate(tl_vec.y, -pt_tl.y, sink),
  );
  tr_vec = vec2(
    perlin_interpolate(tr_vec.x, -pt_tr.x, sink),
    perlin_interpolate(tr_vec.y, -pt_tr.y, sink),
  );
  br_vec = vec2(
    perlin_interpolate(br_vec.x, -pt_br.x, sink),
    perlin_interpolate(br_vec.y, -pt_br.y, sink),
  );
  bl_vec = vec2(
    perlin_interpolate(bl_vec.x, -pt_bl.x, sink),
    perlin_interpolate(bl_vec.y, -pt_bl.y, sink),
  );

  let tl_val: f32 = dot(tl_vec, pt_tl);
  let tr_val: f32 = dot(tr_vec, pt_tr);
  let br_val: f32 = dot(br_vec, pt_br);
  let bl_val: f32 = dot(bl_vec, pt_bl);

  // Interpolate
  let top_val: f32 = perlin_interpolate(tl_val, tr_val, pt.x - tl.x);
  let bot_val: f32 = perlin_interpolate(bl_val, br_val, pt.x - tl.x);
  let value: f32 = perlin_interpolate(top_val, bot_val, pt.y - tl.y);

  // Clamp value to [-1, 1]
  return max(min(value, 1.0f), -1.0f);
}

fn perlin_gen_f32(world_dims: vec2<u32>, seed: u32, x: u32, y: u32) -> f32 {
  var accum: f32 = 0.0;
  var max_value: f32 = 0.0;
  var amplitude: f32 = 1.0;
  var stage: u32 = 0u;
  var scale: f32 = f32(world_dims[0]) / PERLIN_OCTAVE_MAX_SCALE;
  var cragginess_multiplier = PERLIN_OCTAVE_CRAGGINESS / PERLIN_OCTAVE_STEP;
  for (
    var s: f32 = scale;
    s >= PERLIN_OCTAVE_MIN;
    s = s / PERLIN_OCTAVE_STEP
  ) {
    let val = perlin_stage(world_dims, seed, stage, u32(s), x, y);
    accum = accum + val * amplitude;
    max_value = max_value + amplitude;
    amplitude = amplitude * cragginess_multiplier;
    stage = stage + 1u;
  }
  let res = max(min(accum / max_value, 1.0f), -1.0f);
  return (res + 1.0f) / 2.0f;
}

fn perlin_gen_u16(world_dims: vec2<u32>, seed: u32, x: u32, y: u32) -> u32 {
  let unit_ranged: f32 = perlin_gen_f32(world_dims, seed, x, y);
  return u32(unit_ranged * f32(0xFFFF));
}
