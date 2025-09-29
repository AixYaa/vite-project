import instance from './index';

export const fetchUsers = (params: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' } = {}) => {
  return instance.get('/users', { params });
};

export const fetchUserById = (id: string) => {
  return instance.get(`/users/${id}`);
};

export const createUser = (data: any) => {
  return instance.post('/users', data);
};

export const updateUser = (id: string, data: any) => {
  return instance.put(`/users/${id}`, data);
};

export const deleteUser = (id: string) => {
  return instance.delete(`/users/${id}`);
};

export const toggleUserStatus = (id: string, isActive: boolean) => {
  return instance.patch(`/users/${id}/status`, { isActive });
};
