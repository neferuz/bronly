import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Skip static assets, api requests, and root
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  const pathParts = pathname.split('/').filter(Boolean)
  const systemRoutes = ['profile', 'history']

  // If it's a direct system route (like /profile), let Next.js handle it
  if (systemRoutes.includes(pathParts[0])) {
    return NextResponse.next()
  }

  // Otherwise, the first part is the dynamic business ID (e.g., /elite or /elite/profile)
  const businessId = pathParts[0]
  const remainingParts = pathParts.slice(1)

  // Resolve target path (e.g. /profile or /)
  const targetPath = remainingParts.length > 0 ? `/${remainingParts.join('/')}` : '/'

  // Rewrite internally to the target route with b parameter
  url.pathname = targetPath
  url.searchParams.set('b', businessId)

  return NextResponse.rewrite(url)
}
