

import { useState } from 'react';
import { Box, Button, Container, Input, TextareaAutosize, Typography } from '@mui/material';

import Screen from '../components/Screen';
import ConnectedTopBar from '../components/ConnectedTopBar';
import DefRulesGameMode from '../game/mode/def_rules';
import ViewState from '../ViewState';

export type DefRulesViewMode =
  | "ruleset" | "terrain_gen" | "perlin_params" | "generation_params"
  | "format" | "init_program" | "pairwise_program" | "merge_program" | "final_program";

const ViewModeInclusion: Record<DefRulesViewMode, DefRulesViewMode[]> = {
  "ruleset": ["terrain_gen"],
  "terrain_gen": ["perlin_params", "generation_params"],
  "perlin_params": [],
  "generation_params": [
    "format",
    "init_program",
    "pairwise_program",
    "merge_program",
    "final_program",
  ],
  "format": [],
  "init_program": [],
  "pairwise_program": [],
  "merge_program": [],
  "final_program": [],
};
export function viewModeAllows(mode: DefRulesViewMode, current: DefRulesViewMode): boolean {
  return mode === current ||
    ViewModeInclusion[mode].some(
      childMode => viewModeAllows(childMode, current)
    );
}

// The main screen for the game when connected to a server.
// Shows a centered menu of selections.
export default function DefRulesView(
  props: {
    instance: DefRulesGameMode,
    viewState: ViewState,
  }
) {
  return (
    <Screen>
      <ConnectedTopBar
        session={props.instance.serverSession}
        viewState={props.viewState}
        onDisconnectClicked={() => {}}
      />
      <DefRulesFrame instance={props.instance} />
    </Screen>
  );
};

function DefRulesFrame(props: { instance: DefRulesGameMode }) {
  const [viewMode, setViewMode] = useState<DefRulesViewMode>("ruleset");
  return (
    <Box display="flex" flexDirection="row" width="100%" height="100%"
      sx={{ mt: 2 }} >
        <DefRulesMainColumn instance={props.instance} setViewMode={setViewMode} />
        {viewModeAllows("terrain_gen", viewMode) ? <DefRulesTerrainGenColumn instance={props.instance} setViewMode={setViewMode} /> : null}
        {viewModeAllows("perlin_params", viewMode) ? <DefRulesPerlinParamsColumn instance={props.instance} /> : null}
        {viewModeAllows("generation_params", viewMode) ? <DefRulesGenerationParams instance={props.instance} setViewMode={setViewMode} /> : null}
        {viewModeAllows("format", viewMode) ? <DefRulesGenerationFormat instance={props.instance} /> : null}
        {viewModeAllows("init_program", viewMode) ? <DefRulesGenerationInitProgram instance={props.instance} /> : null}
        {viewModeAllows("pairwise_program", viewMode) ? <DefRulesGenerationPairwiseProgram instance={props.instance} /> : null}
        {viewModeAllows("merge_program", viewMode) ? <DefRulesGenerationMergeProgram instance={props.instance} /> : null}
        {viewModeAllows("final_program", viewMode) ? <DefRulesGenerationFinalProgram instance={props.instance} /> : null}
    </Box>
  );
}

// The main screen for the game when connected to a server.
// Shows a centered menu of selections.
function DefRulesMainColumn(
  props: {
    instance: DefRulesGameMode,
    setViewMode: (mode: DefRulesViewMode) => void,
  }
) {
  return (
    <Box display="flex" flexDirection="column" width="20em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5} 
            fontWeight={600}>
            Ruleset
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Name
          </Typography>
          <Input type="text" placeholder="Ruleset name" />
        </Box>
        <Box display="flex" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Descr
          </Typography>
          <Input type="text" placeholder="Description" />
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto" m="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            sx={{ fontWeight: 600 }}
            onClick={() => props.setViewMode("terrain_gen")}>
            Terrain Generation
          </Button>
        </Box>
    </Box>
  );
}

function DefRulesTerrainGenColumn(
  props: {
    instance: DefRulesGameMode,
    setViewMode: (mode: DefRulesViewMode) => void,
  }
) {
  return (
    <Box display="flex" flexDirection="column" width="20em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5} 
            fontWeight={600}>
            Terrain Gen
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            sx={{ fontWeight: 600 }}
            onClick={() => props.setViewMode("perlin_params")}>
            Perlin Params
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            sx={{ fontWeight: 600 }}
            onClick={() => props.setViewMode("generation_params")}>
            Generation Params
          </Button>
        </Box>
    </Box>
  );
}

function DefRulesPerlinParamsColumn(
  _props: { instance: DefRulesGameMode }
) {
  return (
    <Box display="flex" flexDirection="column" width="20em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5} 
            fontWeight={600}>
            Perlin Params
          </Typography>
        </Container>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Seed
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Octaves
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Frequency
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Amplitude
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Register
          </Typography>
          <Input type="text" placeholder="0 to 255" sx={{ width: "10em", mr: 5 }} />
        </Box>
    </Box>
  );
}

function DefRulesGenerationParams(
  props: {
    instance: DefRulesGameMode,
    setViewMode: (mode: DefRulesViewMode) => void,
  }
) {
  return (
    <Box display="flex" flexDirection="column" width="30em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5}
            fontWeight={600}>
            Generation Params
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => props.setViewMode("format")}
            sx={{ fontWeight: 600 }} >
            Format
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => props.setViewMode("init_program")}
            sx={{ fontWeight: 600 }} >
            Init Program
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => props.setViewMode("pairwise_program")}
            sx={{ fontWeight: 600 }} >
            Pairwise Program
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => props.setViewMode("merge_program")}
            sx={{ fontWeight: 600 }} >
            Merge Program
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => props.setViewMode("final_program")}
            sx={{ fontWeight: 600 }} >
            Final Program
          </Button>
        </Box>
    </Box>
  );
}


function DefRulesGenerationFormat(
  _props: { instance: DefRulesGameMode }
) {
  return (
    <Box display="flex" flexDirection="column" width="30em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} color="primary.light"
            fontWeight={600}>
            Format
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            sx={{ fontWeight: 600 }} >
            Add Format
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="auto" height="100%" mt={4}
             m={2} border={1} borderRadius={5} borderColor={"primary.main"}
             overflow={"scroll"}>
        </Box>
    </Box>
  );
}


function DefRulesGenerationProgramColumn(
  props: {
    instance: DefRulesGameMode,
    title: string,
    placeholder: string,
  }
) {
  return (
    <Box display="flex" flexDirection="column" width="30em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5}
            fontWeight={600}>
            {props.title}
          </Typography>
        </Container>
        <Box position="relative" display="flex" flexDirection="row" width="auto" height="100%" mt={4}
             m={2} border={1} borderRadius={5} borderColor={"primary.main"} >
          <TextareaAutosize placeholder="Init program"
            style={{
              position: "absolute", width: "auto", height: "auto", top:0, left: 0, right: 0, bottom: 0, margin: "1em",
            }} />
        </Box>
    </Box>
  );
}

function DefRulesGenerationInitProgram(
  props: { instance: DefRulesGameMode }
) {
  return (
    <DefRulesGenerationProgramColumn
      instance={props.instance}
      title="Init Program"
      placeholder="Init program"
    />
  );
}


function DefRulesGenerationPairwiseProgram(
  props: { instance: DefRulesGameMode }
) {
  return (
    <DefRulesGenerationProgramColumn
      instance={props.instance}
      title="Pairwise Program"
      placeholder="Pairwise program"
    />
  );
}

function DefRulesGenerationMergeProgram(
  props: { instance: DefRulesGameMode }
) {
  return (
    <DefRulesGenerationProgramColumn
      instance={props.instance}
      title="Merge Program"
      placeholder="Merge program"
    />
  );
}

function DefRulesGenerationFinalProgram(
  props: { instance: DefRulesGameMode }
) {
  return (
    <DefRulesGenerationProgramColumn
      instance={props.instance}
      title="Final Program"
      placeholder="Final program"
    />
  );
}
