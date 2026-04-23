import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { pinia } from "@/stores/pinia";
import AdminLayout from "@/layouts/AdminLayout.vue";
import LoginPage from "@/pages/LoginPage.vue";
import OrdersPage from "@/pages/OrdersPage.vue";
import MenuPage from "@/pages/MenuPage.vue";
import TablesPage from "@/pages/TablesPage.vue";
import NoticesPage from "@/pages/NoticesPage.vue";
import UsersPage from "@/pages/UsersPage.vue";
import StatsPage from "@/pages/StatsPage.vue";
import CommentsPage from "@/pages/CommentsPage.vue";
import FeedbackPage from "@/pages/FeedbackPage.vue";
import SupportPage from "@/pages/SupportPage.vue";
import SystemPage from "@/pages/SystemPage.vue";
import ProfilePage from "@/pages/ProfilePage.vue";
import AdminsPage from "@/pages/AdminsPage.vue";
import AuditLogsPage from "@/pages/AuditLogsPage.vue";
import NotFoundPage from "@/pages/NotFoundPage.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { title: "登录" },
  },
  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/orders" },
      {
        path: "orders",
        name: "orders",
        component: OrdersPage,
        meta: { title: "订单管理", requiresAuth: true },
      },
      {
        path: "menu",
        name: "menu",
        component: MenuPage,
        meta: { title: "餐品管理", requiresAuth: true },
      },
      {
        path: "tables",
        name: "tables",
        component: TablesPage,
        meta: { title: "桌台管理", requiresAuth: true },
      },
      {
        path: "notices",
        name: "notices",
        component: NoticesPage,
        meta: { title: "公告管理", requiresAuth: true },
      },
      {
        path: "users",
        name: "users",
        component: UsersPage,
        meta: { title: "用户管理", requiresAuth: true },
      },
      {
        path: "stats",
        name: "stats",
        component: StatsPage,
        meta: { title: "数据统计", requiresAuth: true, permission: "STATS_VIEW" },
      },
      {
        path: "comments",
        name: "comments",
        component: CommentsPage,
        meta: { title: "评论管理", requiresAuth: true },
      },
      {
        path: "feedback",
        name: "feedback",
        component: FeedbackPage,
        meta: { title: "留言建议", requiresAuth: true },
      },
      {
        path: "support",
        name: "support",
        component: SupportPage,
        meta: { title: "客服管理", requiresAuth: true },
      },
      {
        path: "settings",
        name: "settings",
        component: SystemPage,
        meta: { title: "系统设置", requiresAuth: true, permission: "SETTINGS_MANAGE" },
      },
      {
        path: "admins",
        name: "admins",
        component: AdminsPage,
        meta: { title: "管理员", requiresAuth: true, permission: "ADMIN_USER_MANAGE" },
      },
      {
        path: "audit-logs",
        name: "audit-logs",
        component: AuditLogsPage,
        meta: { title: "操作日志", requiresAuth: true, permission: "AUDIT_LOG_VIEW" },
      },
      { path: "system", redirect: "/settings" },
      {
        path: "profile",
        name: "profile",
        component: ProfilePage,
        meta: { title: "个人中心", requiresAuth: true },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
    meta: { title: "页面不存在" },
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

const BASE_TITLE =
  (import.meta.env.VITE_APP_TITLE as string | undefined) ||
  "未来点餐系统-管理后台";

router.afterEach(to => {
  const titleFromRoute = [...to.matched]
    .reverse()
    .map(r => r.meta?.title)
    .find((t): t is string => typeof t === "string" && t.trim().length > 0);

  document.title = titleFromRoute
    ? `${titleFromRoute} - ${BASE_TITLE}`
    : BASE_TITLE;
});

router.beforeEach(async to => {
  const auth = useAuthStore(pinia);

  if (to.meta.requiresAuth) {
    if (!auth.isAuthed) return { path: "/login", replace: true };
    try {
      await auth.ensureProfile();
      const permission = typeof to.meta.permission === "string" ? to.meta.permission : undefined;
      if (permission && !auth.hasPermission(permission)) return { path: "/orders", replace: true };
    } catch {
      auth.logout();
      return { path: "/login", replace: true };
    }
  }

  if (to.path === "/login" && auth.isAuthed) {
    try {
      await auth.ensureProfile();
      return { path: "/orders", replace: true };
    } catch {
      auth.logout();
    }
  }

  return true;
});

export default router;
