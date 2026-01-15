# Test Routes Expert - Setup Instructions

## ✅ Completed Steps

The following have been configured automatically:

- ✅ React Native project initialized
- ✅ All dependencies installed
- ✅ Environment variables configured (.env file created)
- ✅ Babel configured for environment variables
- ✅ Mapbox SDK configured for iOS (Podfile, Info.plist, .netrc)
- ✅ Mapbox SDK configured for Android (build.gradle, AndroidManifest.xml)
- ✅ Map Matching pipeline script created and tested
- ✅ Route successfully processed (stoke_route_1.geojson → 946 navigation points with 1055 turn instructions)
- ✅ Database seeding script created

## ⚠️ Required Manual Steps

### Step 1: Set Up Supabase Database Schema

**IMPORTANT**: You must complete this step before the app will work!

1. Open your Supabase SQL Editor:
   - Go to: https://zpfkvhnfbbimsfghmjiz.supabase.co
   - Click "SQL Editor" in the left sidebar

2. Copy and paste the entire contents of:
   ```
   TestRoutesExpert/scripts/supabase_schema.sql
   ```

3. Click "Run" to execute the SQL

4. Verify success:
   - You should see "Success. No rows returned" or similar
   - Check the "Table Editor" - you should see:
     - `test_centers` table with 1 row (Stoke-on-Trent)
     - `routes` table (empty for now)

### Step 2: Seed the Processed Route

After the database schema is created, run this command to import the processed route:

```bash
cd TestRoutesExpert/scripts
node seed_database.js ./stoke_route_1_processed.json stoke-on-trent-newcastle-under-lyme
```

**Expected output**:
```
✅ Route inserted with ID: <uuid>
🎉 Success! Route is now in the database and ready to use.
```

**Verify in Supabase**:
- Go to Table Editor → routes
- You should see 1 route with:
  - `is_processed = true`
  - `mapbox_route` field populated
  - 946 navigation points

### Step 3: Install iOS Pods (Required for iOS)

```bash
cd TestRoutesExpert/ios
pod install
cd ..
```

**Note**: This may take 5-10 minutes on first run.

## 📁 Project Structure

```
TestRoutesExpert/
├── .env                      # Environment variables (API keys)
├── src/
│   ├── screens/             # React Native screens (to be created)
│   ├── services/            # Supabase & Mapbox services (to be created)
│   ├── store/               # Zustand state management (to be created)
│   └── navigation/          # React Navigation setup (to be created)
├── scripts/
│   ├── supabase_schema.sql  # Database schema (RUN THIS FIRST!)
│   ├── process_routes.js    # Map Matching pipeline
│   ├── seed_database.js     # Import processed routes
│   └── stoke_route_1_processed.json  # Processed navigation route
├── ios/                     # iOS native code
└── android/                 # Android native code
```

## 🧪 Testing Database Connection

To verify your Supabase setup is working:

```bash
cd TestRoutesExpert/scripts
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
supabase.from('test_centers').select('*').then(({data}) => console.log('✅ Connected! Centers:', data.length));
"
```

## 🚀 Next Steps (After Manual Steps Complete)

Once you've completed the manual steps above, the app development will continue with:

1. ✅ Supabase client service creation
2. ✅ Zustand state stores setup
3. ✅ HomeScreen implementation (list test centers)
4. ✅ TestCenterScreen (show routes)
5. ✅ RouteDetailScreen (map preview)
6. ✅ NavigationScreen (turn-by-turn with re-routing DISABLED)
7. ✅ iOS/Android testing

## 🔑 API Keys Reference

Your API keys are stored in `.env`:

- **Mapbox Public Token**: `pk.eyJ1IjoiYmV6emluIi...`
- **Mapbox Secret Token**: `sk.eyJ1IjoiYmV6emluIi...`
- **Supabase URL**: `https://zpfkvhnfbbimsfghmjiz.supabase.co`
- **Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**⚠️ IMPORTANT**: Never commit `.env` to git! It's already in `.gitignore`.

## 🐛 Troubleshooting

### "Test center not found" error
→ You haven't run `supabase_schema.sql` yet. See Step 1 above.

### "MAPBOX_PUBLIC_TOKEN not found"
→ Make sure `.env` file exists in `TestRoutesExpert/` directory

### iOS build fails with Mapbox error
→ Run `pod install` in the `ios/` directory

### Android build fails
→ Check that `MAPBOX_DOWNLOADS_TOKEN` is in `android/gradle.properties`

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify all manual steps above are completed
3. Check that `.env` file has all required keys
4. Ensure you've run `npm install` in both root and `scripts/` folders

---

**Ready to continue?** After completing the manual steps, let me know and I'll continue building the app!
