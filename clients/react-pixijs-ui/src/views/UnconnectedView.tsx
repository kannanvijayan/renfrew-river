import { Box } from '@mui/material';

import ServerSelector from '../components/ServerSelector';
import BannerLogo from '../components/BannerLogo';
import ViewState from '../ViewState';

export default function UnconnectedView(
  props: {
    onConnectClicked: (server: string) => void,
    viewState: ViewState,
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
