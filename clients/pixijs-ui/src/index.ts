import Game from "./game";

document.addEventListener('DOMContentLoaded', async () => {
  const app = Game.getInstance();
  await app.start();
});