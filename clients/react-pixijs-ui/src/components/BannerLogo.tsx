import { Box, Typography } from '@mui/material';

export default function BannerLogo() {
  return (
    <Box sx={{
      m: 4, px: 20, py: 5, boxShadow: 3, borderRadius: 1,
      backgroundColor: 'primary.light',
    }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Renfrew River
      </Typography>
      <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
        A simulation game.
      </Typography>
    </Box>
  );
};
