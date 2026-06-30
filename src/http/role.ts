import axios from "@/http/axios.ts";

export interface RolePayload {
    name: string
}

export interface RolePageQuery {
    currentPage: number
    pageSize: number
    params: Array<{
        name: string
        value: string
    }>
}

export interface RoleAuthorizePayload {
    roleId: number
    permissionIds: number[]
}

// 获取用户权限编码
export const getUserRolePermissions = (userId: number) => {
    return axios({
        url: '/api/role/user-permissions',
        method: 'GET',
        params: {
            userId: userId
        }
    })
}

// 获取角色列表
export const getRoleInfoPage = (userId: number, data: RolePageQuery) => {
    return axios({
        url: '/api/role/getRoleInfoPage',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

// 新增角色
export const createRole = (userId: number, data: RolePayload) => {
    return axios({
        url: '/api/role',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

// 更新角色
export const updateRole = (id: number, userId: number, data: RolePayload) => {
    return axios({
        url: `/api/role/${id}`,
        method: 'PUT',
        params: {
            userId: userId
        },
        data
    })
}

// 删除角色
export const deleteRole = (id: number, userId: number) => {
    return axios({
        url: `/api/role/${id}`,
        method: 'DELETE',
        params: {
            userId: userId
        }
    })
}

// 获取权限树
export const getPermissionTree = (userId: number) => {
    return axios({
        url: '/api/role/permissionTree',
        method: 'GET',
        params: {
            userId: userId
        }
    })
}

// 获取角色已有权限ID
export const getRolePermissionIds = (roleId: number, userId: number) => {
    return axios({
        url: `/api/role/${roleId}`,
        method: 'GET',
        params: {
            userId: userId
        }
    })
}

// 保存角色授权
export const authorizeRole = (userId: number, data: RoleAuthorizePayload) => {
    return axios({
        url: '/api/role/authorize',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}