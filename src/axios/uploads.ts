import instance from './index'

export const listUploads = (path?: string) => {
    return instance.get('/uploads/list', { params: { path } })
}

export const signUploadUrl = (path: string, expires = 300) => {
    return instance.get('/uploads/sign', { params: { path, expires } })
}


