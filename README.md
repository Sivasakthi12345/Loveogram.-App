# LOVEOGRAM

An original, mobile-first social network starter built with React, TypeScript, Vite and Supabase.

## Current stage

- Responsive LOVEOGRAM dark interface
- Email/password sign-up and sign-in through Supabase Auth
- Social feed reads from `public.posts`
- Text post creation using `author_id` and `body`
- Build/type-check workflow through GitHub Actions

## Local setup

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set the Supabase project URL and the **publishable/anon key**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Run `npm run dev`.

Never place a Supabase service-role key or secret key in browser code, GitHub commits, or client environment variables.

## Supabase

This frontend is designed for the LOVEOGRAM Supabase project. The current database includes profiles, posts, follows, comments, reactions, conversations, messages, notifications, reports and blocks. Row Level Security is enabled; authorization must remain enforced by database policies, not by hiding UI controls.

The profile creation trigger uses the auth sign-up metadata. The initial signup form passes the chosen username as auth metadata.

## Build verification

```sh
npm run typecheck
npm run build
```

## Roadmap

1. Profile editing and profile images
2. Post media upload and reactions/comments
3. Follow requests and discovery
4. Realtime chat and notifications
5. Moderator/admin control center with server-side role checks

This is an early development build, not a production-ready release. Review RLS policies, validate all flows, add abuse controls and test backups before public launch.
