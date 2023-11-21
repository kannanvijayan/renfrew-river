# Shady Virtual Machine

ShadyVM is a micro VM meant to run on shaders.

The machine operates on 32-bit integer values only.  Floating point support is
not provided - use fixed point instead.

Each instruction in the machine specifies an operation in terms of 3 operands.

The broad instruction specification looks like this:

```
  if COND then DF(OP(X0, X1), X2)
```

Each operand `Pi` references either a register value or represents part of
an immediate value.

## Conditions (COND)

Condition may be one of:

  * None = 0b000
  * Lt   = 0b001
  * Eq   = 0b010
  * Le   = 0b011
  * Gt   = 0b100
  * Ne   = 0b101
  * Ge   = 0b110
  * Any  = 0b111

## Register File

The register file is composed of 63 registers `r0 ... r62`.  Each register
stores a 32-bit value.

## Operation (OP)

Operations may be one of the following:

  * Immediate
    - computes `(X0 | (X1 << 6))`
  * Binary operations
    - variants: RR, RI, IR, II
    - computes `V0 <binop> V1`
    - Binops are: Add, Sub, Mul, Div, Mod, Lsh, Rsh, And, Or, Xor

## Data Flow (DF)

The dataflow after an operation result has been computed.  Control flow
is implemented as a different interpretation model for data-flow bits,
only when the `X2` operand is == 63.

The data flows are:

  * Mov
    - use `result = OP(X0, X1)`
    - write `result` to register X2
  * Read
    - use `result = mem[OP(X0, X1)]`
    - write `result` to register X2
  * Write
    - use `result = register_value[X2]`
    - write `result` to `mem[OP(X0, X1)]`
  * WriteImm
    - use `result = X2`
    - write `result` to `mem[OP(X0, X1)]`
  * Jump
    - Jump to `OP(X0, X1)`
  * Call
    - Call `OP(X0, X1)`
  * Ret
    - use value of `OP(X0, X1)`
    - write to register `r0`
    - jump to `pop(call-stack)`
  * End
    - use value of `OP(X0, X1)`
    - write to register `r0`
    - end program execution

The encoding of the first four uses overlaps with the last four.
This is because the "Jump", "Call", "Ret", and "End" interpretations of the use
only occur when `X2 == 0x1f`.  This marks the instruction as a control flow
instruction.

## Instruction Encoding

The instruction is encoded as follows:

```
    31                                    0
    ??AA-FUUZ ZZZZ-ZPPP PYYY-YYYX XXXX-XCCC

    * CCC
      - bits 0 ... 2
      - condition
    * XXXX_XX
      - bits 3 ... 8
      - operand `X0`
    * YYYY_YY
      - bits 9 ... 14
      - operand `X1`
    * PPPP
      - bits 15 ... 18
      - Operation
    * ZZZZ_ZZ
      - bits 19 ... 24
      - operand `X2`
    * UU
      - bits 25 ... 26
      - Use
    * F
      - bit 27
      - set flags
    * AA
      - bits 28 ... 29
      - X0 and X1 interpretation
      - 00 => X0 is register, X1 is register
      - 01 => X0 is immediate, X1 is register
      - 10 => X0 is register, X1 is immediate
      - 11 => X0 is immediate, X1 is immediate
```
