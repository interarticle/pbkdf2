import { MainController } from './main';

async function init() {
  try {
    await new MainController().bootstrap()
  } catch (err) {
    alert(`Initialization failed: ${err}`);
  }
}

init();
