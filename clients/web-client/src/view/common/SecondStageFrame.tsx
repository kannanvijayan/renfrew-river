import { Box, Divider, styled, Typography } from "@mui/material";
import { ReactNode } from "react";

const SecondStageFrameBox = styled(Box)({
  display: "flex",
  flexDirection: "column",
  textAlign: "center",
  width: "75%",
  height: "75%",
  margin: "auto",
  borderRadius: "3rem",
  border: "0.5em solid #ccaa66",
  padding: "2rem 0 0 0",
});

export default function SecondStageFrame(props: {
  title: ReactNode,
  onBackClicked: () => void,
  children: ReactNode,
  frameSx?: Parameters<typeof SecondStageFrameBox>[0]["sx"],
}) {
  const { title, children, onBackClicked, frameSx } = props;
  return (
    <SecondStageFrameBox sx={{ ...frameSx, backgroundColor: "primary.dark" }}>
      <Title title={title} onBackClicked={onBackClicked} />
      <Divider sx={{
        backgroundColor: "secondary.main",
        height: "2px",
        width: "100%",
        margin: 0,
      }}/>
      {children}
    </SecondStageFrameBox>
  )
}

function Title(props: {
  title: ReactNode,
  onBackClicked: () => void,
}) {
  const { title, onBackClicked } = props
  return (
    <Typography variant="h1" color={"primary.contrastText"} position="relative"
        sx={{ margin: 0, flex: 0 }}>
      <Typography display="block" position="absolute" fontSize="5rem" left="2rem"
          onClick={onBackClicked}
          sx={{
            float: "left",
            filter: "brightness(3)",
            "&:hover": { textShadow: "0 0 0.05rem #ccaa66" },
            }}>
        🔙
      </Typography>
      {title}
    </Typography>
  )
}
