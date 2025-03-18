
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
