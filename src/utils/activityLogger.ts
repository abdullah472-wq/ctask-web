import { logActivity } from './logger';

export async function logAdminAction(action: string, details: string) {
  return logActivity({
    actionType: 'admin',
    description: `${action}: ${details}`,
    role: 'admin'
  });
}
