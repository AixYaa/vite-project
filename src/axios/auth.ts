import instance from './index';

export const getProfile = () => {
    return instance.get('/auth/profile');
};

export const updateProfile = (data: { username?: string; email?: string; password?: string; avatar?: string; }) => {
    return instance.put('/auth/profile', data);
};

export const uploadAvatar = (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return instance.post('/auth/upload-avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};


