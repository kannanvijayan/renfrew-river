import { Box } from '@mui/material';

import ServerSelector from './ServerSelector';
import BannerLogo from './BannerLogo';

export default function UnconnectedScreen(
  props: {
    onConnectClicked: (server: string) => void,
  }
) {
  return (
    <Box display="flex" flexDirection="column" position="absolute"
      width="100%" height="100%" alignItems="center"
      top={0} left={0} right={0} bottom={0}
      m={0} p={0}
      sx={{
        backgroundColor: 'primary.dark',
      }}
    >
      <BannerLogo />
      <ServerSelector onConnectClicked={props.onConnectClicked} />
    </Box>
  );
};
