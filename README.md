# Fotoro

This is a clone of https://github.com/sambecker/exif-photo-blog with changes designed for private family photos, including enhanced security and privacy, and comments.  Name inspired by the Studio Ghibli film, My Neighbour `Totoro` and the Spanish word for photo: `foto`.

✨&nbsp;&nbsp;Additional Features
-
- Entire app is behind invitation-only authentication
- Photos are stored in a private AWS S3 bucket
- Photos are served through an authenticated endpoint
- Disabled right-click/touch context menu on photos

🛠️&nbsp;&nbsp;Installation
-
Please follow the original installation instructions: https://github.com/sambecker/exif-photo-blog?tab=readme-ov-file#%EF%B8%8Finstallation

Set up an AWS S3 bucket as described here: https://github.com/sambecker/exif-photo-blog?tab=readme-ov-file#aws-s3

But keep the default settings with `ACLs disabled` and `Block all public access enabled`.

🛡️‍️&nbsp;&nbsp;Site-wide auth guard
-
- If necessary, sign up for a free Supabase plan: https://supabase.com/dashboard/sign-up
- Create a new project 
- Go to: https://supabase.com/dashboard/project/[PROJECT_ID]/auth/templates to configure the email templates 
  - Change the Invite user link to: `{{ .SiteURL }}/setup?token_hash={{ .TokenHash }}&type=invite`
  - Change the Reset password link to: `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`
- Go to the API Settings page: https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api
  - Save the Project URL to the `NEXT_PUBLIC_SUPABASE_URL` environment variable. 
  - Save the anon public API key to the `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable. 
- Invite your first user at https://supabase.com/dashboard/project/[PROJECT_ID]/auth/users.

🗣️&nbsp;&nbsp;Comments
-
This just works if you set `NEXT_PUBLIC_SHOW_COMMENTS=1`


🌎&nbsp;&nbsp;Environment variables
-
- `NEXT_PUBLIC_ENHANCED_PRIVACY=1`: set this environment variable to enable the site-wide auth guard.
- `NEXT_PUBLIC_SHARE_DISABLED=1`: disables the share icon. 
- `NEXT_PUBLIC_HIDE_EXIF_DATA=1`: hides the exif data, in case none of your family cares.
- `NEXT_PUBLIC_HIDE_ZOOM_CONTROLS=1`: hide the zoom control. 
- `NEXT_PUBLIC_SHOW_COMMENTS=1`: allow users to leave comments on photos. 
- `NEXT_PUBLIC_SHOW_SIGN_OUT_TOP=1`: this shows the user's email and sign out button at the top of the screen, which I prefer.

🔁&nbsp;&nbsp;Syncing with exif-photo-blog
-
If you clone this repository and want to keep up to date with changes in the original `exif-photo-blog`:
- Add `exif-photo-blog` as a remote: `git remote add upstream git@github.com:sambecker/exif-photo-blog.git`
- Fetches changes: `git fetch upstream`
- Make sure you're on your main branch: `git checkout main`
- Merge the changes: `git merge upstream/main` (or rebase them: `git rebase upstream/main`)

✅&nbsp;&nbsp;Core changes
-
These are the main additions and changes to the original code, but not all:
```
.  
├── app/  
│   ├── (supabase)/  
│   │   ├── forgot-password/  
│   │   │   ├── actions.ts  
│   │   │   ├── confirmation/page.tsx  
│   │   │   └── page.tsx  
│   │   ├── login/  
│   │   │   ├── SignInForm.tsx  
│   │   │   ├── actions.ts  
│   │   │   └── page.tsx   
│   │   ├── reset-password/page.tsx  
│   │   └── setup/page.tsx    
│   └── api/  
│       ├── auth/supabase/  
│       │   ├── protected-image/[key]/route.ts  
│       │   └── signout/route.ts  
│       └── comments/  
│           └── [photoId]/  
│               ├── count/route.ts  
│               └── route.ts  
├── middleware.ts    
└── src/   
    ├── auth/supabase/  
    │   ├── actions.ts  
    │   ├── client.ts  
    │   ├── middleware.ts   
    │   └── server.ts   
    ├── comment/  
    │   ├── CommentForm.tsx  
    │   ├── CommentList.tsx  
    │   ├── PhotoComments.tsx   
    │   ├── dateUtils.ts  
    │   ├── db/  
    │   │   ├── index.ts    
    │   │   └── query.ts   
    │   └── index.ts  
    ├── components/image/  
    │   └── ImageWithFallbackEnhanced.tsx  
    └── state/  
        ├── AppState.ts  
        └── AppStateProvider.tsx  
```