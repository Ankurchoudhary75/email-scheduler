import fs from 'fs';
import path from 'path';

interface StorageSchema {
  users: any[];
  senders: any[];
  emailJobs: any[];
  rateLimitLogs: any[];
}

const storagePath = path.resolve(__dirname, '../../prisma/embedded_storage.json');

function loadStorage(): StorageSchema {
  try {
    if (fs.existsSync(storagePath)) {
      const data = fs.readFileSync(storagePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {}

  return {
    users: [
      {
        id: '2500ca3d-f237-48af-8ca7-85de2bef3da9',
        email: 'ankur.demo@reachinbox.ai',
        name: 'Ankur Choudhary',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        googleId: 'google-demo-default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    senders: [
      {
        id: 'default-sender-1',
        email: 'outbound@reachinbox.demo',
        name: 'ReachInbox Outbound Dispatcher',
        hourlyLimit: 200,
        minDelayMs: 2000,
        createdAt: new Date().toISOString(),
      },
    ],
    emailJobs: [],
    rateLimitLogs: [],
  };
}

let memoryStorage: StorageSchema = loadStorage();

function saveStorage() {
  try {
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storagePath, JSON.stringify(memoryStorage, null, 2), 'utf8');
  } catch (err: any) {
    console.warn('[Embedded Storage] Save warning:', err.message);
  }
}

export const embeddedDb = {
  user: {
    async upsert(args: any) {
      const { where, update, create } = args;
      let existingIndex = memoryStorage.users.findIndex((u) => u.email === where.email || (where.id && u.id === where.id));
      if (existingIndex >= 0) {
        memoryStorage.users[existingIndex] = { ...memoryStorage.users[existingIndex], ...update, updatedAt: new Date().toISOString() };
        saveStorage();
        return memoryStorage.users[existingIndex];
      } else {
        const id = create.id || `user-${Date.now()}`;
        const newUser = { id, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        memoryStorage.users.push(newUser);
        saveStorage();
        return newUser;
      }
    },
    async findUnique(args: any) {
      const { where } = args;
      return memoryStorage.users.find((u) => (where.id && u.id === where.id) || (where.email && u.email === where.email)) || null;
    },
    async update(args: any) {
      const { where, data } = args;
      const index = memoryStorage.users.findIndex((u) => u.id === where.id);
      if (index >= 0) {
        memoryStorage.users[index] = { ...memoryStorage.users[index], ...data, updatedAt: new Date().toISOString() };
        saveStorage();
        return memoryStorage.users[index];
      }
      throw new Error(`User ${where.id} not found in embedded store`);
    },
  },

  sender: {
    async count() {
      return memoryStorage.senders.length;
    },
    async findFirst() {
      return memoryStorage.senders[0] || null;
    },
    async findMany() {
      return [...memoryStorage.senders];
    },
    async findUnique(args: any) {
      return memoryStorage.senders.find((s) => (args.where.id && s.id === args.where.id) || (args.where.email && s.email === args.where.email)) || null;
    },
    async create(args: any) {
      const newSender = { id: `sender-${Date.now()}`, ...args.data, createdAt: new Date().toISOString() };
      memoryStorage.senders.push(newSender);
      saveStorage();
      return newSender;
    },
    async update(args: any) {
      const index = memoryStorage.senders.findIndex((s) => s.id === args.where.id);
      if (index >= 0) {
        memoryStorage.senders[index] = { ...memoryStorage.senders[index], ...args.data };
        saveStorage();
        return memoryStorage.senders[index];
      }
      return null;
    },
  },

  emailJob: {
    async create(args: any) {
      const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newJob = {
        id,
        status: 'SCHEDULED',
        attempts: 0,
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStorage.emailJobs.push(newJob);
      saveStorage();
      return newJob;
    },
    async findUnique(args: any) {
      const job = memoryStorage.emailJobs.find((j) => j.id === args.where.id);
      if (!job) return null;
      if (args.include?.sender) {
        const sender = memoryStorage.senders.find((s) => s.id === job.senderId);
        return { ...job, sender };
      }
      return job;
    },
    async findMany(args: any = {}) {
      let list = [...memoryStorage.emailJobs];
      if (args.where?.status) {
        if (args.where.status.in) {
          list = list.filter((j) => args.where.status.in.includes(j.status));
        } else if (typeof args.where.status === 'string') {
          list = list.filter((j) => j.status === args.where.status);
        }
      }
      if (args.where?.userId) {
        list = list.filter((j) => j.userId === args.where.userId);
      }
      if (args.where?.OR) {
        const queries = args.where.OR;
        list = list.filter((j) =>
          queries.some((q: any) => {
            if (q.recipient?.contains) return (j.recipient || '').toLowerCase().includes(q.recipient.contains.toLowerCase());
            if (q.subject?.contains) return (j.subject || '').toLowerCase().includes(q.subject.contains.toLowerCase());
            if (q.body?.contains) return (j.body || '').toLowerCase().includes(q.body.contains.toLowerCase());
            return false;
          })
        );
      }

      // Attach relations
      if (args.include?.sender) {
        list = list.map((j) => ({
          ...j,
          sender: memoryStorage.senders.find((s) => s.id === j.senderId) || memoryStorage.senders[0],
        }));
      }

      // Sorting
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    },
    async update(args: any) {
      const index = memoryStorage.emailJobs.findIndex((j) => j.id === args.where.id);
      if (index >= 0) {
        memoryStorage.emailJobs[index] = { ...memoryStorage.emailJobs[index], ...args.data, updatedAt: new Date().toISOString() };
        saveStorage();
        return memoryStorage.emailJobs[index];
      }
      throw new Error(`EmailJob ${args.where.id} not found in embedded store`);
    },
    async delete(args: any) {
      memoryStorage.emailJobs = memoryStorage.emailJobs.filter((j) => j.id !== args.where.id);
      saveStorage();
      return { success: true };
    },
    async count(args: any = {}) {
      let list = [...memoryStorage.emailJobs];
      if (args.where?.status) {
        list = list.filter((j) => j.status === args.where.status);
      }
      if (args.where?.userId) {
        list = list.filter((j) => j.userId === args.where.userId);
      }
      return list.length;
    },
  },

  rateLimitLog: {
    async upsert(args: any) {
      const { where, update, create } = args;
      const key = `${where.senderId_hourWindow?.senderId}_${where.senderId_hourWindow?.hourWindow}`;
      let item = memoryStorage.rateLimitLogs.find((l) => `${l.senderId}_${l.hourWindow}` === key);
      if (item) {
        item.count = (item.count || 0) + (update.count?.increment || 1);
      } else {
        item = { id: `log-${Date.now()}`, ...create };
        memoryStorage.rateLimitLogs.push(item);
      }
      saveStorage();
      return item;
    },
  },
};
