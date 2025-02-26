import { Box, Typography } from "@mui/material";

export default function EditorBox(props: {
  title: string,
  children: React.ReactNode,
}) {
  const { title, children } = props;
  return (
    <Box display="flex" flexDirection="column"
        margin="0" padding="0" width="100%" height="100%" textAlign={"left"}
        minHeight="5rem" position="relative">
      <DefineRulesetEditorBoxTitle title={title} />
      <Box display="flex" flexDirection="column" margin="0 0 2rem 0" padding="0"
           width="100%" textAlign="left" flex="1"
           position="relative" overflow="scroll"
           sx={{ scrollbarColor: "#622 #caa" }}>
        {children}
      </Box>
    </Box>
  )
}

function DefineRulesetEditorBoxTitle(props: {
  title: string,
}) {
  return (
    <Typography variant="h3" color={"primary.dark"}
      fontSize="2.5rem" margin="0" padding="1rem" width="100%"
      fontWeight={700}
      flex={0}
      sx={{
        textAlign: "center",
        backgroundColor: "primary.light",
      }}>
      {props.title}
    </Typography>
  );
}
