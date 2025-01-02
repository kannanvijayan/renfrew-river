import { Box } from '@mui/material';

export default function Screen(
  props: {
    children?: React.ReactNode,
  }
) {
  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column',
        position: 'absolute', width: '100%', height: '100%',
        top: 0, left: 0, right: 0, bottom: 0,
        m: 0, p: 0,
        backgroundColor: 'primary.dark',
      }}
      alignItems={'center'}
    >
      {props.children}
    </Box>
  );
};
