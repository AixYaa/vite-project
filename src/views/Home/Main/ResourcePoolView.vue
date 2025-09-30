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

        <div class="main-content">
            <!-- 左侧目录树 -->
            <div class="sidebar">
                <el-card class="tree-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <el-icon>
                                <FolderOpened />
                            </el-icon>
                            <span>目录结构</span>
                        </div>
                    </template>
                    <el-tree ref="treeRef" :data="treeRoot" :props="treeProps" node-key="fullPath" lazy :load="loadTree"
                        highlight-current :current-key="currentTreeKey" @node-click="onTreeNodeClick"
                        class="directory-tree">
                        <template #default="{ node, data }">
                            <div class="tree-node">
                                <el-icon v-if="data.type === 'dir'" class="folder-icon">
                                    <Folder />
                                </el-icon>
                                <el-icon v-else class="file-icon">
                                    <Document />
                                </el-icon>
                                <span class="node-label" :title="data.label">{{ data.label }}</span>
                            </div>
                        </template>
                    </el-tree>
                </el-card>
            </div>

            <!-- 右侧文件网格 -->
            <div class="content-area">
                <el-card class="files-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <el-icon>
                                <Files />
                            </el-icon>
                            <span>文件列表</span>
                            <div class="view-toggle">
                                <el-button-group>
                                    <el-button :type="viewMode === 'grid' ? 'primary' : ''" @click="viewMode = 'grid'">
                                        <el-icon>
                                            <Grid />
                                        </el-icon>
                                    </el-button>
                                    <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">
                                        <el-icon>
                                            <List />
                                        </el-icon>
                                    </el-button>
                                </el-button-group>
                            </div>
                        </div>
                    </template>

                    <!-- 网格视图 -->
                    <div v-if="viewMode === 'grid'" class="file-grid">
                        <div v-for="item in items" :key="item.name" class="file-item" @click="handleItemClick(item)">
                            <div class="file-icon">
                                <el-icon v-if="item.type === 'dir'" class="folder-icon">
                                    <Folder />
                                </el-icon>
                                <el-icon v-else class="file-icon-inner">
                                    <Document />
                                </el-icon>
                            </div>
                            <div class="file-info">
                                <div class="file-name" :title="item.name">{{ item.name }}</div>
                                <div class="file-type">
                                    <el-tag v-if="item.type === 'dir'" size="small" type="info">目录</el-tag>
                                    <el-tag v-else size="small" type="success">文件</el-tag>
                                </div>
                            </div>
                            <div class="file-actions" v-if="item.type === 'file'">
                                <el-button type="primary" size="small" text @click.stop="copyUrl(item.url)">
                                    <el-icon>
                                        <CopyDocument />
                                    </el-icon>
                                </el-button>
                                <el-button type="primary" size="small" text @click.stop="preview(item.url)">
                                    <el-icon>
                                        <View />
                                    </el-icon>
                                </el-button>
                            </div>
                        </div>
                    </div>

                    <!-- 列表视图 -->
                    <el-table v-else :data="items" stripe class="file-table">
                        <el-table-column label="名称" min-width="280">
                            <template #default="scope">
                                <el-icon v-if="scope.row.type === 'dir'"
                                    style="vertical-align: -3px; margin-right: 6px;">
                                    <Folder />
                                </el-icon>
                                <el-icon v-else style="vertical-align: -3px; margin-right: 6px;">
                                    <Document />
                                </el-icon>
                                <a v-if="scope.row.type === 'dir'" @click="enterDir(scope.row.name)">{{ scope.row.name
                                    }}</a>
                                <span v-else>{{ scope.row.name }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="类型" width="120">
                            <template #default="scope">
                                <el-tag v-if="scope.row.type === 'dir'">目录</el-tag>
                                <el-tag v-else type="success">文件</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="220">
                            <template #default="scope">
                                <el-button v-if="scope.row.type === 'file'" type="primary" link
                                    @click="copyUrl(scope.row.url)">复制URL</el-button>
                                <el-button v-if="scope.row.type === 'file'" type="primary" link
                                    @click="preview(scope.row.url)">预览</el-button>
                                <el-button v-if="scope.row.type === 'dir'" type="primary" link
                                    @click="enterDir(scope.row.name)">进入</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </div>
        </div>

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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { listUploads, signUploadUrl } from '@/axios/uploads'
import {
    Folder,
    Document,
    FolderOpened,
    Files,
    Grid,
    List,
    CopyDocument,
    View,
    Expand
} from '@element-plus/icons-vue'

type Item = { name: string; type: 'dir' | 'file'; url?: string | null }

const loading = ref(false)
const path = ref('')
const items = ref<Item[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
// 左侧目录树
const treeRoot = ref([{ label: 'uploads', fullPath: '' }])
const treeProps = { label: 'label', children: 'children', isLeaf: 'isLeaf' }
const treeRef = ref()
const currentTreeKey = ref('')

const loadTree = async (node: any, resolve: (data: any[]) => void) => {
    // 根节点：加载 images/ 与 files/
    if (node.level === 0) {
        resolve([
            { label: 'images', fullPath: 'images', type: 'dir', isLeaf: false },
            { label: 'files', fullPath: 'files', type: 'dir', isLeaf: false }
        ])
        return
    }

    try {
        const fullPath: string = node.data.fullPath
        const res = await listUploads(fullPath)

        if (res.data?.success) {
            const items = res.data.data.items as Item[]
            const dirs = items.filter(x => x.type === 'dir')
            const files = items.filter(x => x.type === 'file')

            // 创建目录节点
            const dirChildren = dirs.map(d => ({
                label: d.name,
                fullPath: [fullPath, d.name].filter(Boolean).join('/'),
                isLeaf: false, // 目录节点可以被展开
                type: 'dir'
            }))

            // 创建文件节点
            const fileChildren = files.map(f => ({
                label: f.name,
                fullPath: [fullPath, f.name].filter(Boolean).join('/'),
                isLeaf: true, // 文件节点是叶子节点
                type: 'file',
                url: f.url
            }))

            // 合并目录和文件，目录在前
            const children = [...dirChildren, ...fileChildren]

            resolve(children)
        } else {
            resolve([])
        }
    } catch (e) {
        resolve([])
    }
}

const onTreeNodeClick = (data: any) => {
    if (data.type === 'file') {
        // 如果是文件，直接预览
        preview(data.url)
    } else {
        // 如果是目录，进入目录
        goTo(data.fullPath || '')
    }
}

const handleItemClick = (item: Item) => {
    if (item.type === 'dir') {
        enterDir(item.name)
    }
}

// 调试目录树结构
const debugTreeStructure = () => {
    if (!treeRef.value) return

    // 检查所有节点
    const checkNode = (node: any, level = 0) => {
        const indent = '  '.repeat(level)
        if (node.childNodes) {
            node.childNodes.forEach((child: any) => checkNode(child, level + 1))
        }
    }

    // 检查根节点
    const rootNode = treeRef.value.getNode('')
    if (rootNode) {
        checkNode(rootNode)
    }

}

// 递归展开目录树到目标路径
const expandToPath = async (targetPath: string) => {
    if (!treeRef.value || !targetPath) return

    const pathParts = targetPath.split('/').filter(Boolean)

    // 逐级展开路径，确保每一层都被正确展开
    for (let i = 0; i < pathParts.length; i++) {
        const currentPath = pathParts.slice(0, i + 1).join('/')

        // 展开当前路径的父节点
        if (i > 0) {
            const parentPath = pathParts.slice(0, i).join('/')


            // 检查节点是否存在
            let node = treeRef.value.getNode(parentPath)

            if (node) {
                // 如果节点未加载，先强制加载
                if (!node.loaded) {

                    await new Promise((resolve) => {
                        loadTree(node, resolve)
                    })

                    // 重新获取节点状态
                    node = treeRef.value.getNode(parentPath)

                    // 等待子节点渲染完成
                    await new Promise(resolve => setTimeout(resolve, 500))

                }

                // 展开节点
                if (node && !node.expanded) {
                    node.expanded = true
                    await new Promise(resolve => setTimeout(resolve, 200))
                }
            } else {
                // 尝试通过点击节点来展开

                const nodeElement = document.querySelector(`[data-key="${parentPath}"]`)
                if (nodeElement) {
                    const expandIcon = nodeElement.querySelector('.el-tree-node__expand-icon') as HTMLElement
                    if (expandIcon && !expandIcon.classList.contains('is-expanded')) {
                        expandIcon.click()
                        await new Promise(resolve => setTimeout(resolve, 500))
                    }
                }

            }

        }
    }

    // 最后再次尝试设置选中状态
    await nextTick()

    const finalNode = treeRef.value.getNode(targetPath)

    // 检查所有父节点的展开状态
    for (let i = 0; i < pathParts.length; i++) {
        const checkPath = pathParts.slice(0, i + 1).join('/')
        const checkNode = treeRef.value.getNode(checkPath)

    }

}

// 同步目录树选中状态
const syncTreeSelection = async () => {
    if (!treeRef.value) return

    const targetPath = path.value || ''
    currentTreeKey.value = targetPath

    // 展开到目标路径
    await expandToPath(targetPath)

    await nextTick()
    // 设置当前选中节点

    treeRef.value.setCurrentKey(targetPath)


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
            const newPath = res.data.data.path || ''
            if (newPath !== path.value) {
                path.value = newPath
            }
            // 同步目录树选中状态
            await syncTreeSelection()
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
    } catch { }
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

// 监听路径变化，同步目录树状态
watch(path, async (newPath, oldPath) => {
    if (treeRef.value && newPath !== oldPath) {
        await syncTreeSelection()
    }
}, { immediate: false })

// 监听目录树引用，确保在树组件准备好后同步状态
watch(treeRef, async (newTreeRef) => {
    if (newTreeRef && path.value) {
        await nextTick()
        await syncTreeSelection()
    }
}, { immediate: true })

onMounted(async () => {
    await refresh()
    // 确保目录树同步
    if (treeRef.value) {
        await nextTick()
        await syncTreeSelection()

        // 如果当前路径不为空，尝试展开到当前路径
        if (path.value) {
            await expandToPath(path.value)
        }
    } 
})
</script>

<style scoped>
.resource-pool {
    padding: 20px;
    /* background: #f5f7fa; */
    min-height: 100vh;
}

.toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    /* background: white; */
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.spacer {
    flex: 1;
}

.main-content {
    display: flex;
    gap: 20px;
    height: calc(100vh - 120px);
}

.sidebar {
    width: 280px;
    flex-shrink: 0;
}

.content-area {
    flex: 1;
    min-width: 0;
}

.tree-card,
.files-card {
    height: 100%;
    border-radius: 12px;
    /* border: 1px solid #e4e7ed; */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    /* color: #303133; */
}

.view-toggle {
    margin-left: auto;
}

.tree-actions {
    margin-left: auto;
}

.directory-tree {
    padding: 8px 0;
}

.directory-tree :deep(.el-tree-node__content) {
    height: 28px;
    border-radius: 4px;
    margin: 1px 0;
    transition: all 0.2s;
    padding: 0 8px;
}

.directory-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #e1f3ff;
    color: #409eff;
    font-weight: 500;
}

.tree-node {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
}

/* 目录树图标样式 */
.tree-node .folder-icon {
    color: #e6a23c;
    font-size: 12px;
    flex-shrink: 0;
}

.tree-node .file-icon {
    color: #409eff;
    font-size: 12px;
    flex-shrink: 0;
}

.node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    min-width: 0;
    max-width: 200px;
}

.file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px 0;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
}

.file-item {
    /* background: white; */
    /* border: 1px solid #e4e7ed; */
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: 140px;
}

.file-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    /* border-color: #409eff; */
}

/* 文件网格图标样式 */
.file-item .file-icon {
    margin-bottom: 12px;
    font-size: 32px;
    color: #909399;
}

.file-item .folder-icon {
    color: #e6a23c;
    font-size: 32px;
}

.file-item .file-icon-inner {
    color: #409eff;
    font-size: 32px;
}

.file-info {
    flex: 1;
    width: 100%;
}

.file-name {
    font-size: 14px;
    font-weight: 500;
    /* color: #303133; */
    margin-bottom: 8px;
    word-break: break-all;
    line-height: 1.4;
    max-height: 2.8em;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.file-type {
    margin-bottom: 12px;
}

.file-actions {
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s;
}

.file-item:hover .file-actions {
    opacity: 1;
}

.file-table {
    max-height: calc(100vh - 200px);
    overflow-y: auto;
}

.preview-box {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 40vh;
}

.preview-box img {
    max-width: 100%;
    max-height: 70vh;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 滚动条样式 */
.file-grid::-webkit-scrollbar,
.file-table::-webkit-scrollbar {
    width: 6px;
}

.file-grid::-webkit-scrollbar-track,
.file-table::-webkit-scrollbar-track {
    /* background: #f1f1f1; */
    border-radius: 3px;
}

.file-grid::-webkit-scrollbar-thumb,
.file-table::-webkit-scrollbar-thumb {
    /* background: #c1c1c1; */
    border-radius: 3px;
}

.file-grid::-webkit-scrollbar-thumb:hover,
.file-table::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
