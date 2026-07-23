import { apiClient } from '@/lib/apiClient';

export interface InstanceData {
  _id: string;
  name: string;
  instanceId: string;
  phoneNumber?: string;
  status: 'connecting' | 'open' | 'close';
  qrCode?: string;
  pairingCode?: string;
  profilePic?: string;
  profileName?: string;
  batteryLevel?: number;
  dailyLimit: number;
  currentDayCount: number;
  createdAt: string;
}

export const instanceApi = {
  getInstances: async (): Promise<InstanceData[]> => {
    const res = await apiClient.get('/instances');
    return res.data.data;
  },

  getInstance: async (id: string): Promise<InstanceData> => {
    const res = await apiClient.get(`/instances/${id}`);
    return res.data.data;
  },

  createInstance: async (data: {
    name: string;
    loginMethod: 'qr' | 'phone';
    phoneNumber?: string;
    dailyLimit?: number;
  }): Promise<InstanceData> => {
    const res = await apiClient.post('/instances/create', data);
    return res.data.data;
  },

  getQRCode: async (id: string): Promise<{ qrCode: string; status: string; expiresInSeconds: number }> => {
    const res = await apiClient.get(`/instances/${id}/qr`);
    return res.data.data;
  },

  getPairingCode: async (id: string, phoneNumber: string): Promise<{ pairingCode: string }> => {
    const res = await apiClient.post(`/instances/${id}/pairing-code`, { phoneNumber });
    return res.data.data;
  },

  getStatus: async (id: string): Promise<{ status: string }> => {
    const res = await apiClient.get(`/instances/${id}/status`);
    return res.data.data;
  },

  restartInstance: async (id: string): Promise<void> => {
    await apiClient.post(`/instances/${id}/restart`);
  },

  disconnectInstance: async (id: string): Promise<void> => {
    await apiClient.post(`/instances/${id}/disconnect`);
  },

  refreshQR: async (id: string): Promise<{ qrCode: string }> => {
    const res = await apiClient.post(`/instances/${id}/refresh-qr`);
    return res.data.data;
  },

  deleteInstance: async (id: string): Promise<void> => {
    await apiClient.delete(`/instances/${id}`);
  },
};
