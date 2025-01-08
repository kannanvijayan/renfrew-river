use log;
use crate::{
  gpu::{ GpuWorld, GpuWorldParams, ShadyAssembler, ShadyProgram },
  world::{
    AnimalData,
    AnimalId,
    CellCoord,
    CellInfo,
    Elevation,
    ElevationValueType,
    InitParams,
    TurnNo,
    VecMap,
    WorldDims,
  },
  persist::WorldPersist,
};

pub(crate) struct World {
  // Dimensions of the world.
  world_dims: WorldDims,

  // The world state inside the GPU.
  gpu_world: GpuWorld,

  // The current turn number.
  turn_no: TurnNo,
}
impl World {
  pub(crate) fn new(init_params: InitParams) -> World {
    let InitParams { world_dims, rand_seed, extra_flags } = init_params;
    let gpu_world = GpuWorld::new(GpuWorldParams {
      world_dims,
      rand_seed,
      extra_flags,
    });
    let turn_no = TurnNo(0);
    World {
      world_dims,
      gpu_world,
      turn_no,
    }
  }

  pub(crate) fn initialize(&mut self) {
    log::debug!("World::initialize");
    self.gpu_world.init_elevations();
    self.gpu_world.init_animals();

    self.init_programs();
  }

  pub(crate) fn world_dims(&self) -> WorldDims {
    self.world_dims
  }

  pub(crate) fn read_elevation_values(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<ElevationValueType>
  {
    self.gpu_world.read_elevation_values(top_left, area)
  }
  pub(crate) fn read_animal_ids(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<AnimalId>
  {
    self.gpu_world.read_animal_ids(top_left, area)
  }

  pub(crate) fn mini_elevation_values(&self, mini_dims: WorldDims)
    -> VecMap<ElevationValueType>
  {
    self.gpu_world.mini_elevation_values(mini_dims)
  }

  pub(crate) fn read_animals_entity_data(&self) -> Vec<AnimalData> {
    self.gpu_world.read_animals_entity_data()
  }

  pub(crate) fn take_turn_step(&mut self) -> TakeTurnStepResult {
    let prior_time = std::time::Instant::now();
    self.gpu_world.move_animals();
    let elapsed_ms =
      prior_time.elapsed().as_millis()
        .clamp(0 as u128, u32::MAX as u128) as u32;
    let turn_no_after = self.turn_no.next();
    self.turn_no = turn_no_after;
    TakeTurnStepResult { turn_no_after, elapsed_ms }
  }

  pub(crate) fn read_cell_info(&self, coord: CellCoord) -> CellInfo {
    self.gpu_world.read_cell_info(coord)
  }

  pub(crate) fn read_animal_data(&self, animal_id: AnimalId) -> AnimalData {
    self.gpu_world.read_animal_data(animal_id)
  }

  fn init_programs(&mut self) {
    let program = self.make_move_animals_program();
    self.gpu_world.add_program("move_animals_downhill", program);
    self.gpu_world.sync_programs();
  }

  fn make_move_animals_program(&mut self) -> ShadyProgram {
    let mut asm = ShadyAssembler::new();

    const THIS_ELEV_CELL_REG: u8 = 15;
    const ADJ_ELEV_FIRST_REG: u8 = 16;
    const MIN_DIR_REG: u8 = 0;
    const MIN_ELEV_REG: u8 = 1;
    const ARG_DIR_REG: u8 = 2;
    const TMP1_REG: u8 = 64;
    const TMP2_REG: u8 = 65;

    let check_dir_label = asm.declare_label("check_dir");

    // Assembly text:
    //
    // PROGRAM:
    //   mov r(MIN_DIR_REG), -1
    //   mov r(MIN_ELEV_REG), r(THIS_ELEV_CELL_REG)
    //   mov r(ARG_DIR_REG), 0
    //   loop_start:
    //   call check_dir
    //   add r(ARG_DIR_REG), r(ARG_DIR_REG), 1
    //   sub r(TMP1_REG), r(ARG_DIR_REG), 6
    //   if(lt) loop_start
    //   terminate
    //
    // check_dir:
    //   add r(TMP1_REG), r(ADJ_ELEV_FIRST_REG), r(ARG_DIR_REG)
    //   sub r(TMP2_REG), r(r(TMP1_REG)), r(MIN_ELEV_REG)
    //   if(ge) ret
    //   mov r(MIN_DIR_REG), r(ARG_DIR_REG)
    //   mov r(MIN_ELEV_REG), r(r(TMP1_REG))
    //   ret
    //

    // Elevation of this cell is in r15.
    // Elevation of directional cells are in r16 + <direction>.
    //
    // Direction of min elevation is stored in r0.
    // Min elevation is stored in r1.
    //
    // Subroutine is passed the direction in r2.

    // Store the elevation of the current cell in MIN_ELEV_REG.
    // Store direction -1 (self) in MIN_DIR_REG.
    asm.emit_mov(asm.dreg(MIN_DIR_REG), asm.immv(-1));
    asm.emit_mov(asm.dreg(MIN_ELEV_REG), asm.sreg(THIS_ELEV_CELL_REG));

    // Loop over all directions and call "check_dir" subroutine.
    asm.emit_mov(asm.dreg(ARG_DIR_REG), asm.immv(0));
    asm.declare_label("loop_start");
    asm.bind_label("loop_start");
    asm.emit_call("check_dir");
    asm.emit_add(asm.dreg(ARG_DIR_REG), asm.sreg(ARG_DIR_REG), asm.immv(1));
    asm.emit_sub(asm.dreg(TMP1_REG), asm.sreg(ARG_DIR_REG), asm.immv(6));
    asm.with_iflt().emit_jump("loop_start");
    asm.emit_terminate();


    // Subroutine to check if the elevation in the given direction is less than
    // the current minimum.
    asm.bind_label("check_dir");
    // tmp1 = ADJ_ELEV_FIRST_REG + dir
    asm.emit_add(
      asm.dreg(TMP1_REG),
      asm.immv(ADJ_ELEV_FIRST_REG as i16),
      asm.sreg(ARG_DIR_REG)
    );
    // tmp2 = *tmp1 - min_elev
    {
      let d = asm.dreg(TMP2_REG);
      let s1 = asm.sreg(TMP1_REG);
      let s2 = asm.sreg(MIN_ELEV_REG);
      asm.with_indsrc1().emit_sub(d, s1, s2);
    }
    // if tmp2 >= 0: return
    asm.with_ifge().emit_ret();

    // min_dir = dir
    asm.emit_mov(asm.dreg(MIN_DIR_REG), asm.sreg(ARG_DIR_REG));
    // min_elev = *tmp1
    {
      let d = asm.dreg(MIN_ELEV_REG);
      let s = asm.sreg(TMP1_REG);
      let i = asm.immv(0);
      asm.with_indsrc1().emit_add(d, s, i);
    }
    // return
    asm.emit_ret();

    asm.assemble_program().expect("Failed to assemble 'move_animals' program")
  }

  pub(crate) fn to_persist(&self) -> WorldPersist {
    WorldPersist::new(
      self.world_dims,
      self.turn_no,
      self.gpu_world.rand_seed(),
      self.gpu_world.extra_flags().clone(),
      self.gpu_world.elevation_map_persist(),
      self.gpu_world.animals_list_persist(),
      self.gpu_world.species_list_persist(),
      self.gpu_world.program_store_persist(),
    )
  }

  pub(crate) fn from_persist(world_persist: &WorldPersist) -> World {
    let world_dims = world_persist.world_dims();
    let gpu_world = GpuWorld::from_persist(world_persist);
    let turn_no = world_persist.turn_no();
    World { world_dims, gpu_world, turn_no }
  }
}

pub(crate) struct TakeTurnStepResult {
  pub(crate) turn_no_after: TurnNo,
  pub(crate) elapsed_ms: u32,
}
