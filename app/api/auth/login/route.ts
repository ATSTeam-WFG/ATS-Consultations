import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password: submittedPassword } = await request.json()

  if (!email || !submittedPassword) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  // Check allowlist
  const allowed = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())

  if (!allowed.includes(email.toLowerCase())) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 403 })
  }

  const password = process.env.APP_PASSWORD!

  if (submittedPassword !== password) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }
  const cookieStore = await cookies()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Find or create user, always ensure password is set
  const { data: { users } } = await admin.auth.admin.listUsers()
  const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (existingUser) {
    // Update password to shared password (handles magic-link-only accounts)
    await admin.auth.admin.updateUserById(existingUser.id, { password })
  } else {
    // Create new account
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
  }

  // Sign in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 })
  }

  return NextResponse.json({ data: { success: true } })
}
