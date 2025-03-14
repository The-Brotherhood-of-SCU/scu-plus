<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';

const posts = ref([]);

const shortTime = (timeStr) => {
    return new Date(timeStr).toLocaleDateString('zh-CN',
        { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getPosts = async () => {
    const result = await chrome.runtime.sendMessage({
        action: 'request',
        url: 'https://imarket.jeanhua.cn/api/Post/Posts?page=1&pageSize=10'
    });
    if (result.success) {
        posts.value = JSON.parse(result.data).posts;
    }
};

const jump = (url:string)=>{
    window.open(url);
}
onMounted(() => {
    getPosts();
});

</script>

<template>
    <div class="imarket">
        <div class="head">🎯 集市热帖</div>
        <div class="content">
            <div class="item" v-for="(post,index) in posts" :key="post.id" @click="jump(`https://imarket.jeanhua.cn/#/post/${post.id}`)">
                <div class="order">{{ index+1 }}</div>
                <div class="info">
                    <div class="title">{{ post.title }}</div>
                    <div class="meta">{{ shortTime(post.createdAt) }} · 👤{{ post.nickname }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.imarket {
    width: 100%;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: system-ui, -apple-system, sans-serif;
}

.head {
    padding: 12px 16px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: white;
    font-weight: 600;
    font-size: 15px;
    border-radius: 8px 8px 0 0;
}

.content {
    height: 300px;
    padding: 8px 0;
    overflow-y: auto;
}

.item {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    transition: all 0.2s;
    cursor: pointer;
}

.item:hover {
    background: #dfebf6;
}

.order {
    width: 24px;
    height: 24px;
    background: #e0e7ff;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #4f46e5;
    font-weight: 500;
}

.info {
    flex: 1;
}

.title {
    font-size: 13px;
    color: #1e293b;
    line-height: 1.4;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.meta {
    font-size: 11px;
    color: #64748b;
    display: flex;
    gap: 8px;
    align-items: center;
}

.content::-webkit-scrollbar {
    width: 6px;
}

.content::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}
</style>