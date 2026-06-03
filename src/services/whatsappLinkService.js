import api from './api';

export async function createWhatsAppLinkCode() {
  const response = await api.post('/whatsapp-link/codes');
  return response.data?.data;
}

export async function getWhatsAppLinks() {
  const response = await api.get('/whatsapp-link/links');
  return response.data?.data?.links || [];
}
