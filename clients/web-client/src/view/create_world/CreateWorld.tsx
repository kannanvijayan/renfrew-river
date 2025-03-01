import { Box, Button, Input, Typography } from "@mui/material";
import SecondStageFrame from "../common/SecondStageFrame";

export default function CreateWorld() {
  return (
    <SecondStageFrame title="Create World" onBackClicked={()=>{}}
        frameSx={{ width: "80rem", height: "auto"}}>
      <Box display="flex" flexDirection="column" overflow="scroll"
        width="100%" height="100%" margin="0" paddingBottom="1rem" sx={{
          backgroundColor: "secondary.dark",
          borderRadius: "0 0 2.5rem 2.5rem",
        }}>
        <InputEntry name="Name" />
        <InputEntry name="Description" />
        <InputEntry name="Seed" />
        <InputEntry name="Width" />
        <InputEntry name="Height" />
        {/* Create button */}
        <Box display="flex" flexDirection="row" margin="3rem 0"
          width="100%" sx={{ fontSize: "3rem"}}>
            <Button variant="contained" color="primary"
              sx={{
                margin: "auto",
                padding: "1rem 2rem",
                fontSize: "3rem",
                borderRadius: "1rem",
              }}>
              Create
            </Button>
        </Box>
      </Box>
    </SecondStageFrame>
  )
}

function InputEntry(props: {
  name: string,
}) {
  return (
    <Box flexDirection="row" display="flex" margin="3rem 0"
      width="100%" sx={{ fontSize: "3rem"}}>
      <Typography variant="h3" color="#622" margin="auto 0"
          sx={{
            fontWeight: 700,
            fontSize: "3rem",
            width: "30rem",
            textAlign: "right"
            }}>
        {props.name}
      </Typography>
      <Input sx={{
        backgroundColor: "secondary.light",
        borderRadius: "0.5rem",
        padding: "0 0.5rem",
        fontSize: "2rem",
        margin: "auto 0 auto 2rem",
      }} />
    </Box>
  )
}
