import 'dotenv/config';
import { createApp } from './app';

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Pollify server running on http://localhost:${PORT}`);
});
