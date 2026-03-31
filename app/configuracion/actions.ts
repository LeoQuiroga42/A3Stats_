'use server';

import fs from 'fs';
import path from 'path';

export async function updateAdminPassword(newPassword: string) {
  try {
    const configPath = path.join(process.cwd(), 'admin_config.json');
    let config: any = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    config.adminPassword = newPassword;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
