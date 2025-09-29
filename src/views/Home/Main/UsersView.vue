<template>
    <div>
        <el-card>
            <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:12px;">
                <div>用户管理</div>
                <el-button type="primary" @click="openCreate">新建用户</el-button>
            </div>
            <el-table :data="rows" stripe style="width: 100%">
                <el-table-column prop="username" label="用户名" width="120" />
                <el-table-column prop="email" label="邮箱" width="200" />
                <el-table-column label="角色" width="120">
                    <template #default="scope">
                        <el-tag :type="getRoleTagType(scope.row.role)">
                            {{ getRoleLabel(scope.row.role) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                    <template #default="scope">
                        <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
                            {{ scope.row.isActive ? '启用' : '禁用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="lastLoginAt" label="最后登录" width="180">
                    <template #default="scope">
                        {{ scope.row.lastLoginAt ? formatDate(scope.row.lastLoginAt) : '从未登录' }}
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="scope">
                        {{ formatDate(scope.row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
                        <el-button size="small" type="warning" @click="toggleStatus(scope.row)">
                            {{ scope.row.isActive ? '禁用' : '启用' }}
                        </el-button>
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

        <el-dialog v-model="visible" :title="editing ? '编辑用户' : '新建用户'" width="600">
            <el-form :model="form" label-width="80" :rules="rules" ref="formRef">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="form.username" :disabled="editing" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="form.email" type="email" />
                </el-form-item>
                <el-form-item label="密码" prop="password" v-if="!editing">
                    <el-input v-model="form.password" type="password" show-password />
                </el-form-item>
                <el-form-item label="角色" prop="role">
                    <el-select v-model="form.role" placeholder="选择角色">
                        <el-option 
                            v-for="role in roles" 
                            :key="role._id" 
                            :label="role.name" 
                            :value="role.code" 
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="头像" prop="avatar">
                    <el-input v-model="form.avatar" placeholder="头像URL" />
                </el-form-item>
                <el-form-item label="状态" prop="isActive">
                    <el-switch v-model="form.isActive" />
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
import { fetchUsers, createUser, updateUser, deleteUser } from '@/axios/users'
import { fetchRoles } from '@/axios/roles'

const rows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)

const visible = ref(false)
const editing = ref(false)
const currentId = ref<string | null>(null)
const formRef = ref()
const form = ref<any>({ 
    username: '', 
    email: '', 
    password: '', 
    role: '', 
    avatar: '', 
    isActive: true 
})

// 角色列表
const roles = ref<any[]>([])

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
    ],
    role: [
        { required: true, message: '请选择角色', trigger: 'change' }
    ]
}

// 辅助方法
const getRoleLabel = (roleCode: string) => {
    const role = roles.value.find(r => r.code === roleCode)
    return role ? role.name : roleCode
}

const getRoleTagType = (roleCode: string) => {
    const role = roles.value.find(r => r.code === roleCode)
    if (!role) return 'info'
    
    // 根据角色名称或编码判断类型
    if (role.name.includes('超级') || role.code.includes('super')) return 'danger'
    if (role.name.includes('管理') || role.code.includes('admin')) return 'warning'
    return 'info'
}

const formatDate = (date: string) => {
    return new Date(date).toLocaleString('zh-CN')
}

const load = async () => {
    const { data } = await fetchUsers({ page: page.value, limit: limit.value })
    if (data.success) {
        rows.value = data.data
        total.value = data.pagination.total
    }
}

const loadRoles = async () => {
    try {
        const { data } = await fetchRoles({ page: 1, limit: 100 })
        if (data.success) {
            roles.value = data.data
        }
    } catch (e: any) {
        ElMessage.error('加载角色列表失败')
    }
}

const openCreate = () => {
    editing.value = false
    currentId.value = null
    
    // 确保角色已加载
    if (roles.value.length === 0) {
        ElMessage.warning('角色数据正在加载中，请稍后再试')
        return
    }
    
    form.value = { 
        username: '', 
        email: '', 
        password: '', 
        role: roles.value[0].code, 
        avatar: '', 
        isActive: true 
    }
    visible.value = true
}

const openEdit = (row: any) => {
    editing.value = true
    currentId.value = row._id
    form.value = { 
        username: row.username, 
        email: row.email, 
        password: '', 
        role: row.role, 
        avatar: row.avatar || '', 
        isActive: row.isActive 
    }
    visible.value = true
}

const onSubmit = async () => {
    try {
        await formRef.value?.validate()
        
        // 检查角色是否已选择
        if (!form.value.role) {
            ElMessage.error('请选择角色')
            return
        }
        
        const payload = { ...form.value }
        if (editing.value) {
            // 编辑时不需要密码
            delete payload.password
        }
        
        console.log('提交的用户数据:', payload) // 调试日志
        
        if (editing.value && currentId.value) {
            await updateUser(currentId.value, payload)
            ElMessage.success('更新成功')
        } else {
            await createUser(payload)
            ElMessage.success('创建成功')
        }
        visible.value = false
        await load()
    } catch (e: any) {
        console.error('用户操作失败:', e) // 调试日志
        ElMessage.error(e?.response?.data?.message || '操作失败')
    }
}

const toggleStatus = async (row: any) => {
    try {
        const action = row.isActive ? '禁用' : '启用'
        await ElMessageBox.confirm(`确定${action}该用户吗？`, '提示', { type: 'warning' })
        
        await updateUser(row._id, { isActive: !row.isActive })
        ElMessage.success(`${action}成功`)
        await load()
    } catch {}
}

const onDelete = async (row: any) => {
    try {
        await ElMessageBox.confirm('确定删除该用户吗？', '提示', { type: 'warning' })
        await deleteUser(row._id)
        ElMessage.success('删除成功')
        await load()
    } catch {}
}

onMounted(async () => {
    await Promise.all([load(), loadRoles()])
})
</script>

<style scoped>

</style>
