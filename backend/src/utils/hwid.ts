import os from 'os';
import crypto from 'crypto';

export class HWIDGenerator {
  /**
   * Generates a unique 64-character SHA-256 Hardware ID based on machine properties
   */
  static getHWID(): string {
    const cpus = os.cpus().map((c) => c.model).join(';');
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const totalMem = os.totalmem();
    const networkInterfaces = JSON.stringify(os.networkInterfaces());

    const rawString = `VOXORA_${hostname}_${platform}_${arch}_${totalMem}_${cpus}_${networkInterfaces}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  /**
   * Returns human-readable host info
   */
  static getHostInfo(): { pcName: string; osInfo: string } {
    return {
      pcName: os.hostname() || 'Unknown-PC',
      osInfo: `${os.type()} ${os.release()} (${os.arch()})`,
    };
  }
}
