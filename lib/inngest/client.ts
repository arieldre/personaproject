import { Inngest } from 'inngest'

// Reads INNGEST_EVENT_KEY from env automatically.
// In dev, connects to local Inngest Dev Server (localhost:8288).
export const inngest = new Inngest({ id: 'persona-platform' })
