<template>
    <div class="resource-pool" v-loading="loading">
        <div class="toolbar">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item @click="goTo('')" style="cursor:pointer">uploads</el-breadcrumb-item>
                <el-breadcrumb-item v-for="(seg, i) in pathSegments" :key="i">
                    <span v-if="i === pathSegments.length - 1">{{ seg }}</span>
                    <a v-else @click="goTo(segmentsToPath(i))">{{ seg }}</a>
                </el-breadcrumb-item>
            </el-breadcrumb>
            <div class="spacer" />
            <el-input v-model="path" placeholder="相对路径，如 images/USER_ID" style="width: 280px;" clearable />
            <el-button @click="refresh" :loading="loading">刷新</el-button>
        </div>

        <el-row :gutter="12">
            <el-col :span="6">
                <el-card body-style="padding: 8px 8px;">
                    <el-tree
                        :data="treeRoot"
                        :props="treeProps"
                        node-key="fullPath"
                        lazy
                        :load="loadTree"
                        highlight-current
                        @node-click="onTreeNodeClick"
                    />
                </el-card>
            </el-col>
            <el-col :span="18">
                <el-table :data="items" stripe>
                    <el-table-column label="名称" min-width="280">
                        <template #default="scope">
                            <el-icon v-if="scope.row.type === 'dir'" style="vertical-align: -3px; margin-right: 6px;"><Folder /></el-icon>
                            <el-icon v-else style="vertical-align: -3px; margin-right: 6px;"><Document /></el-icon>
                            <a v-if="scope.row.type==='dir'" @click="enterDir(scope.row.name)">{{ scope.row.name }}</a>
                            <span v-else>{{ scope.row.name }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="类型" width="120">
                        <template #default="scope">
                            <el-tag v-if="scope.row.type==='dir'">目录</el-tag>
                            <el-tag v-else type="success">文件</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220">
                        <template #default="scope">
                            <el-button v-if="scope.row.type==='file'" type="primary" link @click="copyUrl(scope.row.url)">复制URL</el-button>
                            <el-button v-if="scope.row.type==='file'" type="primary" link @click="preview(scope.row.url)">预览</el-button>
                            <el-button v-if="scope.row.type==='dir'" type="primary" link @click="enterDir(scope.row.name)">进入</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-col>
        </el-row>

        <el-dialog v-model="previewVisible" title="预览" width="60%">
            <div class="preview-box">
                <img v-if="isImage(previewUrl)" :src="previewUrl" alt="preview" />
                <div v-else class="file-tip">
                    <el-link :href="previewUrl" target="_blank">在新标签页打开</el-link>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listUploads, signUploadUrl } from '@/axios/uploads'
import { Folder, Document } from '@element-plus/icons-vue'

type Item = { name: string; type: 'dir'|'file'; url?: string | null }

const loading = ref(false)
const path = ref('')
const items = ref<Item[]>([])
// 左侧目录树
const treeRoot = ref([{ label: 'uploads', fullPath: '' }])
const treeProps = { label: 'label', children: 'children', isLeaf: 'isLeaf' }

const loadTree = async (node: any, resolve: (data: any[]) => void) => {
    // 根节点：加载 images/ 与 files/
    if (node.level === 0) {
        resolve([{ label: 'images', fullPath: 'images' }, { label: 'files', fullPath: 'files' }])
        return
    }
    try {
        const fullPath: string = node.data.fullPath
        const res = await listUploads(fullPath)
        if (res.data?.success) {
            const dirs = (res.data.data.items as Item[]).filter(x => x.type === 'dir')
            const children = dirs.map(d => ({ label: d.name, fullPath: [fullPath, d.name].filter(Boolean).join('/') }))
            resolve(children)
        } else {
            resolve([])
        }
    } catch {
        resolve([])
    }
}

const onTreeNodeClick = (data: any) => {
    goTo(data.fullPath || '')
}

const pathSegments = computed(() => path.value.split('/').filter(Boolean))
const segmentsToPath = (endIndex: number) => pathSegments.value.slice(0, endIndex + 1).join('/')

const refresh = async () => {
    try {
        loading.value = true
        const res = await listUploads(path.value || undefined)
        if (res.data?.success) {
            items.value = res.data.data.items || []
            // 同步为后端返回的规范化路径
            path.value = res.data.data.path || ''
        }
    } catch (e) {
        ElMessage.error('加载失败')
    } finally {
        loading.value = false
    }
}

const goTo = (p: string) => {
    path.value = p
    refresh()
}

const enterDir = (name: string) => {
    path.value = [path.value, name].filter(Boolean).join('/')
    refresh()
}

const copyUrl = async (url?: string | null) => {
    if (!url) return
    try {
        const signed = await makeSignedUrl(url)
        await navigator.clipboard.writeText(signed)
        ElMessage.success('已复制受保护URL')
    } catch {
        ElMessage.error('复制失败')
    }
}

const isImage = (u: string) => {
    if (!u) return false
    // 直链判断
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(u) || u.startsWith('/uploads/images/')) return true
    // 签名链接判断：解析 query 中的 path 参数的后缀
    try {
        const urlObj = new URL(u, window.location.origin)
        const pathParam = urlObj.searchParams.get('path') || ''
        if (/\.(png|jpe?g|gif|webp|svg)$/i.test(pathParam)) return true
        if (pathParam.startsWith('images/')) return true
    } catch {}
    return false
}
const toRelativePath = (u: string) => u.replace(/^\/uploads\//, '')
const makeSignedUrl = async (u: string) => {
    const rel = toRelativePath(u)
    const res = await signUploadUrl(rel, 300)
    return res.data?.data?.url || u
}

const previewVisible = ref(false)
const previewUrl = ref('')
const preview = async (url?: string | null) => {
    if (!url) return
    previewUrl.value = await makeSignedUrl(url)
    previewVisible.value = true
}

onMounted(() => refresh())
</script>

<style scoped>
.resource-pool { padding: 16px; }
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.spacer { flex: 1; }
.preview-box { display: flex; align-items: center; justify-content: center; min-height: 40vh; }
.preview-box img { max-width: 100%; max-height: 70vh; }
</style>


