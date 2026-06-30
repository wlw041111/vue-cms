import axios from "@/http/axios.ts";

export interface PermissionPayload {
    name: string
    type: string
    router: string
    parentId: number
}

export interface Permission {
    id: number
    name: string
    menuType: string
    path: string
    parentId: number
    code?: string
    sort?: number
    createTime?: string
}

export interface ApiResponse {
    success: boolean
    message: string
    data?: any
}

// 获取用户权限编码列表
export const getUserPermissions = (userId: number) => {
    return axios({
        url: '/api/permission/user-permissions',
        method: 'GET',
        params: {
            userId: userId
        }
    })
}

// 获取权限列表（不分页）
export const getPermissionList = (userId: number) => {
    return axios({
        url: '/api/permission/list',
        method: 'GET',
        params: {
            userId: userId
        }
    })
}

// 分页获取权限列表
export const getPermissionPage = (userId: number, pageRequest: any) => {
    return axios({
        url: '/api/permission/page',
        method: 'POST',
        params: {
            userId: userId
        },
        data: pageRequest
    })
}

// 新增权限
export const createPermission = (userId: number, data: PermissionPayload) => {
    return axios({
        url: '/api/permission/add',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

// 更新权限
export const updatePermission = (id: number, userId: number, data: PermissionPayload) => {
    return axios({
        url: `/api/permission/update/${id}`,
        method: 'PUT',
        params: {
            userId: userId
        },
        data
    })
}

// 删除权限
export const deletePermission = (id: number, userId: number) => {
    return axios({
        url: `/api/permission/delete/${id}`,
        method: 'DELETE',
        params: {
            userId: userId
        }
    })
}