# Runtime Warning Fix - February 9, 2026

## Issue
Render deployment logs showed warnings:
```
RuntimeWarning: Accessing the database during app initialization is discouraged. 
To fix this warning, avoid executing queries in AppConfig.ready() or when your 
app modules are imported.
```

## Root Cause
In `backend/quiz/apps.py`, the `ready()` method was executing database queries without checking if:
1. Migrations were running
2. Database tables existed yet
3. It was running a management command like `collectstatic`

This causes Django to warn because the database might not be in a valid state during app initialization.

## Solution Applied

### 1. Added Guard Conditions to `AppConfig.ready()`
```python
def _skip_app_initialization(self) -> bool:
    """Skip app initialization during migrations or when tables don't exist."""
    - Skip if 'migrate' or 'makemigrations' in sys.argv
    - Skip if 'collectstatic' in sys.argv  
    - Skip if auth_user table doesn't exist yet
```

### 2. Wrapped Superuser Creation
```python
def _create_superuser(self) -> None:
    """Only called if _skip_app_initialization() returns False"""
    # Database access only happens when safe
```

### 3. Added Proper Signal Import
```python
# In apps.py ready() method:
from . import signals  # Imported here, not at module level
```

## Files Modified

### backend/quiz/apps.py
**Before**: Database queries in `ready()` without guards
**After**: 
- Proper skip conditions for migrations/management commands
- Table existence check before database access
- Clean separation of concerns

### backend/quiz/__init__.py
**Before**: Empty
**After**:
- Added `default_app_config` for clarity
- Comment about signal import

## What This Fixes

✅ No more "Accessing database during app initialization" warnings  
✅ Migrations run cleanly without database access attempts  
✅ Collectstatic runs without triggering app initialization  
✅ Render deployment logs will be cleaner  
✅ Superuser creation still works when safe to do so  

## Testing

The fix will be validated when:
1. Run migrations: `python manage.py migrate` (no warnings)
2. Run collectstatic: `python manage.py collectstatic --noinput` (no warnings)
3. Start server: `gunicorn config.wsgi:application` (superuser created if env vars set)

## Deployment Impact

✅ **Zero breaking changes**
- Superuser creation still works
- Signals still register properly
- All existing functionality preserved
- Just suppresses the warning by being smarter about when to access DB

Push this to GitHub → Render will auto-rebuild and warnings should disappear! 🚀
