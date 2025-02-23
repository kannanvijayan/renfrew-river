import { Box, Popover, Typography } from "@mui/material";
import { useState } from "react";

export default function ValidationErrors(props: {
  errors: string[],
  exclaimText?: string,
  exclaimSx?: Parameters<typeof Typography>[0]["sx"],
}) {
  const { errors, exclaimSx } = props;
  const hasErrors = errors.length > 0;

  const exclaimText = props.exclaimText || "❗";

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const onExclamationClick = (event: React.MouseEvent<HTMLElement>) => {
    if (hasErrors) {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isPopoverOpen = anchorEl !== null;

  return (
    <Box display="block" flexDirection="column" margin="0" padding="0"
        textAlign="left">
      <Typography variant="h3" color={"error.main"}
        onClick={onExclamationClick}
        sx={exclaimSx}>
        {exclaimText}
      </Typography>
      {
        hasErrors ?
            (
              <Popover open={isPopoverOpen} anchorEl={anchorEl} onClose={handleClose}>
                <ErrorList errors={errors} />
              </Popover>
            )
        : undefined
      }
    </Box>
  );
}

function ErrorList(props: {
  errors: string[]
}) {
  const { errors } = props;
  return (
    <Box display="flex" flexDirection="column" margin="0" padding="0"
      textAlign="left"
      sx={{
        backgroundColor: "error.light",
      }}>
    {
      errors.map((error, index) => (
        <Typography key={index} variant="h4" color={"error.contrastText"}
          fontSize="1.5rem"
          sx={{
            margin: "0.5rem 1rem 0.5rem 1rem",
            padding: "0.5rem 1rem 0.5rem 0",
          }}>
          {error}
        </Typography>
      ))
    }
    </Box>
  );
}
