import instance from './index';

export const fetchRoles = (params: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' } = {}) => {
  return instance.get('/roles', { params });
};

export const fetchRoleById = (id: string) => {
  return instance.get(`/roles/${id}`);
};

export const createRole = (data: any) => {
  return instance.post('/roles', data);
};

export const updateRole = (id: string, data: any) => {
  return instance.put(`/roles/${id}`, data);
};

export const deleteRole = (id: string) => {
  return instance.delete(`/roles/${id}`);
};

// ------ API Keys for Role ------
export const listRoleApiKeys = (roleId: string) => {
  return instance.get(`/roles/${roleId}/api-keys`);
};

export const generateRoleApiKey = (roleId: string, remark: string = '') => {
  return instance.post(`/roles/${roleId}/api-keys`, { remark });
};

export const toggleRoleApiKey = (roleId: string, key: string, isActive: boolean) => {
  return instance.put(`/roles/${roleId}/api-keys/toggle`, { key, isActive });
};

export const revokeRoleApiKey = (roleId: string, key: string) => {
  return instance.delete(`/roles/${roleId}/api-keys/${encodeURIComponent(key)}`);
};


