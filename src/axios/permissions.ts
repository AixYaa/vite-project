import instance from './index';

export const fetchPermissionTree = () => {
  return instance.get('/permissions/tree');
}

export const fetchPermissions = (params: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' } = {}) => {
  return instance.get('/permissions', { params });
};

export const fetchPermissionById = (id: string) => {
  return instance.get(`/permissions/${id}`);
};

export const createPermission = (data: any) => {
  return instance.post('/permissions', data);
};

export const updatePermission = (id: string, data: any) => {
  return instance.put(`/permissions/${id}`, data);
};

export const deletePermission = (id: string) => {
  return instance.delete(`/permissions/${id}`);
};


