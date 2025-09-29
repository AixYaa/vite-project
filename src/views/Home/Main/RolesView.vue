<template>
    <div>
        <el-card>
            <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:12px;">
                <div>角色管理</div>
                <el-button type="primary" @click="openCreate">新建角色</el-button>
            </div>
            <el-table :data="rows" stripe style="width: 100%">
                <el-table-column prop="name" label="名称" />
                <el-table-column prop="code" label="编码" />
                <el-table-column prop="description" label="描述" />
                <el-table-column label="权限数量" width="120">
                    <template #default="scope">
                        <el-tag type="info">{{ scope.row.permissions?.length || 0 }} 个权限</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="360">
                    <template #default="scope">
                        <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
                        <el-button size="small" type="primary" @click="openPermissions(scope.row)">分配权限</el-button>
                        <el-button size="small" type="success" @click="openMenus(scope.row)">分配菜单</el-button>
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

        <el-dialog v-model="visible" :title="editing ? '编辑角色' : '新建角色'" width="520">
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

        <!-- 权限分配对话框 -->
        <el-dialog v-model="permissionVisible" title="分配权限" width="700">
            <div style="margin-bottom: 12px; display:flex; justify-content: space-between; align-items:center; gap:12px;">
                <el-text type="info">为角色 "{{ currentRole?.name }}" 分配权限</el-text>
                <div style="display:flex; gap:8px; flex-wrap: wrap;">
                    <el-dropdown>
                        <el-button size="small">批量勾选</el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="checkByAction('view', true)">全选 查看</el-dropdown-item>
                                <el-dropdown-item @click="checkByAction('create', true)">全选 创建</el-dropdown-item>
                                <el-dropdown-item @click="checkByAction('edit', true)">全选 编辑</el-dropdown-item>
                                <el-dropdown-item @click="checkByAction('delete', true)">全选 删除</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <el-dropdown>
                        <el-button size="small">批量取消</el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="checkByAction('view', false)">取消 查看</el-dropdown-item>
                                <el-dropdown-item @click="checkByAction('create', false)">取消 创建</el-dropdown-item>
                                <el-dropdown-item @click="checkByAction('edit', false)">取消 编辑</el-dropdown-item>
                                <el-dropdown-item @click="checkByAction('delete', false)">取消 删除</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </div>
            <el-tree
                ref="permissionTreeRef"
                :data="permissionTree"
                :props="{ children: 'children', label: 'label' }"
                show-checkbox
                node-key="id"
                :default-checked-keys="selectedPermissions"
                style="max-height: 400px; overflow-y: auto;"
            />
            <template #footer>
                <el-button @click="permissionVisible=false">取消</el-button>
                <el-button type="primary" @click="savePermissions">保存权限</el-button>
            </template>
        </el-dialog>

        <!-- 菜单分配对话框 -->
        <el-dialog v-model="menuVisible" title="分配菜单" width="600">
            <div style="margin-bottom: 16px;">
                <el-text type="info">为角色 "{{ currentRole?.name }}" 分配菜单</el-text>
            </div>
            <el-tree
                ref="menuTreeRef"
                :data="allMenus"
                :props="{ children: 'children', label: 'name' }"
                show-checkbox
                node-key="_id"
                :default-checked-keys="selectedMenus"
                style="max-height: 400px; overflow-y: auto;"
            >
                <template #default="{ node, data }">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <el-icon v-if="data.icon">
                            <component :is="(Icons as any)[data.icon]" />
                        </el-icon>
                        <span>{{ data.name }}</span>
                        <el-tag v-if="data.path" size="small" type="info">{{ data.path }}</el-tag>
                    </div>
                </template>
            </el-tree>
            <template #footer>
                <el-button @click="menuVisible=false">取消</el-button>
                <el-button type="primary" @click="saveMenus">保存菜单</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchRoles, createRole, updateRole, deleteRole } from '@/axios/roles'
import { fetchPermissions, fetchPermissionTree } from '@/axios/permissions'
import { fetchMenuTree } from '@/axios/menus'
import * as Icons from '@element-plus/icons-vue'

const rows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)

const visible = ref(false)
const editing = ref(false)
const currentId = ref<string | null>(null)
const form = ref<any>({ name: '', code: '', description: '' })

// 权限分配相关
const permissionVisible = ref(false)
const currentRole = ref<any>(null)
const allPermissions = ref<any[]>([])
const selectedPermissions = ref<string[]>([])
const permissionTreeRef = ref()
const permissionTree = ref<any[]>([])

// 根据动作批量勾选/取消（view/create/edit/delete）
const checkByAction = (action: 'view' | 'create' | 'edit' | 'delete', checked: boolean) => {
    const tree = permissionTree.value
    const collect: string[] = []
    const walk = (nodes: any[]) => {
        for (const n of nodes) {
            if (n.children && n.children.length) {
                walk(n.children)
            } else if (n.code) {
                // 叶子：权限项，匹配 code 的冒号后缀
                const suffix = String(n.code).split(':')[1]
                if (suffix === action) collect.push(String(n.id))
            }
        }
    }
    walk(tree)

    if (!permissionTreeRef.value) return
    // 当前已选
    const current: string[] = permissionTreeRef.value.getCheckedKeys()
    const set = new Set(current)
    for (const id of collect) {
        if (checked) set.add(id)
        else set.delete(id)
    }
    permissionTreeRef.value.setCheckedKeys(Array.from(set))
}

// 菜单分配相关
const menuVisible = ref(false)
const allMenus = ref<any[]>([])
const selectedMenus = ref<string[]>([])
const menuTreeRef = ref()

const load = async () => {
    const { data } = await fetchRoles({ page: page.value, limit: limit.value })
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
            await updateRole(currentId.value, form.value)
            ElMessage.success('更新成功')
        } else {
            await createRole(form.value)
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
        await ElMessageBox.confirm('确定删除该角色吗？', '提示', { type: 'warning' })
        await deleteRole(row._id)
        ElMessage.success('删除成功')
        await load()
    } catch {}
}

// 打开权限分配对话框
const openPermissions = async (row: any) => {
    currentRole.value = row
    // 处理权限数据：如果permissions是对象数组，提取_id；如果是字符串数组，直接使用
    selectedPermissions.value = (row.permissions || []).map((permission: any) => 
        typeof permission === 'string' ? permission : permission._id
    )
    
    // 加载权限树
    try {
        const { data } = await fetchPermissionTree()
        if (data.success) {
            permissionTree.value = data.data
        }
    } catch (e: any) {
        ElMessage.error('加载权限失败')
        return
    }
    
    permissionVisible.value = true
}

// 保存权限分配
const savePermissions = async () => {
    try {
        // 只保存叶子节点（真正的权限项），过滤掉模块节点（id 形如 module:xxx）
        const rawChecked: string[] = permissionTreeRef.value?.getCheckedKeys(true) || permissionTreeRef.value?.getCheckedKeys() || []
        const checkedPermissionIds = rawChecked.filter((id: string) => !String(id).startsWith('module:'))
        const updateData = {
            ...currentRole.value,
            permissions: checkedPermissionIds
        }
        await updateRole(currentRole.value._id, updateData)
        ElMessage.success('权限分配成功')
        permissionVisible.value = false
        await load()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '权限分配失败')
    }
}

// 打开菜单分配对话框
const openMenus = async (row: any) => {
    currentRole.value = row
    // 处理菜单数据：如果menus是对象数组，提取_id；如果是字符串数组，直接使用
    selectedMenus.value = (row.menus || []).map((menu: any) => 
        typeof menu === 'string' ? menu : menu._id
    )
    
    // 加载所有菜单
    try {
        const { data } = await fetchMenuTree()
        if (data.success) {
            allMenus.value = data.data
        }
    } catch (e: any) {
        ElMessage.error('加载菜单失败')
        return
    }
    
    menuVisible.value = true
}

// 保存菜单分配
const saveMenus = async () => {
    try {
        const checkedKeys = menuTreeRef.value?.getCheckedKeys() || []
        const updateData = {
            ...currentRole.value,
            menus: checkedKeys
        }
        await updateRole(currentRole.value._id, updateData)
        ElMessage.success('菜单分配成功')
        menuVisible.value = false
        await load()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '菜单分配失败')
    }
}

onMounted(load)
</script>

<style scoped>

</style>