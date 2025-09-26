import instance from './index';

export const fetchMenus = (params: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' } = {}) => {
  return instance.get('/menus', { params });
};

export const fetchMenuTree = () => {
  return instance.get('/menus/tree');
};

export const fetchMyMenus = () => {
  return instance.get('/menus/my');
};

export const fetchMenuById = (id: string) => {
  return instance.get(`/menus/${id}`);
};

export const createMenu = (data: any) => {
  return instance.post('/menus', data);
};

export const updateMenu = (id: string, data: any) => {
  return instance.put(`/menus/${id}`, data);
};

export const deleteMenu = (id: string) => {
  return instance.delete(`/menus/${id}`);
};

export const syncMenus = (items: any[]) => {
  return instance.post('/menus/sync', { items });
};


