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
                <el-table-column label="操作" width="180" align="center">
                    <template #default="scope">
                        <el-dropdown>
                            <el-button size="small" type="primary">操作</el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="openEdit(scope.row)">编辑</el-dropdown-item>
                                    <el-dropdown-item @click="openPermissions(scope.row)">分配权限</el-dropdown-item>
                                    <el-dropdown-item @click="openMenus(scope.row)">分配菜单</el-dropdown-item>
                                    <el-dropdown-item @click="openApiKeys(scope.row)">API密钥</el-dropdown-item>
                                    <el-dropdown-item divided @click="onDelete(scope.row)"><span
                                            style="color:#F56C6C;">删除</span></el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>
                </el-table-column>
            </el-table>
            <div style="margin-top:12px; text-align:right;">
                <el-pagination v-model:current-page="page" v-model:page-size="limit" :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next" :total="total" @size-change="load"
                    @current-change="load" />
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
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="onSubmit">确定</el-button>
            </template>
        </el-dialog>

        <!-- API 密钥管理抽屉 -->
        <el-drawer v-model="apiDrawerVisible" size="50%">
            <template #header>
                <div style="display:flex; align-items:center; justify-content: space-between; gap:12px;">
                    <span>外部 API 密钥管理</span>
                    <el-tooltip placement="left" effect="dark">
                        <template #content>
                            <div style="max-width: 320px; line-height:1.6;">
                                <div><strong>使用说明</strong></div>
                                <div>1) 生成密钥时会显示 apikey 与 <strong>apisecret</strong>，仅本次可见；请妥善保存。</div>
                                <div>2) 外部调用时在 Header
                                    携带：<code>X-API-KEY</code>、<code>X-API-TIMESTAMP</code>、<code>X-API-SIGN</code>。
                                </div>
                                <div>3) 签名建议：HMAC-SHA256(secret, <em>method\npath\ntimestamp\nbodyHash</em>)。</div>
                                <div>4) 可随时禁用/撤销某个密钥，撤销后不可恢复。</div>
                            </div>
                        </template>
                        <el-icon style="cursor: help; color: #909399;">
                            <QuestionFilled />
                        </el-icon>
                    </el-tooltip>
                </div>
            </template>
            <div style="margin-bottom: 8px;">
                <el-alert type="info" show-icon :closable="false"
                    description="apisecret 仅在创建时显示一次，请务必妥善保存；服务端只存储 secret 的哈希。" />
            </div>
            <div style="display:flex; gap:8px; margin-bottom: 12px;">
                <el-input v-model="newKeyRemark" placeholder="密钥备注，如：用于内部服务A" />
                <el-button type="primary" @click="onGenerateApiKey" :loading="apiLoading">生成密钥</el-button>
            </div>

            <el-table :data="apiKeys" style="width:100%" :loading="apiLoading">
                <el-table-column prop="key" label="API Key" min-width="240" />
                <el-table-column prop="remark" label="备注" min-width="160" />
                <el-table-column prop="isActive" label="状态" width="100">
                    <template #default="scope">
                        <el-tag :type="scope.row.isActive ? 'success' : 'info'">{{ scope.row.isActive ? '启用' : '禁用'
                            }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" min-width="160">
                    <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
                </el-table-column>
                <el-table-column prop="lastUsedAt" label="最近使用" min-width="160">
                    <template #default="scope">{{ scope.row.lastUsedAt ? formatTime(scope.row.lastUsedAt) : '-'
                        }}</template>
                </el-table-column>
                <el-table-column label="操作" width="240">
                    <template #default="scope">
                        <el-switch v-model="scope.row.isActive" active-text="启用" inactive-text="禁用"
                            @change="onToggleApiKey(scope.row)" />
                        <el-button size="small" type="danger" @click="onRevokeApiKey(scope.row)"
                            style="margin-left:8px;">撤销</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 教程与示例 -->
            <el-divider content-position="left">外部调用示例</el-divider>
            <el-collapse style="margin-bottom: 12px;">
                <el-collapse-item title="签名说明与伪代码" name="sig">
                    <div style="margin-bottom:8px; color:#606266;">
                        请求需在 Header
                        携带：<code>X-API-KEY</code>、<code>X-API-TIMESTAMP</code>（毫秒时间戳）、<code>X-API-SIGN</code>。<br />
                        签名内容为：<em>method\npath\ntimestamp\nbodyHash</em>，其中 <code>bodyHash</code> 为请求体的
                        <code>SHA256</code>
                        十六进制小写；空体时为 <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>。
                    </div>
                    <pre v-pre
                        style="background:#0a0a0a; color:#eaeaea; padding:12px; border-radius:6px; overflow:auto;">
                <code>// Pseudo
                    method = 'POST' // 大写 HTTP 方法
                    path = '/api/v1/resource' // 包含查询串时应使用完整 path（如 /api/v1/resource?x=1 ）
                    timestamp = Date.now().toString()
                    body = JSON.stringify({ foo: 'bar' })
                    bodyHash = sha256_hex(body) // 空体时为 SHA256("")

                    signPayload = method + '\n' + path + '\n' + timestamp + '\n' + bodyHash
                    signature = hmac_sha256_hex(secret, signPayload)

                    // Headers
                    {
                    'X-API-KEY': apiKey,
                    'X-API-TIMESTAMP': timestamp,
                    'X-API-SIGN': signature
                    }
                </code>
            </pre>
                </el-collapse-item>
                <el-collapse-item title="cURL 示例（使用 openssl 计算签名）" name="curl">
                    <pre v-pre
                        style="background:#0a0a0a; color:#eaeaea; padding:12px; border-radius:6px; overflow:auto;">
                <code>API_KEY="&lt;your-api-key&gt;"
                    API_SECRET="&lt;your-api-secret&gt;"
                    METHOD="POST"
                    PATH="/api/v1/resource"
                    BASE_URL="https://your-server.example.com" # 修改为你的服务地址
                    TIMESTAMP=$(python -c "import time;print(int(time.time()*1000))")
                    BODY='{"foo":"bar"}'

                    # 计算 bodyHash (sha256 hex)
                    BODY_HASH=$(printf "%s" "$BODY" | openssl dgst -sha256 -binary | xxd -p -c 256)

                    # 计算签名: HMAC-SHA256(secret, method\npath\ntimestamp\nbodyHash) → hex
                    SIGN_PAYLOAD="$METHOD\n$PATH\n$TIMESTAMP\n$BODY_HASH"
                    SIGN=$(printf "%s" "$SIGN_PAYLOAD" | openssl dgst -sha256 -hmac "$API_SECRET" -binary | xxd -p -c
                    256)

                    curl -X "$METHOD" "$BASE_URL$PATH" \
                    -H "Content-Type: application/json" \
                    -H "X-API-KEY: $API_KEY" \
                    -H "X-API-TIMESTAMP: $TIMESTAMP" \
                    -H "X-API-SIGN: $SIGN" \
                    -d "$BODY"
                </code>
            </pre>
                </el-collapse-item>
                <el-collapse-item title="Node.js 示例（axios + crypto）" name="node">
                    <pre v-pre
                        style="background:#0a0a0a; color:#eaeaea; padding:12px; border-radius:6px; overflow:auto;">
                <code>import axios from 'axios'
                    import crypto from 'crypto'

                    const API_KEY = '&lt;your-api-key&gt;'
                        const API_SECRET = '&lt;your-api-secret&gt;'
                            const BASE_URL = 'https://your-server.example.com' // 修改为你的服务地址

                            function sha256Hex(input: string) {
                            return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
                            }

                            function hmacSha256Hex(secret: string, payload: string) {
                            return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
                            }

                            async function callApi() {
                            const method = 'POST'
                            const path = '/api/v1/resource'
                            const timestamp = Date.now().toString()
                            const body = JSON.stringify({ foo: 'bar' })
                            const bodyHash = sha256Hex(body) // 若 GET/空体，使用 sha256("")

                            const signPayload = `${method}\n${path}\n${timestamp}\n${bodyHash}`
                            const signature = hmacSha256Hex(API_SECRET, signPayload)

                            const resp = await axios.request({
                            baseURL: BASE_URL,
                            url: path,
                            method,
                            data: body,
                            headers: {
                            'Content-Type': 'application/json',
                            'X-API-KEY': API_KEY,
                            'X-API-TIMESTAMP': timestamp,
                            'X-API-SIGN': signature,
                            },
                            timeout: 10000,
                            })

                            console.log(resp.data)
                            }

                            callApi().catch(console.error)
                </code>
            </pre>
                </el-collapse-item>
                <el-collapse-item title="Python 示例（requests + hmac）" name="py">
                    <pre v-pre
                        style="background:#0a0a0a; color:#eaeaea; padding:12px; border-radius:6px; overflow:auto;">
                <code>import time
                    import json
                    import hmac
                    import hashlib
                    import requests

                    API_KEY = '&lt;your-api-key&gt;'
                        API_SECRET = '&lt;your-api-secret&gt;'
                            BASE_URL = 'https://your-server.example.com' # 修改为你的服务地址

                            def sha256_hex(s: str) -> str:
                            return hashlib.sha256(s.encode('utf-8')).hexdigest()

                            def hmac_sha256_hex(secret: str, payload: str) -> str:
                            return hmac.new(secret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()

                            def call_api():
                            method = 'POST'
                            path = '/api/v1/resource'
                            timestamp = str(int(time.time() * 1000))
                            body = json.dumps({'foo': 'bar'}, separators=(',', ':'))
                            body_hash = sha256_hex(body) # GET/空体时，使用 sha256("")

                            sign_payload = f"{method}\n{path}\n{timestamp}\n{body_hash}"
                            signature = hmac_sha256_hex(API_SECRET, sign_payload)

                            headers = {
                            'Content-Type': 'application/json',
                            'X-API-KEY': API_KEY,
                            'X-API-TIMESTAMP': timestamp,
                            'X-API-SIGN': signature,
                            }
                            r = requests.post(f"{BASE_URL}{path}", headers=headers, data=body, timeout=10)
                            print(r.status_code, r.text)

                            if __name__ == '__main__':
                            call_api()
                </code>
            </pre>
                </el-collapse-item>
            </el-collapse>
           

            <el-dialog v-model="secretDialogVisible" title="新建密钥" width="480">
                <div>
                    <el-alert type="warning" :closable="false" show-icon description="apisecret 仅本次显示，关闭后将无法再获取，请立即保存。"
                        style="margin-bottom:8px;" />
                    <el-form label-width="100px">
                        <el-form-item label="API Key">
                            <el-input v-model="createdKey.key" readonly />
                        </el-form-item>
                        <el-form-item label="API Secret">
                            <el-input v-model="createdKey.secret" readonly />
                        </el-form-item>
                    </el-form>
                </div>
                <template #footer>
                    <el-button type="primary" @click="secretDialogVisible = false">我已保存</el-button>
                </template>
            </el-dialog>
        </el-drawer>
        <!-- 权限分配对话框 -->
        <el-dialog v-model="permissionVisible" title="分配权限" width="700">
            <div
                style="margin-bottom: 12px; display:flex; justify-content: space-between; align-items:center; gap:12px;">
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
            <el-tree ref="permissionTreeRef" :data="permissionTree" :props="{ children: 'children', label: 'label' }"
                show-checkbox node-key="id" :default-checked-keys="selectedPermissions"
                style="max-height: 400px; overflow-y: auto;" />
            <template #footer>
                <el-button @click="permissionVisible = false">取消</el-button>
                <el-button type="primary" @click="savePermissions">保存权限</el-button>
            </template>
        </el-dialog>

        <!-- 菜单分配对话框 -->
        <el-dialog v-model="menuVisible" title="分配菜单" width="600">
            <div style="margin-bottom: 16px;">
                <el-text type="info">为角色 "{{ currentRole?.name }}" 分配菜单</el-text>
            </div>
            <el-tree ref="menuTreeRef" :data="allMenus" :props="{ children: 'children', label: 'name' }" show-checkbox
                node-key="_id" :default-checked-keys="selectedMenus" style="max-height: 400px; overflow-y: auto;">
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
                <el-button @click="menuVisible = false">取消</el-button>
                <el-button type="primary" @click="saveMenus">保存菜单</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchRoles, createRole, updateRole, deleteRole, listRoleApiKeys, generateRoleApiKey, toggleRoleApiKey, revokeRoleApiKey } from '@/axios/roles'
import { fetchPermissions, fetchPermissionTree } from '@/axios/permissions'
import { fetchMenuTree } from '@/axios/menus'
import * as Icons from '@element-plus/icons-vue'
import { QuestionFilled } from '@element-plus/icons-vue'

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

// API 密钥抽屉
const apiDrawerVisible = ref(false)
const apiKeys = ref<any[]>([])
const apiLoading = ref(false)
const newKeyRemark = ref('')
const createdKey = ref<{ key: string; secret: string }>({ key: '', secret: '' })
const secretDialogVisible = ref(false)

const formatTime = (v?: string | Date) => {
    if (!v) return '-'
    const d = new Date(v)
    return d.toLocaleString()
}

const openApiKeys = async (row: any) => {
    currentRole.value = row
    apiDrawerVisible.value = true
    await loadApiKeys()
}

const loadApiKeys = async () => {
    if (!currentRole.value?._id) return
    apiLoading.value = true
    try {
        const { data } = await listRoleApiKeys(currentRole.value._id)
        if (data.success) apiKeys.value = data.data
    } finally {
        apiLoading.value = false
    }
}

const onGenerateApiKey = async () => {
    if (!currentRole.value?._id) return
    apiLoading.value = true
    try {
        const { data } = await generateRoleApiKey(currentRole.value._id, newKeyRemark.value)
        if (data.success) {
            createdKey.value = data.data
            secretDialogVisible.value = true
            newKeyRemark.value = ''
            await loadApiKeys()
        }
    } finally {
        apiLoading.value = false
    }
}

const onToggleApiKey = async (row: any) => {
    if (!currentRole.value?._id) return
    await toggleRoleApiKey(currentRole.value._id, row.key, row.isActive)
}

const onRevokeApiKey = async (row: any) => {
    if (!currentRole.value?._id) return
    await ElMessageBox.confirm('确定撤销该密钥吗？此操作不可恢复', '提示', { type: 'warning' })
    await revokeRoleApiKey(currentRole.value._id, row.key)
    ElMessage.success('已撤销')
    await loadApiKeys()
}

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
    } catch { }
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

<style scoped></style>