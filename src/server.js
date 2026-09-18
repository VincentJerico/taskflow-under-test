import { createApp } from './app.js';
import { createDb } from './db.js';

const PORT = process.env.PORT || 3000;
const app = createApp(createDb());

app.listen(PORT, () => {
  console.log(`TaskFlow running on http://localhost:${PORT}`);
});
