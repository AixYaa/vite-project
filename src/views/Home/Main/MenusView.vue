<template>
    <div>
        <el-card>
            <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:12px;">
                <div>目录管理</div>
                <div>
                    <el-button type="primary" @click="openCreate">新建菜单</el-button>
                </div>
            </div>
            <el-table :data="rows" row-key="_id" default-expand-all :tree-props="{ children: 'children' }" style="width: 100%">
                <el-table-column prop="name" label="名称" />
                <el-table-column prop="path" label="路径" />
                <el-table-column prop="order" label="排序" width="100" />
                <el-table-column label="操作" width="220">
                    <template #default="scope">
                        <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="onDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="visible" :title="editing ? '编辑菜单' : '新建菜单'" width="520">
            <el-form :model="form" label-width="80">
                <el-form-item label="名称">
                    <el-input v-model="form.name" />
                </el-form-item>
                <el-form-item label="路径">
                    <el-input v-model="form.path" />
                </el-form-item>
                <el-form-item label="图标">
                    <el-select v-model="form.icon" clearable filterable placeholder="选择图标">
                        <template #prefix>
                            <el-icon v-if="form.icon" style="margin-right:6px;">
                                <component :is="(Icons as any)[form.icon]" />
                            </el-icon>
                        </template>
                        <el-option v-for="opt in iconOptions" :key="opt.value" :label="opt.label" :value="opt.value">
                            <span style="display:inline-flex; align-items:center; gap:8px;">
                                <el-icon>
                                    <component :is="opt.component" />
                                </el-icon>
                                {{ opt.label }}
                            </span>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="父级">
                    <el-select v-model="form.parentId" clearable placeholder="选择父级">
                        <el-option value="" label="无" />
                        <el-option v-for="m in flat" :key="m._id" :label="m.name" :value="m._id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="排序">
                    <el-input v-model.number="form.order" type="number" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="visible=false">取消</el-button>
                <el-button type="primary" @click="onSubmit">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchMenuTree, createMenu, updateMenu, deleteMenu } from '@/axios/menus'
import * as Icons from '@element-plus/icons-vue'
import { useMenuStore } from '@/stores/Menu'

const rows = ref<any[]>([])
const flat = ref<any[]>([])

const visible = ref(false)
const editing = ref(false)
const currentId = ref<string | null>(null)
const form = ref<any>({ name: '', path: '', icon: '', parentId: null as any, order: 0 })

const iconOptions = Object.keys(Icons).map(key => ({
    label: key,
    value: key,
    component: (Icons as any)[key]
}))

const flatten = (list: any[]) => {
    const arr: any[] = []
    const dfs = (items: any[]) => {
        for (const it of items) {
            arr.push(it)
            if (it.children?.length) dfs(it.children)
        }
    }
    dfs(list)
    return arr
}

const load = async () => {
    const { data } = await fetchMenuTree()
    if (data.success) {
        rows.value = data.data
        flat.value = flatten(data.data)
    }
}

// 已移除“同步默认”

const openCreate = () => {
    editing.value = false
    currentId.value = null
    form.value = { name: '', path: '', icon: '', parentId: '', order: 0 }
    visible.value = true
}

const openEdit = (row: any) => {
    editing.value = true
    currentId.value = row._id
    form.value = { name: row.name, path: row.path, icon: row.icon || '', parentId: row.parentId || '', order: row.order || 0 }
    visible.value = true
}

const onSubmit = async () => {
    try {
        const payload = { ...form.value }
        if (!payload.parentId) delete (payload as any).parentId
        if (editing.value && currentId.value) {
            await updateMenu(currentId.value, payload)
            ElMessage.success('更新成功')
        } else {
            await createMenu(payload)
            ElMessage.success('创建成功')
        }
        visible.value = false
        await load()
        await menuStore.loadMyMenus()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '操作失败')
    }
}

const onDelete = async (row: any) => {
    try {
        await ElMessageBox.confirm('确定删除该菜单吗？', '提示', { type: 'warning' })
        await deleteMenu(row._id)
        ElMessage.success('删除成功')
        await load()
        await menuStore.loadMyMenus()
    } catch {}
}

const menuStore = useMenuStore()
onMounted(load)
</script>

<style scoped>

</style>


