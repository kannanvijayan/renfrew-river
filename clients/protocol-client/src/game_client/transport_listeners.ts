
type GameClientTransportListeners = {
  open: () => void;
  close: () => void;
  error: (err: unknown) => void;
  message: (msg: string) => void;
};

export default GameClientTransportListeners;
