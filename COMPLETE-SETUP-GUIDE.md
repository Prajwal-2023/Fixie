# 🔧 **COMPLETE SETUP GUIDE WITH YOUR EMAIL PATTERN**

## 📧 **Your Email Setup:**
- **Admin**: `prajwal.mac2025+fixieadmin@gmail.com` 
- **Agent**: `prajwal.mac2025+fixieagent@gmail.com`
- **User**: `prajwal.mac2025+fixieuser@gmail.com` (or any other email)

## 🗂️ **Admin Can Create Accounts:**
Any email with `+admin@` gets admin role (e.g., `john+admin@company.com`)
Any email with `+agent@` gets agent role (e.g., `jane+agent@company.com`)

---

## 🔥 **EXACT STEPS TO FIX EVERYTHING:**

### **Step 1: Clean Up Database**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content from: `sql/cleanup-first.sql`
3. Paste and click **"RUN"**
4. Should see: "All old tables and functions have been cleaned up!"

### **Step 2: Create Fresh Setup**
1. Copy entire content from: `sql/setup-with-your-email.sql`
2. Paste and click **"RUN"**
3. Should see: "Database setup complete! You can now sign up with prajwal.mac2025+fixieadmin@gmail.com and get admin access!"

### **Step 3: Create Your Admin Account**
1. Go to: **http://localhost:8080/**
2. Click **"Create Account"** (NOT "Sign In")
3. Enter:
   - **Email**: `prajwal.mac2025+fixieadmin@gmail.com`
   - **Password**: `admin123` (or your choice)
   - **Name**: `Prajwal`
4. Click **"Create Account"**

### **Step 4: Verify Admin Access**
After account creation, you should see:
- ✅ **Admin** badge in your profile
- ✅ **All menu items** (Users, Settings) visible
- ✅ **Full access** to everything

### **Step 5: Create More Test Accounts**
1. **Agent Account**:
   - Email: `prajwal.mac2025+fixieagent@gmail.com`
   - Password: `agent123`
   
2. **User Account**:
   - Email: `prajwal.mac2025+fixieuser@gmail.com`
   - Password: `user123`

---

## 🚨 **If "Invalid Credentials" Error:**

This happens when you try to **Sign In** before creating accounts. Fix:

1. **Always use "Create Account" first** - never "Sign In" for first time
2. **Check email spelling** - must be exact
3. **Use different passwords** for each account
4. **Clear browser cache** (Cmd+Shift+R)

---

## 🎯 **Pattern Examples for Admin Account Creation:**

As admin, you can create accounts like:
- `john+admin@company.com` → Gets admin role
- `jane+agent@support.com` → Gets agent role  
- `bob+admin@anywhere.org` → Gets admin role
- `mary@normal.com` → Gets user role

The `+admin` and `+agent` patterns work with ANY domain!

---

## ✅ **Expected Results:**

**After Setup:**
- Database: 5 tables created with sample data
- Authentication: Working with role-based access
- Your Email: Auto-admin role assignment
- App: Full enterprise features working

**Test with your emails and let me know if you see any errors!** 🚀
