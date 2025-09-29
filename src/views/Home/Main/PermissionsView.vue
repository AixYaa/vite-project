<template>
    <div>
        <el-card>
            <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:12px;">
                <div>权限管理</div>
                <div>
                    <el-button type="success" @click="openTemplate">权限模板</el-button>
                    <el-button type="primary" @click="openCreate">新建权限</el-button>
                </div>
            </div>
            <el-table :data="rows" stripe style="width: 100%">
                <el-table-column prop="name" label="名称" width="120" />
                <el-table-column prop="code" label="编码" width="150" />
                <el-table-column label="类型" width="120">
                    <template #default="scope">
                        <el-tag :type="getTypeTagType(scope.row.type)">
                            {{ getTypeLabel(scope.row.type) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            <el-tag v-for="action in scope.row.action" :key="action" size="small" type="info">
                                {{ getActionLabel(action) }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="module" label="模块" width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.module" type="success">
                            {{ getModuleLabel(scope.row.module) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" show-overflow-tooltip />
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

        <el-dialog v-model="visible" :title="editing ? '编辑权限' : '新建权限'" width="600">
            <el-form :model="form" label-width="100">
                <el-form-item label="权限名称">
                    <el-input v-model="form.name" placeholder="如：用户管理" />
                </el-form-item>
                <el-form-item label="权限编码">
                    <el-input v-model="form.code" placeholder="如：user:create" />
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        格式：模块:操作，如 user:create, user:delete, menu:edit
                    </div>
                </el-form-item>
                <el-form-item label="权限类型">
                    <el-select v-model="form.type" placeholder="选择权限类型">
                        <el-option label="菜单权限" value="menu" />
                        <el-option label="操作权限" value="action" />
                        <el-option label="数据权限" value="data" />
                        <el-option label="系统权限" value="system" />
                    </el-select>
                </el-form-item>
                <el-form-item label="操作类型">
                    <el-select v-model="form.action" placeholder="选择操作类型" multiple>
                        <el-option label="查看" value="view" />
                        <el-option label="创建" value="create" />
                        <el-option label="编辑" value="edit" />
                        <el-option label="删除" value="delete" />
                        <el-option label="导出" value="export" />
                        <el-option label="导入" value="import" />
                        <el-option label="审核" value="audit" />
                        <el-option label="管理" value="manage" />
                    </el-select>
                </el-form-item>
                <el-form-item label="关联模块">
                    <el-select v-model="form.module" placeholder="选择关联模块">
                        <el-option label="用户管理" value="user" />
                        <el-option label="角色管理" value="role" />
                        <el-option label="权限管理" value="permission" />
                        <el-option label="菜单管理" value="menu" />
                        <el-option label="系统设置" value="system" />
                    </el-select>
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="form.description" type="textarea" :rows="3" placeholder="权限详细描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="visible=false">取消</el-button>
                <el-button type="primary" @click="onSubmit">确定</el-button>
            </template>
        </el-dialog>

        <!-- 权限模板对话框 -->
        <el-dialog v-model="templateVisible" title="权限模板" width="800">
            <div style="margin-bottom: 16px;">
                <el-text type="info">选择权限模板快速创建常用权限</el-text>
            </div>
            <el-row :gutter="16">
                <el-col :span="8" v-for="template in permissionTemplates" :key="template.module">
                    <el-card style="margin-bottom: 16px; cursor: pointer;" @click="selectTemplate(template)">
                        <div style="text-align: center;">
                            <h4>{{ template.moduleName }}</h4>
                            <div style="margin: 8px 0;">
                                <el-tag v-for="permission in template.permissions" :key="permission.code" 
                                        size="small" style="margin: 2px;">
                                    {{ permission.name }}
                                </el-tag>
                            </div>
                            <el-text type="info" size="small">{{ template.permissions.length }} 个权限</el-text>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
            <template #footer>
                <el-button @click="templateVisible=false">取消</el-button>
                <el-button type="primary" @click="createFromTemplate" :disabled="!selectedTemplate">
                    创建选中模板
                </el-button>
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
const form = ref<any>({ 
    name: '', 
    code: '', 
    description: '', 
    type: '', 
    action: [], 
    module: '' 
})

// 权限模板相关
const templateVisible = ref(false)
const selectedTemplate = ref<any>(null)
const permissionTemplates = ref([
    {
        module: 'user',
        moduleName: '用户管理',
        permissions: [
            { name: '查看用户', code: 'user:view', type: 'action', action: ['view'], module: 'user', description: '查看用户列表和详情' },
            { name: '创建用户', code: 'user:create', type: 'action', action: ['create'], module: 'user', description: '创建新用户' },
            { name: '编辑用户', code: 'user:edit', type: 'action', action: ['edit'], module: 'user', description: '编辑用户信息' },
            { name: '删除用户', code: 'user:delete', type: 'action', action: ['delete'], module: 'user', description: '删除用户' },
            { name: '导出用户', code: 'user:export', type: 'action', action: ['export'], module: 'user', description: '导出用户数据' }
        ]
    },
    {
        module: 'role',
        moduleName: '角色管理',
        permissions: [
            { name: '查看角色', code: 'role:view', type: 'action', action: ['view'], module: 'role', description: '查看角色列表和详情' },
            { name: '创建角色', code: 'role:create', type: 'action', action: ['create'], module: 'role', description: '创建新角色' },
            { name: '编辑角色', code: 'role:edit', type: 'action', action: ['edit'], module: 'role', description: '编辑角色信息' },
            { name: '删除角色', code: 'role:delete', type: 'action', action: ['delete'], module: 'role', description: '删除角色' },
            { name: '分配权限', code: 'role:assign', type: 'action', action: ['manage'], module: 'role', description: '为角色分配权限' }
        ]
    },
    {
        module: 'menu',
        moduleName: '菜单管理',
        permissions: [
            { name: '查看菜单', code: 'menu:view', type: 'action', action: ['view'], module: 'menu', description: '查看菜单列表和详情' },
            { name: '创建菜单', code: 'menu:create', type: 'action', action: ['create'], module: 'menu', description: '创建新菜单' },
            { name: '编辑菜单', code: 'menu:edit', type: 'action', action: ['edit'], module: 'menu', description: '编辑菜单信息' },
            { name: '删除菜单', code: 'menu:delete', type: 'action', action: ['delete'], module: 'menu', description: '删除菜单' }
        ]
    },
    {
        module: 'permission',
        moduleName: '权限管理',
        permissions: [
            { name: '查看权限', code: 'permission:view', type: 'action', action: ['view'], module: 'permission', description: '查看权限列表和详情' },
            { name: '创建权限', code: 'permission:create', type: 'action', action: ['create'], module: 'permission', description: '创建新权限' },
            { name: '编辑权限', code: 'permission:edit', type: 'action', action: ['edit'], module: 'permission', description: '编辑权限信息' },
            { name: '删除权限', code: 'permission:delete', type: 'action', action: ['delete'], module: 'permission', description: '删除权限' }
        ]
    }
])

const load = async () => {
    const { data } = await fetchPermissions({ page: page.value, limit: limit.value })
    if (data.success) {
        rows.value = data.data
        total.value = data.pagination.total
    }
}

// 辅助方法
const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
        menu: '菜单权限',
        action: '操作权限',
        data: '数据权限',
        system: '系统权限'
    }
    return typeMap[type] || type
}

const getTypeTagType = (type: string) => {
    const typeMap: Record<string, string> = {
        menu: 'primary',
        action: 'success',
        data: 'warning',
        system: 'danger'
    }
    return typeMap[type] || 'info'
}

const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
        view: '查看',
        create: '创建',
        edit: '编辑',
        delete: '删除',
        export: '导出',
        import: '导入',
        audit: '审核',
        manage: '管理'
    }
    return actionMap[action] || action
}

const getModuleLabel = (module: string) => {
    const moduleMap: Record<string, string> = {
        user: '用户管理',
        role: '角色管理',
        permission: '权限管理',
        menu: '菜单管理',
        system: '系统设置'
    }
    return moduleMap[module] || module
}

const openCreate = () => {
    editing.value = false
    currentId.value = null
    form.value = { 
        name: '', 
        code: '', 
        description: '', 
        type: 'action', 
        action: [], 
        module: 'system' 
    }
    visible.value = true
}

const openEdit = (row: any) => {
    editing.value = true
    currentId.value = row._id
    form.value = { 
        name: row.name, 
        code: row.code, 
        description: row.description || '', 
        type: row.type || 'action',
        action: row.action || [],
        module: row.module || 'system'
    }
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

// 打开权限模板
const openTemplate = () => {
    selectedTemplate.value = null
    templateVisible.value = true
}

// 选择模板
const selectTemplate = (template: any) => {
    selectedTemplate.value = template
}

// 从模板创建权限
const createFromTemplate = async () => {
    if (!selectedTemplate.value) return
    
    try {
        const permissions = selectedTemplate.value.permissions
        let successCount = 0
        let errorCount = 0
        
        for (const permission of permissions) {
            try {
                await createPermission(permission)
                successCount++
            } catch (e: any) {
                if (e?.response?.data?.message?.includes('已存在')) {
                    // 权限已存在，跳过
                    continue
                }
                errorCount++
            }
        }
        
        if (successCount > 0) {
            ElMessage.success(`成功创建 ${successCount} 个权限`)
            await load()
        }
        
        if (errorCount > 0) {
            ElMessage.warning(`${errorCount} 个权限创建失败`)
        }
        
        templateVisible.value = false
    } catch (e: any) {
        ElMessage.error('创建权限失败')
    }
}

onMounted(load)
</script>

<style scoped>

</style>


