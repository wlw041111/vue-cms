// src/http/new.ts
import axios from "@/http/axios.ts";

interface newData {
    id?: number;
    title: string;
    category: string;
    supplier?: string;
    reviewer?: string;
    content: string;
}

// 获取用户权限
export const getUserNewsPermissions = (userId: number) => {
    return axios({
        url: '/api/news/user-permissions',
        method: 'POST',
        params: {
            userId: userId
        }
    })
}

// 保存新闻
export const SaveNews = (userId: number, data: newData) => {
    return axios({
        url: '/api/news/savenews',
        method: 'post',
        params: {
            userId: userId
        },
        data
    })
}

// 获取所有新闻列表
export const getNewsList = (userId: number) => {
    return axios({
        url: '/api/news/newslist',
        method: 'get',
        params: {
            userId: userId
        }
    })
}

// 分页获取新闻列表
export const getNewsListPage = (userId: number, currentPage: number = 1, pageSize: number = 10) => {
    return axios({
        url: '/api/news/newslist-page',
        method: 'get',
        params: {
            userId: userId,
            currentPage: currentPage,
            pageSize: pageSize
        }
    })
}

// 根据类型获取新闻
export const getNewsByType = (userId: number, category: string) => {
    return axios({
        url: '/api/news/newsbytype',
        method: 'get',
        params: {
            userId: userId,
            newsType: category
        }
    })
}

// 获取新闻详情
export const getNewsDetail = (userId: number, id: number) => {
    return axios({
        url: '/api/news/newsdetail',
        method: 'get',
        params: {
            userId: userId,
            id: id
        }
    })
}

// 更新新闻状态（status: APPROVED / REJECTED）
export const updateNewsStatus = (userId: number, id: number, status: string) => {
    return axios({
        url: '/api/news/update-status',
        method: 'POST',
        params: {
            userId: userId
        },
        data: {
            id,
            status
        }
    })
}

// 更新新闻
export const updateNews = (userId: number, data: any) => {
    return axios({
        url: '/api/news/update',
        method: 'POST',
        params: {
            userId: userId
        },
        data
    })
}

// 删除新闻
export const deleteNews = (userId: number, id: number) => {
    return axios({
        url: '/api/news/delete',
        method: 'DELETE',
        params: {
            userId: userId,
            id: id
        }
    })
}
