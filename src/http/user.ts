import axios from "@/http/axios.ts";

// 获取用户权限编码
export const getUserPermissions = (userId: number) => {
    return axios({
        url: '/api/user/user-permissions',
        method: 'POST',
        params: {
            userId: userId
        }
    })
}

export const Userdata = (userId: number) => {
    return axios({
        url: '/api/user/Userdata',
        method: 'POST',
        params: {
            userId: userId
        }
    })
}

// 分页获取用户列表
export const getUserPage = (userId: number, pageRequest: any) => {
    return axios({
        url: '/api/user/page',
        method: 'POST',
        params: {
            userId: userId
        },
        data: pageRequest
    })
}

export const updateUser = (userId: number, data: any) => {
    return axios({
        url: '/api/user/updateUser',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

export const adduser = (userId: number, data: any) => {
    return axios({
        url: '/api/user/adduser',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

export const deleteUser = (userId: number, data: any) => {
    return axios({
        url: '/api/user/deleteUser',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

export const insertUserRole = (userId: number, data: any) => {
    return axios({
        url: '/api/user/insertUserRole',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

export const getUserRole = (userId: number) => {
    return axios({
        url: '/api/user/getUserRole',
        method: 'POST',
        params: {
            userId: userId
        }
    })
}