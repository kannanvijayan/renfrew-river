import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

// Accepts a callback function to call when "Connect" button is clicked.
export default function MainMenuFrame(
  props: {
    children: ReactNode,
    title: string,
  }
) {
  return (
    /* Make a vertical layout of a title, a labeled server selector input,
     * and a connect button.
     */
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: "secondary.light", p: 4, borderRadius: 1,
      m: 4, boxShadow: 3,
    }} width="fit-content">

      { /* Title */ }
      <Typography variant="h5" sx={{ mb: 2, borderBottom: 2 }} color="textSecondary">
        {props.title}
      </Typography>

      {props.children}
    </Box>
  );
};

export function MainMenuLabeledEntry(
  props: {
    label: string,
    targetId: string,
    children: ReactNode,
    isValid?: boolean,
  }
) {
  const isValid = props.isValid ?? true;
  return (
    <Box display="flex" flexDirection="row" alignItems="center">
      <Typography
        variant="body2" component="label" htmlFor={props.targetId}
        sx={{ mr: 2, color: isValid ? 'textPrimary' : 'error.main' }}
      >
        {props.label}
      </Typography>
      {props.children}
    </Box>
  );
}
