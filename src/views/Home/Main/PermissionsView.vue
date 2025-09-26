<template>
    <div>
        <el-card>
            <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:12px;">
                <div>权限管理</div>
                <el-button type="primary" @click="openCreate">新建权限</el-button>
            </div>
            <el-table :data="rows" stripe style="width: 100%">
                <el-table-column prop="name" label="名称" />
                <el-table-column prop="code" label="编码" />
                <el-table-column prop="description" label="描述" />
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="onDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div style="margin-top:12px; text-align:right;">
                <el-pagination
                    v-model:current-page="page"
                    v-model:page-size="limit"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next"
                    :total="total"
                    @size-change="load"
                    @current-change="load"
                />
            </div>
        </el-card>

        <el-dialog v-model="visible" :title="editing ? '编辑权限' : '新建权限'" width="520">
            <el-form :model="form" label-width="80">
                <el-form-item label="名称">
                    <el-input v-model="form.name" />
                </el-form-item>
                <el-form-item label="编码">
                    <el-input v-model="form.code" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="form.description" />
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
import { fetchPermissions, createPermission, updatePermission, deletePermission } from '@/axios/permissions'

const rows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)

const visible = ref(false)
const editing = ref(false)
const currentId = ref<string | null>(null)
const form = ref<any>({ name: '', code: '', description: '' })

const load = async () => {
    const { data } = await fetchPermissions({ page: page.value, limit: limit.value })
    if (data.success) {
        rows.value = data.data
        total.value = data.pagination.total
    }
}

const openCreate = () => {
    editing.value = false
    currentId.value = null
    form.value = { name: '', code: '', description: '' }
    visible.value = true
}

const openEdit = (row: any) => {
    editing.value = true
    currentId.value = row._id
    form.value = { name: row.name, code: row.code, description: row.description }
    visible.value = true
}

const onSubmit = async () => {
    try {
        if (editing.value && currentId.value) {
            await updatePermission(currentId.value, form.value)
            ElMessage.success('更新成功')
        } else {
            await createPermission(form.value)
            ElMessage.success('创建成功')
        }
        visible.value = false
        await load()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '操作失败')
    }
}

const onDelete = async (row: any) => {
    try {
        await ElMessageBox.confirm('确定删除该权限吗？', '提示', { type: 'warning' })
        await deletePermission(row._id)
        ElMessage.success('删除成功')
        await load()
    } catch {}
}

onMounted(load)
</script>

<style scoped>

</style>


