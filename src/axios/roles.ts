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


