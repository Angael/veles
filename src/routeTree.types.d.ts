import type { Route as rootRouteImport } from './routes/__root'
import type { Route as SignupRouteImport } from './routes/signup'
import type { Route as LoginRouteImport } from './routes/login'
import type { Route as IndexRouteImport } from './routes/index'
import type { Route as DemoTanstackQueryRouteImport } from './routes/demo/tanstack-query'
import type { Route as DemoStartServerFuncsRouteImport } from './routes/demo/start.server-funcs'
import type { Route as DemoStartApiRequestRouteImport } from './routes/demo/start.api-request'
import type { Route as ApiDemoPingRouteImport } from './routes/api/demo/ping'
import type { Route as ApiAuthSplatRouteImport } from './routes/api/auth/$'
import type { Route as DemoStartSsrIndexRouteImport } from './routes/demo/start.ssr.index'
import type { Route as DemoStartSsrSpaModeRouteImport } from './routes/demo/start.ssr.spa-mode'
import type { Route as DemoStartSsrFullSsrRouteImport } from './routes/demo/start.ssr.full-ssr'
import type { Route as DemoStartSsrDataOnlyRouteImport } from './routes/demo/start.ssr.data-only'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/signup': {
      id: '/signup'
      path: '/signup'
      fullPath: '/signup'
      preLoaderRoute: typeof SignupRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/demo/tanstack-query': {
      id: '/demo/tanstack-query'
      path: '/demo/tanstack-query'
      fullPath: '/demo/tanstack-query'
      preLoaderRoute: typeof DemoTanstackQueryRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/demo/start/server-funcs': {
      id: '/demo/start/server-funcs'
      path: '/demo/start/server-funcs'
      fullPath: '/demo/start/server-funcs'
      preLoaderRoute: typeof DemoStartServerFuncsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/demo/start/api-request': {
      id: '/demo/start/api-request'
      path: '/demo/start/api-request'
      fullPath: '/demo/start/api-request'
      preLoaderRoute: typeof DemoStartApiRequestRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api/demo/ping': {
      id: '/api/demo/ping'
      path: '/api/demo/ping'
      fullPath: '/api/demo/ping'
      preLoaderRoute: typeof ApiDemoPingRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api/auth/$': {
      id: '/api/auth/$'
      path: '/api/auth/$'
      fullPath: '/api/auth/$'
      preLoaderRoute: typeof ApiAuthSplatRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/demo/start/ssr/': {
      id: '/demo/start/ssr/'
      path: '/demo/start/ssr/'
      fullPath: '/demo/start/ssr/'
      preLoaderRoute: typeof DemoStartSsrIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/demo/start/ssr/spa-mode': {
      id: '/demo/start/ssr/spa-mode'
      path: '/demo/start/ssr/spa-mode'
      fullPath: '/demo/start/ssr/spa-mode'
      preLoaderRoute: typeof DemoStartSsrSpaModeRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/demo/start/ssr/full-ssr': {
      id: '/demo/start/ssr/full-ssr'
      path: '/demo/start/ssr/full-ssr'
      fullPath: '/demo/start/ssr/full-ssr'
      preLoaderRoute: typeof DemoStartSsrFullSsrRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/demo/start/ssr/data-only': {
      id: '/demo/start/ssr/data-only'
      path: '/demo/start/ssr/data-only'
      fullPath: '/demo/start/ssr/data-only'
      preLoaderRoute: typeof DemoStartSsrDataOnlyRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

export {}
