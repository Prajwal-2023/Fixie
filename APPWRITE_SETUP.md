# Appwrite Setup Guide for Fixie Analytics

## 🚀 Quick Setup Steps

### 1. **Find Your Database ID**
1. Go to your Appwrite Console: https://cloud.appwrite.io
2. Navigate to your "FixieAssistant" project
3. Click on "Databases" in the left sidebar
4. Copy your Database ID (it should look like: `68de85a40019df3e9fa5` or similar)

### 2. **Update Environment Variables**
Open your `.env` file and replace `YOUR_DATABASE_ID_HERE` with your actual Database ID:
```env
VITE_APPWRITE_DATABASE_ID = "your_actual_database_id_here"
```

### 3. **Verify Your Table Structure**
Make sure your "Fixie Analytics" table (ID: `68de872900169d080e46`) has these columns:

| Column Name | Type | Required | Index |
|-------------|------|----------|-------|
| ticket_id   | String | Yes | Yes |
| issue       | String | Yes | No |
| resolution  | String | Yes | No |
| status      | String | Yes | Yes |
| confidence  | Integer | Yes | No |
| date        | String | Yes | Yes |
| agent_notes | String | No | No |

### 4. **Set Column Attributes**
In your Appwrite Console:
1. Go to Database → Fixie Analytics table
2. For each column, make sure:
   - **ticket_id**: String, Required, Array: No
   - **issue**: String, Required, Array: No  
   - **resolution**: String, Required, Array: No, Size: 500 (to handle longer text)
   - **status**: String, Required, Array: No
   - **confidence**: Integer, Required, Array: No
   - **date**: String, Required, Array: No
   - **agent_notes**: String, Optional, Array: No, Size: 1000

### 5. **Set Permissions**
1. Go to Settings → Permissions in your table
2. Add these permissions:
   - **Create**: Any (or specific user roles)
   - **Read**: Any (or specific user roles)
   - **Update**: Any (or specific user roles)
   - **Delete**: Any (or specific user roles)

## 🔧 **What's Already Connected**

✅ **React Components Updated**:
- `FeedbackForm.tsx` - Now saves to Appwrite
- `Analytics.tsx` - Now reads from Appwrite
- Database service created in `src/lib/appwrite.ts`

✅ **Features Working**:
- Save feedback with ticket IDs
- Real-time analytics dashboard
- CSV export functionality
- Data persistence across sessions

## 🧪 **Testing Your Setup**

1. **Start your dev server**: `npm run dev`
2. **Submit a test issue** and provide feedback
3. **Check Appwrite Console** to see if data appears in your table
4. **Visit Analytics page** to see the data visualized
5. **Export CSV** to verify all data is being stored correctly

## 🎯 **Your Table Structure**

Your current Appwrite setup:
- **Project ID**: `68de85a40019df3e9fa5`
- **Project Name**: `FixieAssistant`
- **Endpoint**: `https://fra.cloud.appwrite.io/v1`
- **Table ID**: `68de872900169d080e46`
- **Table Name**: `Fixie Analytics`

## ❓ **Need Additional Tables?**

Based on your current needs, **ONE table is sufficient** for now. However, you might want to consider adding these tables later:

### Optional Future Tables:

1. **Resolution Templates** (for common solutions)
   - `id`, `title`, `steps`, `category`, `success_rate`

2. **Agent Performance** (for individual agent tracking)  
   - `agent_id`, `name`, `total_tickets`, `success_rate`, `avg_resolution_time`

3. **Issue Categories** (for better organization)
   - `category_id`, `name`, `description`, `color`

But for now, **your single "Fixie Analytics" table handles everything!** 🎉

## 🚨 **Troubleshooting**

If you see errors:
1. **"Database ID not configured"** → Add your Database ID to `.env`
2. **"Permission denied"** → Check table permissions in Appwrite Console
3. **"Document not found"** → Verify table ID `68de872900169d080e46` exists
4. **Network errors** → Check if Appwrite endpoint is correct

## 📞 **Need Help?**
Just let me know if you need help with any of these steps!
