use crate::{
  cog::{ CogDevice, CogTask },
  data_store,
  gpu::{
    task::create_world::{
      RandGenTask,
      ReadMapDataTask,
      ReadMinimapDataTask,
    },
    CellDataBuffer,
    RandGenBuffer,
    ProgramBuffer,
  },
  protocol::mode::create_world::{
    CreateWorldSubcmdResponse,
    CurrentGenerationPhaseCmd,
    CurrentGenerationPhaseRsp,
    GetMapDataCmd,
    GetMapDataRsp,
    GetMinimapDataCmd,
    GetMinimapDataRsp,
    TakeGenerationStepCmd,
  },
  shady_vm::{ ShadyProgram, ShadyProgramIndex, ShasmProgram },
  data::{
    map::{
      CellData,
      WorldDescriptor,
    },
    ruleset::{
      FormatComponentSelector,
      FormatComponentSelectorReadSpec,
      Ruleset,
    },
    GenerationCellDatumId,
    GenerationPhase,
    GenerationStepKind,
    Histogram,
  },
};

pub(crate) struct GeneratingWorldState {
  descriptor: WorldDescriptor,
  ruleset: Ruleset,
  phase: GenerationPhase,
  device: CogDevice,
  randgen_buffer: RandGenBuffer,
  randgen_histogram: Option<Histogram>,
  cell_data_buffer: CellDataBuffer,
  programs: GeneratingWorldPrograms,
}
impl GeneratingWorldState {
  pub(crate) fn new(descriptor: WorldDescriptor, ruleset: Ruleset) -> Self {
    let phase = GenerationPhase::NewlyCreated;
    let device = CogDevice::new();
    let cell_data_buffer = CellDataBuffer::new(&device, descriptor.dims);
    let randgen_buffer = RandGenBuffer::new(&device, descriptor.dims);
    let programs = GeneratingWorldPrograms::new(&device, &ruleset);
    GeneratingWorldState {
      descriptor,
      ruleset,
      phase,
      device,
      randgen_buffer,
      randgen_histogram: None,
      cell_data_buffer,
      programs,
    }
  }

  pub(crate) fn handle_take_generation_step_cmd(&mut self,
    cmd: TakeGenerationStepCmd,
  ) -> CreateWorldSubcmdResponse {
    match cmd.kind {
      GenerationStepKind::RandGen => self.step_rand_gen(),
      GenerationStepKind::InitializeCell => self.step_initialize_cell(),
      GenerationStepKind::PairwiseStep => self.step_pairwise_step(),
      GenerationStepKind::PairwiseMerge => self.step_pairwise_merge(),
      GenerationStepKind::Finalize => self.step_finalize(),
    }
  }

  pub(crate) fn handle_current_generation_phase_cmd(&mut self,
    _cmd: CurrentGenerationPhaseCmd,
  )
    -> CreateWorldSubcmdResponse
  {
    CreateWorldSubcmdResponse::CurrentGenerationPhase(
      CurrentGenerationPhaseRsp { phase: self.phase }
    )
  }

  pub(crate) fn handle_get_map_data_cmd(&self,
    cmd: GetMapDataCmd,
    _data_store: &data_store::DataStore
  ) -> CreateWorldSubcmdResponse {
    // Validate datum ids.
    if cmd.datum_ids.len() == 0 {
      return CreateWorldSubcmdResponse::Failed(vec![
        "No datum ids provided".to_string(),
      ]);
    }
    if cmd.datum_ids.len() > 4 {
      return CreateWorldSubcmdResponse::Failed(vec![
        "Too many datum ids".to_string(),
      ]);
    }

    if ! self.descriptor.dims.contains_coord(cmd.top_left) {
      return CreateWorldSubcmdResponse::Failed(vec![
        "Top left coordinate is out of bounds".to_string(),
      ]);
    }

    let br = cmd.dims.bottom_right_inclusive(cmd.top_left);
    if ! self.descriptor.dims.contains_coord(br) {
      return CreateWorldSubcmdResponse::Failed(vec![
        "Bottom right coordinate is out of bounds".to_string(),
      ]);
    }

    // Convert them to selectors.
    let mut selectors: Vec<FormatComponentSelectorReadSpec> = Vec::new();
    for (i, datum_id) in cmd.datum_ids.iter().enumerate() {
      match self.make_selector_for_datum_id(datum_id) {
        Ok(sel) => selectors.push(
          FormatComponentSelectorReadSpec::new(sel, i as u8)
        ),
        Err(err) => { return CreateWorldSubcmdResponse::Failed(err); }
      }
    }

    // Create the output buffer.
    let output_buffer = self.device.create_seq_buffer::<u32>(
      cmd.dims.area() as usize  * selectors.len(),
      "GetMapData_Output"
    );

    // Run the command.
    let read_map_data_task =
      if matches!(self.phase, GenerationPhase::PreInitialize) {
        // In PreInitialize phase, we need to read from the randgen buffer.
        ReadMapDataTask::new(
          self.descriptor.dims,
          cmd.top_left,
          cmd.dims,
          selectors.clone(),
          self.randgen_buffer.buffer().as_seq_buffer().clone(),
          1,
          output_buffer.clone()
        )
      } else {
        // In all other phases, we read from the cell data buffer.
        ReadMapDataTask::new(
          self.descriptor.dims,
          cmd.top_left,
          cmd.dims,
          selectors.clone(),
          self.cell_data_buffer.as_u32_seq_buffer(),
          CellData::NUM_WORDS,
          output_buffer.clone()
        )
      };
    self.device.encode_and_run("CreateWorld_ReadMapData", |enc| {
      read_map_data_task.encode(enc);
    });

    // Read the result from the output buffer.
    let mut result_vecs: Vec<Vec<u32>> = Vec::new();
    output_buffer.read_mapped_full(|data| {
      for sel_i in 0 .. selectors.len() {
        result_vecs.push(Vec::new());
        let subvec = &mut result_vecs[sel_i];
        for entry_i in 0 .. cmd.dims.area() as usize {
          let value = data[entry_i * selectors.len() + sel_i];
          subvec.push(value);
        }
      }
    });

    CreateWorldSubcmdResponse::MapData(GetMapDataRsp {
      top_left: cmd.top_left,
      dims: cmd.dims,
      data: result_vecs,
    })
  }

  pub(crate) fn handle_get_minimap_data_cmd(&self,
    cmd: GetMinimapDataCmd,
    _data_store: &data_store::DataStore
  ) -> CreateWorldSubcmdResponse {
    // Create the output buffer.
    let output_buffer = self.device.create_seq_buffer::<u32>(
      cmd.mini_dims.area() as usize,
      "GetMinimapData_Output"
    );

    let selector = match self.make_selector_for_datum_id(&cmd.datum_id) {
      Ok(sel) => sel,
      Err(err) => { return CreateWorldSubcmdResponse::Failed(err); }
    };

    // Create the task
    let task = 
      if matches!(self.phase, GenerationPhase::PreInitialize) {
        ReadMinimapDataTask::new(
          self.descriptor.dims,
          cmd.mini_dims,
          1,
          selector,
          self.randgen_buffer.buffer().as_seq_buffer(),
          output_buffer.clone()
        )
      } else {
        ReadMinimapDataTask::new(
          self.descriptor.dims,
          cmd.mini_dims,
          CellData::NUM_WORDS,
          selector,
          self.cell_data_buffer.as_u32_seq_buffer(),
          output_buffer.clone()
        )
      };

    // Run the task
    self.device.encode_and_run("CreateWorld_ReadMinimapData", |enc| {
      task.encode(enc);
    });

    // Read the result from the output buffer.
    let mut result_vec: Vec<u32> = Vec::new();
    output_buffer.read_mapped_full(|data| {
      for entry_i in 0 .. cmd.mini_dims.area() as usize {
        let value = data[entry_i];
        result_vec.push(value);
      }
    });

    CreateWorldSubcmdResponse::MinimapData(GetMinimapDataRsp {
      mini_dims: cmd.mini_dims,
      data: result_vec,
    })
  }

  fn make_selector_for_datum_id(&self,
    datum_id: &GenerationCellDatumId,
  ) -> Result<FormatComponentSelector, Vec<String>> {
    match datum_id {
      GenerationCellDatumId::RandGen {} => {
        if ! matches!(self.phase, GenerationPhase::PreInitialize) {
          return Err(vec![
            "RandGen datum id is only valid in PreInitialize phase".to_string(),
          ]);
        }
        Ok(FormatComponentSelector::new(0, 0, 30))
      },
      GenerationCellDatumId::Selector(sel) => {
        if ! matches!(self.phase, GenerationPhase::CellInitialized) {
          return Err(vec![
            "Selector datum id is only valid in CellInitialized phase".to_string(),
            format!("{:?}", sel)
          ]);
        }
        sel.format_selector(&self.ruleset.terrain_gen.stage.format).map_or_else(
          || Err(vec![
            "Invalid selector".to_string(),
            format!("{:?}", sel)
          ]),
          |selector| Ok(selector)
        )
      },
    }
  }

  fn step_rand_gen(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::NewlyCreated {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform RandGen step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }

    let randgen_task = RandGenTask::new(
      self.descriptor.dims,
      self.descriptor.seed_u32(),
      self.randgen_buffer.clone(),
    );

    // Run the tasks.
    self.device.encode_and_run("CreateWorld_RandGen", |enc| {
      randgen_task.encode(enc);
    });

    // KVKV REMOVE
    // Read and save the histogram from the last buffer.
    let histo_buffers = randgen_task.take_outhist_buffers();
    eprintln!("Randgen_histograms: {:?}", histo_buffers.len());
    for (i, histo) in histo_buffers.iter().enumerate() {
      eprintln!("Computed randgen histogram {}: {:?} (buflen={})",
        i, histo.compute_histogram(), histo.buffer().len());
      if i > 0 {
        histo.buffer().read_mapped_full(|data| {
            eprintln!("Randgen histogram {}: {:?}", i, data);
        });
      }
    }

    self.phase = GenerationPhase::PreInitialize;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_initialize_cell(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::PreInitialize {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform InitializeCell step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::CellInitialized;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_pairwise_step(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::CellInitialized {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform PairwiseStep step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::PreMerge;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_pairwise_merge(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::PreMerge {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform PairwiseMerge step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::CellInitialized;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_finalize(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::CellInitialized {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform Finalize step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::Finalized;
    CreateWorldSubcmdResponse::Ok {}
  }
}

pub(crate) struct GeneratingWorldPrograms {
  program_buffer: ProgramBuffer,
  init_program_index: ShadyProgramIndex,
  pairwise_program_index: ShadyProgramIndex,
  merge_program_index: ShadyProgramIndex,
  final_program_index: ShadyProgramIndex,
}
impl GeneratingWorldPrograms {
  pub(crate) fn new(device: &CogDevice, ruleset: &Ruleset) -> Self {
    let mut program_buffer = ProgramBuffer::new(device);
    let stage = &ruleset.terrain_gen.stage;

    let init_program = Self::parse_terminated(&stage.init_program);
    let pairwise_program = Self::parse_terminated(&stage.pairwise_program);
    let merge_program = Self::parse_terminated(&stage.merge_program);
    let final_program = Self::parse_terminated(&stage.final_program);

    let init_program_index =
      program_buffer.add_program("TerrainGen_Init", init_program);

    let pairwise_program_index =
      program_buffer.add_program("TerrainGen_Pairwise", pairwise_program);

    let merge_program_index =
      program_buffer.add_program("TerrainGen_Merge", merge_program);
    
    let final_program_index =
      program_buffer.add_program("TerrainGen_Final", final_program);

    program_buffer.sync_gpu_buffer();

    GeneratingWorldPrograms {
      program_buffer,
      init_program_index,
      pairwise_program_index,
      merge_program_index,
      final_program_index,
    }
  }

  fn parse_terminated(shasm_program: &ShasmProgram) -> ShadyProgram {
    let mut shady_program = shasm_program.parse_shady_program()
      .expect("Failed to parse program");
    shady_program.append_terminal_instruction();
    shady_program
  }
} 
